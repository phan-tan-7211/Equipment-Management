-- Preserve rejected access requests until the requester explicitly resubmits.
-- Request history remains private and is exposed only through guarded RPCs.

BEGIN;

DROP FUNCTION public.ensure_workspace_access_request();

CREATE FUNCTION public.ensure_workspace_access_request()
RETURNS TABLE(
  request_id uuid,
  request_status text,
  organization_id uuid,
  organization_name text,
  assigned_role text,
  reviewed_at timestamptz,
  rejection_reason text,
  reviewed_by_name text
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
      NULL::text, NULL::text, NULL::timestamptz, NULL::text, NULL::text;
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
      NULL::text, NULL::text, NULL::timestamptz, NULL::text, NULL::text;
    RETURN;
  END IF;

  SELECT * INTO v_request
  FROM private.workspace_access_requests AS ar
  WHERE ar.user_id = v_user_id
  ORDER BY ar.requested_at DESC
  LIMIT 1;

  IF v_request.id IS NULL OR v_request.status = 'cancelled' THEN
    INSERT INTO private.workspace_access_requests (user_id, email, display_name)
    VALUES (v_user_id, public.normalize_email(v_email), v_display_name)
    RETURNING * INTO v_request;
  END IF;

  RETURN QUERY
  SELECT v_request.id, v_request.status, v_request.organization_id,
    org.name, v_request.assigned_role, v_request.reviewed_at,
    v_request.rejection_reason, reviewer.name
  FROM (SELECT 1) AS ignored
  LEFT JOIN public.organizations AS org ON org.id = v_request.organization_id
  LEFT JOIN public.profiles AS reviewer ON reviewer.id = v_request.reviewed_by;
END;
$function$;

REVOKE ALL ON FUNCTION public.ensure_workspace_access_request() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_workspace_access_request() TO authenticated;
-- rpc-authenticated-grant-allowed: ensure_workspace_access_request

CREATE OR REPLACE FUNCTION public.resubmit_workspace_access_request()
RETURNS TABLE(
  request_id uuid,
  request_status text,
  requested_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, extensions
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_display_name text;
  v_latest private.workspace_access_requests;
  v_created private.workspace_access_requests;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Authentication required';
  END IF;

  IF public.is_platform_admin(v_user_id) OR EXISTS (
    SELECT 1 FROM public.organization_members AS om
    WHERE om.user_id = v_user_id AND om.status = 'active'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'User already has workspace access';
  END IF;

  SELECT u.email, COALESCE(NULLIF(p.name, ''), u.email)
  INTO v_email, v_display_name
  FROM auth.users AS u
  LEFT JOIN public.profiles AS p ON p.id = u.id
  WHERE u.id = v_user_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Authenticated user email is required';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.organization_invitations AS oi
    WHERE public.normalize_email(oi.email) = public.normalize_email(v_email)
      AND oi.status = 'pending' AND oi.expires_at > pg_catalog.now()
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Pending invitation must be used';
  END IF;

  SELECT * INTO v_latest
  FROM private.workspace_access_requests AS ar
  WHERE ar.user_id = v_user_id
  ORDER BY ar.requested_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_latest.id IS NULL OR v_latest.status <> 'rejected' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Only a rejected access request can be resubmitted';
  END IF;

  IF EXISTS (
    SELECT 1 FROM private.workspace_access_requests AS ar
    WHERE ar.user_id = v_user_id AND ar.status = 'pending'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'Access request is already pending';
  END IF;

  INSERT INTO private.workspace_access_requests (user_id, email, display_name)
  VALUES (v_user_id, public.normalize_email(v_email), v_display_name)
  RETURNING * INTO v_created;

  RETURN QUERY SELECT v_created.id, v_created.status, v_created.requested_at;
END;
$function$;

REVOKE ALL ON FUNCTION public.resubmit_workspace_access_request() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.resubmit_workspace_access_request() TO authenticated;
-- rpc-authenticated-grant-allowed: resubmit_workspace_access_request

DROP FUNCTION public.platform_list_access_requests(text);

CREATE FUNCTION public.platform_list_access_requests(
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
  reviewed_by_name text,
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
    ar.organization_id, org.name, ar.assigned_role, ar.reviewed_at,
    reviewer.name, ar.rejection_reason
  FROM private.workspace_access_requests AS ar
  LEFT JOIN public.organizations AS org ON org.id = ar.organization_id
  LEFT JOIN public.profiles AS reviewer ON reviewer.id = ar.reviewed_by
  WHERE p_status IS NULL OR ar.status = p_status
  ORDER BY ar.requested_at DESC;
END;
$function$;

REVOKE ALL ON FUNCTION public.platform_list_access_requests(text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.platform_list_access_requests(text) TO authenticated;
-- rpc-authenticated-grant-allowed: platform_list_access_requests

COMMENT ON FUNCTION public.ensure_workspace_access_request() IS
  'Returns the latest self-registration request without recreating a rejected request.';
COMMENT ON FUNCTION public.resubmit_workspace_access_request() IS
  'Allows an authenticated requester to explicitly resubmit only their latest rejected access request.';
COMMENT ON FUNCTION public.platform_list_access_requests(text) IS
  'Platform Admin-only access request history with reviewer display information.';

COMMIT;
