BEGIN;

ALTER TABLE public.organizations
  ADD COLUMN lifecycle_status text NOT NULL DEFAULT 'active',
  ADD COLUMN lifecycle_changed_at timestamptz,
  ADD COLUMN lifecycle_changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT organizations_lifecycle_status_check
    CHECK (lifecycle_status IN ('active', 'suspended'));

COMMENT ON COLUMN public.organizations.lifecycle_status IS
  'Backend-enforced organization lifecycle. Suspended organizations deny private tenant access and writes.';

DO $block$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE role = 'owner' AND status = 'active'
    GROUP BY organization_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'C3 migration blocked: an organization has multiple active owners; remediate before replay';
  END IF;
END;
$block$;

CREATE UNIQUE INDEX organization_members_one_active_owner_idx
  ON public.organization_members (organization_id)
  WHERE role = 'owner' AND status = 'active';

CREATE OR REPLACE FUNCTION public.is_organization_active(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
SET row_security = off
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations AS o
    WHERE o.id = p_organization_id AND o.lifecycle_status = 'active'
  );
$function$;

REVOKE ALL ON FUNCTION public.is_organization_active(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_organization_active(uuid) TO authenticated, service_role;
-- rpc-authenticated-grant-allowed: is_organization_active

CREATE OR REPLACE FUNCTION public.is_org_member(user_uuid uuid, org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
SET row_security = off
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members AS om
    JOIN public.organizations AS o ON o.id = om.organization_id
    WHERE om.user_id = user_uuid
      AND om.organization_id = org_id
      AND om.status = 'active'
      AND o.lifecycle_status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_org_admin(user_uuid uuid, org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
SET row_security = off
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members AS om
    JOIN public.organizations AS o ON o.id = om.organization_id
    WHERE om.user_id = user_uuid
      AND om.organization_id = org_id
      AND om.role IN ('owner', 'admin')
      AND om.status = 'active'
      AND o.lifecycle_status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.user_is_org_member(org_id uuid, check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
SET row_security = off
AS $function$
  SELECT public.is_org_member(check_user_id, org_id);
$function$;

CREATE OR REPLACE FUNCTION public.user_is_org_admin(org_id uuid, check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
SET row_security = off
AS $function$
  SELECT public.is_org_admin(check_user_id, org_id);
$function$;

CREATE OR REPLACE FUNCTION private.enforce_organization_member_authority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
DECLARE
  v_old_owner boolean := false;
  v_new_owner boolean := false;
  v_org_id uuid;
BEGIN
  v_org_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.organization_id ELSE NEW.organization_id END;

  IF EXISTS (
    SELECT 1 FROM public.organizations AS o
    WHERE o.id = v_org_id AND o.lifecycle_status = 'suspended'
  ) OR (
    TG_OP <> 'DELETE'
    AND NOT EXISTS (SELECT 1 FROM public.organizations AS o WHERE o.id = v_org_id)
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Organization is suspended';
  END IF;

  IF TG_OP <> 'INSERT' THEN
    v_old_owner := OLD.role = 'owner' AND OLD.status = 'active';
  END IF;
  IF TG_OP <> 'DELETE' THEN
    v_new_owner := NEW.role = 'owner' AND NEW.status = 'active';
  END IF;

  IF current_user <> 'postgres' AND (v_old_owner OR v_new_owner) THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'Active OWNER membership may only be changed by a trusted ownership operation';
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$function$;

REVOKE ALL ON FUNCTION private.enforce_organization_member_authority() FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS enforce_organization_member_authority_trigger ON public.organization_members;
CREATE TRIGGER enforce_organization_member_authority_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION private.enforce_organization_member_authority();

DROP POLICY IF EXISTS organization_members_insert ON public.organization_members;
DROP POLICY IF EXISTS organization_members_update ON public.organization_members;
DROP POLICY IF EXISTS organization_members_delete ON public.organization_members;
DROP POLICY IF EXISTS organization_members_insert_safe ON public.organization_members;
DROP POLICY IF EXISTS organization_members_update_safe ON public.organization_members;
DROP POLICY IF EXISTS organization_members_delete_safe ON public.organization_members;
DROP POLICY IF EXISTS organization_members_select_safe ON public.organization_members;

CREATE POLICY organization_members_select_safe ON public.organization_members
  FOR SELECT TO authenticated
  USING (
    public.is_organization_active(organization_id)
    AND (user_id = (SELECT auth.uid()) OR public.user_is_org_member(organization_id))
  );

CREATE POLICY organization_members_insert_safe ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (
    role <> 'owner'
    AND public.user_is_org_admin(organization_id)
  );

CREATE POLICY organization_members_update_safe ON public.organization_members
  FOR UPDATE TO authenticated
  USING (
    role <> 'owner'
    AND public.user_is_org_admin(organization_id)
  )
  WITH CHECK (
    role <> 'owner'
    AND public.user_is_org_admin(organization_id)
  );

CREATE POLICY organization_members_delete_safe ON public.organization_members
  FOR DELETE TO authenticated
  USING (
    role <> 'owner'
    AND public.user_is_org_admin(organization_id)
  );

CREATE OR REPLACE FUNCTION private.enforce_active_organization_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
DECLARE
  v_org_id uuid;
BEGIN
  v_org_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.organization_id ELSE NEW.organization_id END;
  IF EXISTS (
    SELECT 1 FROM public.organizations AS o
    WHERE o.id = v_org_id AND o.lifecycle_status = 'suspended'
  ) OR (
    TG_OP <> 'DELETE'
    AND NOT EXISTS (SELECT 1 FROM public.organizations AS o WHERE o.id = v_org_id)
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Organization is suspended';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$function$;

REVOKE ALL ON FUNCTION private.enforce_active_organization_write() FROM PUBLIC, anon, authenticated, service_role;

DO $triggers$
DECLARE
  v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'organization_invitations',
    'google_workspace_oauth_sessions',
    'google_workspace_credentials',
    'google_workspace_directory_users',
    'organization_member_claims'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS enforce_active_organization_write_trigger ON public.%I', v_table);
    EXECUTE format(
      'CREATE TRIGGER enforce_active_organization_write_trigger BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.enforce_active_organization_write()',
      v_table
    );
  END LOOP;
END;
$triggers$;

CREATE OR REPLACE FUNCTION public.platform_suspend_organization(
  p_organization_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_name text;
  v_previous text;
BEGIN
  IF v_actor IS NULL OR NOT public.is_platform_admin(v_actor) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Platform Admin authority required';
  END IF;

  SELECT name, lifecycle_status INTO v_name, v_previous
  FROM public.organizations WHERE id = p_organization_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Organization not found';
  END IF;

  IF v_previous = 'active' THEN
    UPDATE public.organizations
    SET lifecycle_status = 'suspended', lifecycle_changed_at = pg_catalog.now(), lifecycle_changed_by = v_actor
    WHERE id = p_organization_id;

    INSERT INTO public.audit_log (
      organization_id, entity_type, entity_id, entity_name, action, actor_id, changes, metadata
    ) VALUES (
      p_organization_id, 'organization', p_organization_id, v_name, 'UPDATE', v_actor,
      jsonb_build_object('lifecycle_status', jsonb_build_object('old', 'active', 'new', 'suspended')),
      jsonb_build_object('reason', NULLIF(pg_catalog.btrim(COALESCE(p_reason, '')), ''), 'authority', 'platform_admin')
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'organization_id', p_organization_id, 'lifecycle_status', 'suspended', 'changed', v_previous = 'active');
END;
$function$;

CREATE OR REPLACE FUNCTION public.platform_reactivate_organization(
  p_organization_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_name text;
  v_previous text;
BEGIN
  IF v_actor IS NULL OR NOT public.is_platform_admin(v_actor) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Platform Admin authority required';
  END IF;

  SELECT name, lifecycle_status INTO v_name, v_previous
  FROM public.organizations WHERE id = p_organization_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Organization not found';
  END IF;

  IF v_previous = 'suspended' THEN
    UPDATE public.organizations
    SET lifecycle_status = 'active', lifecycle_changed_at = pg_catalog.now(), lifecycle_changed_by = v_actor
    WHERE id = p_organization_id;

    INSERT INTO public.audit_log (
      organization_id, entity_type, entity_id, entity_name, action, actor_id, changes, metadata
    ) VALUES (
      p_organization_id, 'organization', p_organization_id, v_name, 'UPDATE', v_actor,
      jsonb_build_object('lifecycle_status', jsonb_build_object('old', 'suspended', 'new', 'active')),
      jsonb_build_object('reason', NULLIF(pg_catalog.btrim(COALESCE(p_reason, '')), ''), 'authority', 'platform_admin')
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'organization_id', p_organization_id, 'lifecycle_status', 'active', 'changed', v_previous = 'suspended');
END;
$function$;

REVOKE ALL ON FUNCTION public.platform_suspend_organization(uuid, text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.platform_reactivate_organization(uuid, text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.platform_suspend_organization(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_reactivate_organization(uuid, text) TO authenticated;
-- rpc-authenticated-grant-allowed: platform_suspend_organization
-- rpc-authenticated-grant-allowed: platform_reactivate_organization

CREATE OR REPLACE FUNCTION public.initiate_ownership_transfer(
  p_organization_id uuid,
  p_to_user_id uuid,
  p_transfer_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_from uuid := auth.uid();
  v_from_name text;
  v_to_name text;
  v_org_name text;
  v_transfer_id uuid;
BEGIN
  IF v_from IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  SELECT name INTO v_org_name FROM public.organizations
  WHERE id = p_organization_id AND lifecycle_status = 'active' FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Organization is not active'); END IF;

  PERFORM 1 FROM public.organization_members WHERE organization_id = p_organization_id FOR UPDATE;
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_organization_id AND user_id = v_from AND role = 'owner' AND status = 'active'
  ) THEN RETURN jsonb_build_object('success', false, 'error', 'Only the current owner can transfer ownership'); END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_organization_id AND user_id = p_to_user_id AND role = 'admin' AND status = 'active'
  ) THEN RETURN jsonb_build_object('success', false, 'error', 'Target user must be an active admin in the organization'); END IF;

  IF EXISTS (
    SELECT 1 FROM public.ownership_transfer_requests
    WHERE organization_id = p_organization_id AND status = 'pending' AND expires_at > pg_catalog.now()
  ) THEN RETURN jsonb_build_object('success', false, 'error', 'There is already a pending transfer request for this organization'); END IF;

  SELECT name INTO v_from_name FROM public.profiles WHERE id = v_from;
  SELECT name INTO v_to_name FROM public.profiles WHERE id = p_to_user_id;

  INSERT INTO public.ownership_transfer_requests (
    organization_id, from_user_id, to_user_id, from_user_name, to_user_name,
    transfer_reason, status, expires_at
  ) VALUES (
    p_organization_id, v_from, p_to_user_id, COALESCE(v_from_name, 'Unknown'),
    COALESCE(v_to_name, 'Unknown'), p_transfer_reason, 'pending', pg_catalog.now() + interval '7 days'
  ) RETURNING id INTO v_transfer_id;

  INSERT INTO public.notifications (organization_id, user_id, type, title, message, data, is_global)
  VALUES (
    p_organization_id, p_to_user_id, 'ownership_transfer_request', 'Ownership Transfer Request',
    COALESCE(v_from_name, 'The current owner') || ' wants to transfer ownership of ' || v_org_name || ' to you.',
    jsonb_build_object('transfer_id', v_transfer_id, 'organization_id', p_organization_id, 'organization_name', v_org_name, 'from_user_id', v_from, 'from_user_name', v_from_name), true
  );

  RETURN jsonb_build_object('success', true, 'transfer_id', v_transfer_id, 'message', 'Transfer request sent to ' || COALESCE(v_to_name, 'target admin'));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

CREATE OR REPLACE FUNCTION public.respond_to_ownership_transfer(
  p_transfer_id uuid,
  p_accept boolean,
  p_departing_owner_role text DEFAULT 'admin',
  p_response_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_transfer public.ownership_transfer_requests%ROWTYPE;
  v_caller uuid := auth.uid();
  v_org_name text;
BEGIN
  IF v_caller IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  SELECT * INTO v_transfer FROM public.ownership_transfer_requests WHERE id = p_transfer_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Transfer request not found'); END IF;
  IF v_transfer.to_user_id <> v_caller THEN RETURN jsonb_build_object('success', false, 'error', 'Only the target user can respond to this transfer request'); END IF;
  IF v_transfer.status <> 'pending' THEN RETURN jsonb_build_object('success', false, 'error', 'This transfer request has already been processed'); END IF;
  IF v_transfer.expires_at < pg_catalog.now() THEN
    UPDATE public.ownership_transfer_requests SET status = 'expired' WHERE id = p_transfer_id;
    RETURN jsonb_build_object('success', false, 'error', 'This transfer request has expired');
  END IF;

  SELECT name INTO v_org_name FROM public.organizations
  WHERE id = v_transfer.organization_id AND lifecycle_status = 'active' FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Organization is not active'); END IF;
  PERFORM 1 FROM public.organization_members WHERE organization_id = v_transfer.organization_id FOR UPDATE;

  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = v_transfer.organization_id AND user_id = v_transfer.from_user_id AND role = 'owner' AND status = 'active'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = v_transfer.organization_id AND user_id = v_transfer.to_user_id AND role = 'admin' AND status = 'active'
  ) THEN RETURN jsonb_build_object('success', false, 'error', 'Ownership transfer membership state is no longer valid'); END IF;

  IF p_accept THEN
    IF p_departing_owner_role <> 'admin' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Departing owner must remain an admin');
    END IF;
    UPDATE public.organization_members SET role = 'admin'
    WHERE organization_id = v_transfer.organization_id AND user_id = v_transfer.from_user_id;
    UPDATE public.organization_members SET role = 'owner'
    WHERE organization_id = v_transfer.organization_id AND user_id = v_transfer.to_user_id;
    UPDATE public.ownership_transfer_requests
    SET status = 'accepted', departing_owner_role = 'admin', response_reason = p_response_reason,
        responded_at = pg_catalog.now(), completed_at = pg_catalog.now()
    WHERE id = p_transfer_id;
    INSERT INTO public.notifications (organization_id, user_id, type, title, message, data, is_global)
    VALUES (
      v_transfer.organization_id, v_transfer.from_user_id, 'ownership_transfer_accepted',
      'Ownership Transfer Accepted', v_transfer.to_user_name || ' has accepted ownership of ' || v_org_name || '.',
      jsonb_build_object('transfer_id', p_transfer_id, 'organization_id', v_transfer.organization_id, 'organization_name', v_org_name), true
    );
    RETURN jsonb_build_object('success', true, 'message', 'You are now the owner of ' || v_org_name);
  END IF;

  UPDATE public.ownership_transfer_requests
  SET status = 'rejected', response_reason = p_response_reason, responded_at = pg_catalog.now()
  WHERE id = p_transfer_id;
  INSERT INTO public.notifications (organization_id, user_id, type, title, message, data, is_global)
  VALUES (
    v_transfer.organization_id, v_transfer.from_user_id, 'ownership_transfer_rejected',
    'Ownership Transfer Declined', v_transfer.to_user_name || ' has declined the ownership transfer for ' || v_org_name || '.',
    jsonb_build_object('transfer_id', p_transfer_id, 'organization_id', v_transfer.organization_id, 'organization_name', v_org_name, 'reason', p_response_reason), true
  );
  RETURN jsonb_build_object('success', true, 'message', 'Transfer request declined');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_organization(
  p_organization_id uuid,
  p_confirmation_name text,
  p_force boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_name text;
  v_members integer;
  v_equipment integer;
  v_work_orders integer;
BEGIN
  IF v_actor IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  SELECT name INTO v_name FROM public.organizations
  WHERE id = p_organization_id AND lifecycle_status = 'active' FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Organization is not active'); END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_organization_id AND user_id = v_actor AND role = 'owner' AND status = 'active'
  ) THEN RETURN jsonb_build_object('success', false, 'error', 'Only the owner can delete the organization'); END IF;
  IF pg_catalog.lower(pg_catalog.btrim(p_confirmation_name)) <> pg_catalog.lower(pg_catalog.btrim(v_name)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization name does not match');
  END IF;
  SELECT count(*) INTO v_members FROM public.organization_members
  WHERE organization_id = p_organization_id AND role <> 'owner' AND status = 'active';
  IF v_members > 0 AND NOT p_force THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot delete organization with active members. Remove all members first or use force option.', 'member_count', v_members);
  END IF;
  SELECT count(*) INTO v_equipment FROM public.equipment WHERE organization_id = p_organization_id;
  SELECT count(*) INTO v_work_orders FROM public.work_orders WHERE organization_id = p_organization_id;
  INSERT INTO public.audit_log (organization_id, entity_type, entity_id, entity_name, action, actor_id, changes, metadata)
  VALUES (
    p_organization_id, 'organization', p_organization_id, v_name, 'DELETE', v_actor,
    jsonb_build_object('equipment_deleted', v_equipment, 'work_orders_deleted', v_work_orders, 'members_removed', v_members + 1),
    jsonb_build_object('deleted_by', v_actor, 'force', p_force)
  );
  DELETE FROM public.organizations WHERE id = p_organization_id;
  RETURN jsonb_build_object('success', true, 'message', 'Organization "' || v_name || '" has been deleted',
    'deleted_stats', jsonb_build_object('equipment', v_equipment, 'work_orders', v_work_orders, 'members_removed', v_members));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

CREATE OR REPLACE FUNCTION public.leave_organization_safely(org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_role text;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  IF NOT public.is_organization_active(org_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization is not active');
  END IF;
  SELECT role INTO v_role
  FROM public.organization_members
  WHERE user_id = v_user AND organization_id = org_id AND status = 'active'
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a member of this organization');
  END IF;
  IF v_role = 'owner' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Owners cannot leave the organization. Transfer ownership first.');
  END IF;
  PERFORM public.preserve_user_attribution(v_user);
  PERFORM public.handle_team_manager_removal(v_user, org_id);
  DELETE FROM public.organization_members WHERE user_id = v_user AND organization_id = org_id;
  RETURN jsonb_build_object('success', true, 'message', 'Successfully left organization');
END;
$function$;

REVOKE ALL ON FUNCTION public.leave_organization_safely(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.leave_organization_safely(uuid) TO authenticated;
-- rpc-authenticated-grant-allowed: leave_organization_safely

CREATE OR REPLACE FUNCTION public.create_google_workspace_oauth_session(
  p_organization_id uuid DEFAULT NULL,
  p_redirect_url text DEFAULT NULL,
  p_origin_url text DEFAULT NULL
)
RETURNS TABLE(session_token text, nonce text, expires_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_token text;
  v_nonce text;
  v_expires timestamptz;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'User must be authenticated to create OAuth session'; END IF;
  IF p_organization_id IS NULL THEN RAISE EXCEPTION USING ERRCODE = '22004', MESSAGE = 'Existing organization is required to connect Google Workspace'; END IF;
  IF NOT public.is_org_admin(v_user, p_organization_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Only active organization owners or admins can connect Google Workspace';
  END IF;
  v_token := pg_catalog.encode(extensions.gen_random_bytes(32), 'base64');
  v_nonce := pg_catalog.encode(extensions.gen_random_bytes(16), 'hex');
  v_expires := pg_catalog.now() + interval '1 hour';
  INSERT INTO public.google_workspace_oauth_sessions
    (session_token, organization_id, user_id, nonce, redirect_url, origin_url, expires_at)
  VALUES (v_token, p_organization_id, v_user, v_nonce, p_redirect_url, p_origin_url, v_expires);
  RETURN QUERY SELECT v_token, v_nonce, v_expires;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_google_workspace_oauth_session(p_session_token text)
RETURNS TABLE(organization_id uuid, user_id uuid, nonce text, redirect_url text, origin_url text, is_valid boolean)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE v_session record;
BEGIN
  SELECT s.organization_id, s.user_id, s.nonce, s.redirect_url, s.origin_url, s.expires_at, s.used_at
  INTO v_session FROM public.google_workspace_oauth_sessions AS s
  WHERE s.session_token = p_session_token FOR UPDATE;
  IF NOT FOUND THEN RETURN QUERY SELECT NULL::uuid, NULL::uuid, NULL::text, NULL::text, NULL::text, false; RETURN; END IF;
  IF v_session.used_at IS NOT NULL OR v_session.expires_at < pg_catalog.now()
     OR NOT public.is_org_admin(v_session.user_id, v_session.organization_id) THEN
    RETURN QUERY SELECT v_session.organization_id, v_session.user_id, v_session.nonce, v_session.redirect_url, v_session.origin_url, false;
    RETURN;
  END IF;
  UPDATE public.google_workspace_oauth_sessions SET used_at = pg_catalog.now() WHERE session_token = p_session_token;
  RETURN QUERY SELECT v_session.organization_id, v_session.user_id, v_session.nonce, v_session.redirect_url, v_session.origin_url, true;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_google_workspace_oauth_session(uuid, text, text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_google_workspace_oauth_session(uuid, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.validate_google_workspace_oauth_session(text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_google_workspace_oauth_session(text) TO service_role;
-- rpc-authenticated-grant-allowed: create_google_workspace_oauth_session

COMMENT ON FUNCTION public.respond_to_ownership_transfer(uuid, boolean, text, text) IS
  'Atomically transfers the sole active OWNER role to an active ADMIN; departing owner remains ADMIN and no replacement organization is created.';
COMMENT ON FUNCTION public.delete_organization(uuid, text, boolean) IS
  'Deletes an active organization without creating a replacement organization.';

COMMIT;
