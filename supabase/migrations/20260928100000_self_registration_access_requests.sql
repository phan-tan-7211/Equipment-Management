-- Self-registration access requests.
-- A verified Auth user may request access, but only an active Platform Admin
-- can assign an organization role and create the membership.

BEGIN;

CREATE TABLE private.workspace_access_requests (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  status text NOT NULL DEFAULT 'pending',
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  assigned_role text,
  requested_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason text,
  CONSTRAINT workspace_access_requests_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  CONSTRAINT workspace_access_requests_role_check
    CHECK (assigned_role IS NULL OR assigned_role IN ('owner', 'admin', 'member', 'viewer', 'requestor')),
  CONSTRAINT workspace_access_requests_review_check
    CHECK (
      (status = 'pending' AND reviewed_at IS NULL AND reviewed_by IS NULL)
      OR (status <> 'pending' AND reviewed_at IS NOT NULL)
    )
);

CREATE UNIQUE INDEX workspace_access_requests_one_pending_per_user_idx
  ON private.workspace_access_requests (user_id)
  WHERE status = 'pending';

CREATE INDEX workspace_access_requests_status_requested_idx
  ON private.workspace_access_requests (status, requested_at DESC);

ALTER TABLE private.workspace_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.workspace_access_requests FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.workspace_access_requests FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ensure_workspace_access_request()
RETURNS TABLE(
  request_id uuid,
  request_status text,
  organization_id uuid,
  organization_name text,
  assigned_role text,
  reviewed_at timestamptz,
  rejection_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, extensions
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_display_name text;
  v_request private.workspace_access_requests;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Authentication required';
  END IF;

  SELECT u.email, COALESCE(NULLIF(p.name, ''), u.email)
  INTO v_email, v_display_name
  FROM auth.users AS u
  LEFT JOIN public.profiles AS p ON p.id = u.id
  WHERE u.id = v_user_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Authenticated user email is required';
  END IF;

  IF public.is_platform_admin(v_user_id) OR EXISTS (
    SELECT 1 FROM public.organization_members AS om
    WHERE om.user_id = v_user_id AND om.status = 'active'
  ) THEN
    RETURN QUERY SELECT NULL::uuid, 'already_authorized'::text, NULL::uuid,
      NULL::text, NULL::text, NULL::timestamptz, NULL::text;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.organization_invitations AS oi
    WHERE public.normalize_email(oi.email) = public.normalize_email(v_email)
      AND oi.status = 'pending' AND oi.expires_at > pg_catalog.now()
  ) THEN
    UPDATE private.workspace_access_requests
    SET status = 'cancelled', reviewed_at = pg_catalog.now(), reviewed_by = v_user_id,
        rejection_reason = 'Superseded by organization invitation'
    WHERE user_id = v_user_id AND status = 'pending';
    RETURN QUERY SELECT NULL::uuid, 'invitation_pending'::text, NULL::uuid,
      NULL::text, NULL::text, NULL::timestamptz, NULL::text;
    RETURN;
  END IF;

  SELECT * INTO v_request
  FROM private.workspace_access_requests AS ar
  WHERE ar.user_id = v_user_id AND ar.status = 'pending'
  ORDER BY ar.requested_at DESC
  LIMIT 1;

  IF v_request.id IS NULL THEN
    INSERT INTO private.workspace_access_requests (user_id, email, display_name)
    VALUES (v_user_id, public.normalize_email(v_email), v_display_name)
    RETURNING * INTO v_request;
  END IF;

  RETURN QUERY
  SELECT v_request.id, v_request.status, v_request.organization_id,
    org.name, v_request.assigned_role, v_request.reviewed_at, v_request.rejection_reason
  FROM (SELECT 1) AS ignored
  LEFT JOIN public.organizations AS org ON org.id = v_request.organization_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.ensure_workspace_access_request() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_workspace_access_request() TO authenticated;
-- rpc-authenticated-grant-allowed: ensure_workspace_access_request

