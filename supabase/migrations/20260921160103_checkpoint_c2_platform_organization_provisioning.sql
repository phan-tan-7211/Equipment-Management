-- Checkpoint C2: Platform Admin organization provisioning and Workspace
-- organization-creation retirement.

BEGIN;

CREATE OR REPLACE FUNCTION public.platform_create_organization_and_invite_owner(
  p_organization_name text,
  p_owner_email text,
  p_message text DEFAULT NULL
)
RETURNS TABLE(
  organization_id uuid,
  invitation_id uuid,
  owner_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, extensions
SET row_security = off
AS $function$
DECLARE
  v_caller_id uuid := auth.uid();
  v_organization_name text;
  v_owner_email text;
  v_organization_id uuid;
  v_invitation_id uuid;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'Authenticated Platform Admin required';
  END IF;

  IF NOT public.is_platform_admin(v_caller_id) THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'Platform Admin authority required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = v_caller_id
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23503',
      MESSAGE = 'Platform Admin profile is required for invitation attribution';
  END IF;

  v_organization_name := pg_catalog.regexp_replace(
    pg_catalog.btrim(COALESCE(p_organization_name, '')),
    '[[:space:]]+',
    ' ',
    'g'
  );

  IF pg_catalog.char_length(v_organization_name) < 2
     OR pg_catalog.char_length(v_organization_name) > 120 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'Organization name must contain between 2 and 120 characters';
  END IF;

  v_owner_email := pg_catalog.lower(pg_catalog.btrim(COALESCE(p_owner_email, '')));

  IF pg_catalog.char_length(v_owner_email) > 320
     OR v_owner_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'A valid owner email is required';
  END IF;

  -- Serialize case-insensitive organization-name checks without adding a new
  -- production-wide uniqueness constraint in this checkpoint.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(pg_catalog.lower(v_organization_name), 0)
  );

  IF EXISTS (
    SELECT 1
    FROM public.organizations AS o
    WHERE pg_catalog.lower(pg_catalog.btrim(o.name)) =
          pg_catalog.lower(v_organization_name)
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23505',
      MESSAGE = 'An organization with this name already exists';
  END IF;

  INSERT INTO public.organizations (
    name,
    plan,
    member_count,
    max_members,
    features
  )
  VALUES (
    v_organization_name,
    'free',
    0,
    5,
    ARRAY['Equipment Management', 'Work Orders', 'Team Management']
  )
  RETURNING id INTO v_organization_id;

  INSERT INTO public.organization_invitations (
    organization_id,
    email,
    role,
    message,
    invited_by,
    expires_at,
    status,
    invitation_token
  )
  VALUES (
    v_organization_id,
    v_owner_email,
    'owner',
    NULLIF(pg_catalog.btrim(COALESCE(p_message, '')), ''),
    v_caller_id,
    pg_catalog.now() + interval '7 days',
    'pending',
    extensions.gen_random_uuid()
  )
  RETURNING id INTO v_invitation_id;

  RETURN QUERY
  SELECT v_organization_id, v_invitation_id, v_owner_email;
END;
$function$;

REVOKE ALL ON FUNCTION public.platform_create_organization_and_invite_owner(text, text, text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.platform_create_organization_and_invite_owner(text, text, text)
  TO authenticated;

COMMENT ON FUNCTION public.platform_create_organization_and_invite_owner(text, text, text) IS
  'Atomically creates an empty organization and pending OWNER invitation for an active Platform Admin. Does not create membership.';

-- rpc-authenticated-grant-allowed: platform_create_organization_and_invite_owner

-- Null organization sessions were temporary first-time Workspace provisioning
-- sessions. They cannot be honored after that authority path is retired.
DELETE FROM public.google_workspace_oauth_sessions
WHERE organization_id IS NULL;

ALTER TABLE public.google_workspace_oauth_sessions
  ALTER COLUMN organization_id SET NOT NULL;

CREATE OR REPLACE FUNCTION public.create_google_workspace_oauth_session(
  p_organization_id uuid DEFAULT NULL,
  p_redirect_url text DEFAULT NULL,
  p_origin_url text DEFAULT NULL
)
RETURNS TABLE(session_token text, nonce text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_session_token text;
  v_expires_at timestamptz;
  v_nonce text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'User must be authenticated to create OAuth session';
  END IF;

  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '22004',
      MESSAGE = 'Existing organization is required to connect Google Workspace';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.organization_members AS om
    WHERE om.organization_id = p_organization_id
      AND om.user_id = v_user_id
      AND om.status = 'active'
      AND om.role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'Only active organization owners or admins can connect Google Workspace';
  END IF;

  v_session_token := pg_catalog.encode(extensions.gen_random_bytes(32), 'base64');
  v_nonce := pg_catalog.encode(extensions.gen_random_bytes(16), 'hex');
  v_expires_at := pg_catalog.now() + interval '1 hour';

  INSERT INTO public.google_workspace_oauth_sessions (
    session_token,
    organization_id,
    user_id,
    nonce,
    redirect_url,
    origin_url,
    expires_at
  )
  VALUES (
    v_session_token,
    p_organization_id,
    v_user_id,
    v_nonce,
    p_redirect_url,
    p_origin_url,
    v_expires_at
  );

  RETURN QUERY SELECT v_session_token, v_nonce, v_expires_at;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_google_workspace_oauth_session(uuid, text, text)
  FROM PUBLIC, anon, authenticated, service_role;
-- rpc-authenticated-grant-allowed: create_google_workspace_oauth_session
GRANT EXECUTE ON FUNCTION public.create_google_workspace_oauth_session(uuid, text, text)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_google_workspace_oauth_session(
  p_session_token text
)
RETURNS TABLE(
  organization_id uuid,
  user_id uuid,
  nonce text,
  redirect_url text,
  origin_url text,
  is_valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_session record;
BEGIN
  SELECT
    s.organization_id,
    s.user_id,
    s.nonce,
    s.redirect_url,
    s.origin_url,
    s.expires_at,
    s.used_at
  INTO v_session
  FROM public.google_workspace_oauth_sessions AS s
  WHERE s.session_token = p_session_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT NULL::uuid, NULL::uuid, NULL::text, NULL::text, NULL::text, false;
    RETURN;
  END IF;

  IF v_session.organization_id IS NULL
     OR v_session.used_at IS NOT NULL
     OR v_session.expires_at < pg_catalog.now()
     OR NOT EXISTS (
       SELECT 1
       FROM public.organization_members AS om
       WHERE om.organization_id = v_session.organization_id
         AND om.user_id = v_session.user_id
         AND om.status = 'active'
         AND om.role IN ('owner', 'admin')
     ) THEN
    RETURN QUERY
    SELECT v_session.organization_id, v_session.user_id, v_session.nonce,
           v_session.redirect_url, v_session.origin_url, false;
    RETURN;
  END IF;

  UPDATE public.google_workspace_oauth_sessions AS s
  SET used_at = pg_catalog.now()
  WHERE s.session_token = p_session_token;

  RETURN QUERY
  SELECT v_session.organization_id, v_session.user_id, v_session.nonce,
         v_session.redirect_url, v_session.origin_url, true;
END;
$function$;

REVOKE ALL ON FUNCTION public.validate_google_workspace_oauth_session(text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_google_workspace_oauth_session(text)
  TO service_role;

-- Keep the historical signatures for compatibility, but make every execution
-- path fail closed. Workspace is now an integration for an existing org only.
CREATE OR REPLACE FUNCTION public.auto_provision_workspace_organization(
  p_user_id uuid,
  p_domain text,
  p_organization_name text
)
RETURNS TABLE(organization_id uuid, domain text, already_existed boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
BEGIN
  RAISE EXCEPTION USING
    ERRCODE = '0A000',
    MESSAGE = 'Workspace organization auto-provisioning has been retired';
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_workspace_organization_for_domain(
  p_domain text,
  p_organization_name text
)
RETURNS TABLE(organization_id uuid, domain text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
BEGIN
  RAISE EXCEPTION USING
    ERRCODE = '0A000',
    MESSAGE = 'Workspace organization creation has been retired';
END;
$function$;

REVOKE ALL ON FUNCTION public.auto_provision_workspace_organization(uuid, text, text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.create_workspace_organization_for_domain(text, text)
  FROM PUBLIC, anon, authenticated, service_role;

-- rpc-authenticated-grant-revoked: create_workspace_organization_for_domain

COMMENT ON FUNCTION public.auto_provision_workspace_organization(uuid, text, text) IS
  'Retired by Checkpoint C2. Google Workspace cannot create organizations.';
COMMENT ON FUNCTION public.create_workspace_organization_for_domain(text, text) IS
  'Retired by Checkpoint C2. Google Workspace cannot create organizations.';

COMMIT;
