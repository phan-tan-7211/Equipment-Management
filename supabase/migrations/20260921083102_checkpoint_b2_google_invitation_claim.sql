-- Checkpoint B2: Google-authenticated invitation claims.
--
-- Authentication establishes the auth.users identity. This migration keeps
-- organization authorization in the existing invitation acceptance RPC.

BEGIN;

-- Store every organization role already used by the application. Normal
-- organization owners/admins remain limited to creating admin/member invites;
-- service_role is the trusted path for future platform-managed OWNER invites.
ALTER TABLE public.organization_invitations
  DROP CONSTRAINT organization_invitations_role_check;

ALTER TABLE public.organization_invitations
  ADD CONSTRAINT organization_invitations_role_check
  CHECK (role = ANY (ARRAY['owner', 'admin', 'member', 'viewer', 'requestor']::text[]));

DROP POLICY IF EXISTS users_create_invitations ON public.organization_invitations;
CREATE POLICY users_create_invitations
  ON public.organization_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_admin((SELECT auth.uid()), organization_id)
    AND role IN ('admin', 'member')
  );

CREATE OR REPLACE FUNCTION public.prevent_untrusted_invitation_scope_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND COALESCE(auth.role(), '') <> 'service_role'
     AND (
       NEW.organization_id IS DISTINCT FROM OLD.organization_id
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.role IS DISTINCT FROM OLD.role
       OR NEW.invited_by IS DISTINCT FROM OLD.invited_by
       OR NEW.invitation_token IS DISTINCT FROM OLD.invitation_token
     ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'Invitation authorization fields cannot be changed';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_untrusted_invitation_scope_changes() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prevent_untrusted_invitation_scope_changes() FROM anon;
REVOKE ALL ON FUNCTION public.prevent_untrusted_invitation_scope_changes() FROM authenticated;

DROP TRIGGER IF EXISTS prevent_untrusted_invitation_scope_changes
  ON public.organization_invitations;
CREATE TRIGGER prevent_untrusted_invitation_scope_changes
  BEFORE UPDATE ON public.organization_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_untrusted_invitation_scope_changes();

CREATE OR REPLACE FUNCTION public.create_invitation_atomic(
  p_organization_id uuid,
  p_email text,
  p_role text,
  p_message text DEFAULT NULL,
  p_invited_by uuid DEFAULT auth.uid()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
SET row_security TO 'off'
AS $$
DECLARE
  invitation_id uuid;
  caller_id uuid := auth.uid();
  is_service_role boolean := COALESCE(auth.role() = 'service_role', false);
BEGIN
  IF p_role NOT IN ('owner', 'admin', 'member', 'viewer', 'requestor') THEN
    RAISE EXCEPTION 'INVALID_ROLE: Unsupported organization invitation role';
  END IF;

  IF NOT is_service_role THEN
    IF caller_id IS NULL OR p_invited_by IS DISTINCT FROM caller_id THEN
      RAISE EXCEPTION 'PERMISSION_DENIED: Invitation creator must match the authenticated user';
    END IF;

    IF p_role NOT IN ('admin', 'member') THEN
      RAISE EXCEPTION 'PERMISSION_DENIED: This invitation role requires a trusted service';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.organization_members
      WHERE user_id = caller_id
        AND organization_id = p_organization_id
        AND role IN ('owner', 'admin')
        AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'PERMISSION_DENIED: User does not have admin privileges';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.organization_invitations
    WHERE organization_id = p_organization_id
      AND lower(trim(email)) = lower(trim(p_email))
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_INVITATION: An active invitation already exists for this email';
  END IF;

  INSERT INTO public.organization_invitations (
    organization_id,
    email,
    role,
    message,
    invited_by,
    expires_at,
    status,
    invitation_token
  ) VALUES (
    p_organization_id,
    lower(trim(p_email)),
    p_role,
    p_message,
    p_invited_by,
    now() + interval '7 days',
    'pending',
    gen_random_uuid()
  )
  RETURNING id INTO invitation_id;

  RETURN invitation_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'DUPLICATE_INVITATION: An active invitation already exists for this email';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'INVITATION_ERROR: %', SQLERRM;
END;
$$;

REVOKE ALL ON FUNCTION public.create_invitation_atomic(uuid, text, text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_invitation_atomic(uuid, text, text, text, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.create_invitation_atomic(uuid, text, text, text, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_invitation_atomic(uuid, text, text, text, uuid)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.accept_invitation_atomic(
  p_invitation_token uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
SET row_security TO 'off'
AS $$
DECLARE
  invitation_record RECORD;
  org_name text;
  user_email text;
  user_email_confirmed_at timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT id, organization_id, email, role, status, expires_at, accepted_by
  INTO invitation_record
  FROM public.organization_invitations
  WHERE invitation_token = p_invitation_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found');
  END IF;

  SELECT lower(trim(email)), email_confirmed_at
  INTO user_email, user_email_confirmed_at
  FROM auth.users
  WHERE id = p_user_id;

  IF user_email IS NULL
     OR user_email_confirmed_at IS NULL
     OR user_email <> lower(trim(invitation_record.email)) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Verified user email does not match invitation email'
    );
  END IF;

  IF invitation_record.role NOT IN ('owner', 'admin', 'member', 'viewer', 'requestor') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation role is invalid');
  END IF;

  SELECT name INTO org_name
  FROM public.organizations
  WHERE id = invitation_record.organization_id;

  -- OAuth redirects and browser retries can repeat the callback. A replay by
  -- the same verified identity is successful only while its membership exists.
  IF invitation_record.status = 'accepted'
     AND invitation_record.accepted_by = p_user_id
     AND EXISTS (
       SELECT 1
       FROM public.organization_members
       WHERE user_id = p_user_id
         AND organization_id = invitation_record.organization_id
         AND status = 'active'
     ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'organization_id', invitation_record.organization_id,
      'organization_name', COALESCE(org_name, 'Unknown Organization'),
      'role', invitation_record.role,
      'already_accepted', true
    );
  END IF;

  IF invitation_record.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation has already been processed');
  END IF;

  IF invitation_record.expires_at <= now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation has expired');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = p_user_id
      AND organization_id = invitation_record.organization_id
      AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is already a member of this organization');
  END IF;

  UPDATE public.organization_invitations
  SET status = 'accepted',
      accepted_at = now(),
      accepted_by = p_user_id,
      updated_at = now()
  WHERE id = invitation_record.id;

  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    role,
    status,
    access_source
  ) VALUES (
    invitation_record.organization_id,
    p_user_id,
    invitation_record.role,
    'active',
    'invitation'
  );

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', invitation_record.organization_id,
    'organization_name', COALESCE(org_name, 'Unknown Organization'),
    'role', invitation_record.role,
    'already_accepted', false
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is already a member of this organization');
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to accept invitation. Please try again or contact support.'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_invitation_atomic(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_invitation_atomic(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.accept_invitation_atomic(uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation_atomic(uuid, uuid)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.accept_invitation_atomic(uuid, uuid) IS
  'Claims an invitation for the authenticated user after verified auth.users email matching; safe to replay after a successful claim.';

COMMIT;