CREATE OR REPLACE FUNCTION public.platform_list_access_requests(
  p_status text DEFAULT 'pending'
)
RETURNS TABLE(
  request_id uuid,
  user_id uuid,
  email text,
  display_name text,
  request_status text,
  requested_at timestamptz,
  organization_id uuid,
  organization_name text,
  assigned_role text,
  reviewed_at timestamptz,
  rejection_reason text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Platform Admin authority required';
  END IF;
  IF p_status IS NOT NULL AND p_status NOT IN ('pending', 'approved', 'rejected', 'cancelled') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid access request status';
  END IF;

  RETURN QUERY
  SELECT ar.id, ar.user_id, ar.email, ar.display_name, ar.status, ar.requested_at,
    ar.organization_id, org.name, ar.assigned_role, ar.reviewed_at, ar.rejection_reason
  FROM private.workspace_access_requests AS ar
  LEFT JOIN public.organizations AS org ON org.id = ar.organization_id
  WHERE p_status IS NULL OR ar.status = p_status
  ORDER BY ar.requested_at ASC;
END;
$function$;

REVOKE ALL ON FUNCTION public.platform_list_access_requests(text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.platform_list_access_requests(text) TO authenticated;
-- rpc-authenticated-grant-allowed: platform_list_access_requests

CREATE OR REPLACE FUNCTION public.platform_approve_access_request(
  p_request_id uuid,
  p_organization_id uuid,
  p_role text
)
RETURNS TABLE(request_id uuid, user_id uuid, organization_id uuid, assigned_role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_request private.workspace_access_requests;
BEGIN
  IF v_caller IS NULL OR NOT public.is_platform_admin(v_caller) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Platform Admin authority required';
  END IF;
  IF p_role IS NULL OR p_role NOT IN ('owner', 'admin', 'member', 'viewer', 'requestor') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid organization role';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations AS org
    WHERE org.id = p_organization_id AND org.lifecycle_status = 'active'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Active organization is required';
  END IF;

  SELECT * INTO v_request
  FROM private.workspace_access_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_request.id IS NULL OR v_request.status <> 'pending' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Access request is no longer pending';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.organization_members AS om
    WHERE om.user_id = v_request.user_id AND om.status = 'active'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'User already has active organization access';
  END IF;

  INSERT INTO public.organization_members (organization_id, user_id, role, status, access_source)
  VALUES (p_organization_id, v_request.user_id, p_role, 'active', 'manual');

  UPDATE private.workspace_access_requests
  SET status = 'approved', organization_id = p_organization_id, assigned_role = p_role,
      reviewed_at = pg_catalog.now(), reviewed_by = v_caller, rejection_reason = NULL
  WHERE id = v_request.id;

  RETURN QUERY SELECT v_request.id, v_request.user_id, p_organization_id, p_role;
END;
$function$;

REVOKE ALL ON FUNCTION public.platform_approve_access_request(uuid, uuid, text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.platform_approve_access_request(uuid, uuid, text) TO authenticated;
-- rpc-authenticated-grant-allowed: platform_approve_access_request

CREATE OR REPLACE FUNCTION public.platform_reject_access_request(
  p_request_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS TABLE(request_id uuid, request_status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL OR NOT public.is_platform_admin(v_caller) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Platform Admin authority required';
  END IF;

  UPDATE private.workspace_access_requests
  SET status = 'rejected', reviewed_at = pg_catalog.now(), reviewed_by = v_caller,
      rejection_reason = NULLIF(pg_catalog.btrim(COALESCE(p_reason, '')), '')
  WHERE id = p_request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Access request is no longer pending';
  END IF;

  RETURN QUERY SELECT p_request_id, 'rejected'::text;
END;
$function$;

REVOKE ALL ON FUNCTION public.platform_reject_access_request(uuid, text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.platform_reject_access_request(uuid, text) TO authenticated;
-- rpc-authenticated-grant-allowed: platform_reject_access_request

COMMENT ON TABLE private.workspace_access_requests IS
  'Backend-owned requests from authenticated users without organization access; direct client table access is prohibited.';
COMMENT ON FUNCTION public.ensure_workspace_access_request() IS
  'Idempotently records self-registration access requests without granting organization membership.';
COMMENT ON FUNCTION public.platform_approve_access_request(uuid, uuid, text) IS
  'Platform Admin-only approval that atomically assigns an organization role and creates membership.';

COMMIT;
