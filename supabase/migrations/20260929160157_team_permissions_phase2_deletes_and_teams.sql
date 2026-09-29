-- Phase 2 of configurable team permissions.
--
-- New configurable keys (organization owner can override per team role):
--   equipment.delete, work_order.delete    default: nobody (owner/admin only)
--   team.update, team.members.manage       default: team managers
--   team.delete                            default: nobody (owner/admin only)
--
-- Equipment and work order deletes run server-side cascades so a permitted
-- team role does not hit admin-only child-table policies. Team and team member
-- writes switch from admin-only to has_team_permission, matching the actions
-- the app already shows to team managers.

BEGIN;

-- ---------------------------------------------------------------------------
-- Keys
-- ---------------------------------------------------------------------------
CREATE FUNCTION public.configurable_team_permission_keys()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $function$
  SELECT ARRAY[
    'equipment.create', 'equipment.update', 'equipment.delete',
    'work_order.delete',
    'team.update', 'team.members.manage', 'team.delete'
  ]::text[];
$function$;

REVOKE ALL ON FUNCTION public.configurable_team_permission_keys() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.configurable_team_permission_keys() TO authenticated;
-- rpc-authenticated-grant-allowed: configurable_team_permission_keys

ALTER TABLE private.team_permission_overrides
  DROP CONSTRAINT team_permission_overrides_key_check,
  ADD CONSTRAINT team_permission_overrides_key_check
    CHECK (permission_key = ANY (public.configurable_team_permission_keys()));

CREATE OR REPLACE FUNCTION public.default_team_permission(p_team_role text, p_permission_key text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $function$
  SELECT CASE p_permission_key
    WHEN 'equipment.create' THEN p_team_role IN ('manager', 'technician')
    WHEN 'equipment.update' THEN p_team_role IN ('manager', 'technician')
    WHEN 'team.update' THEN p_team_role = 'manager'
    WHEN 'team.members.manage' THEN p_team_role = 'manager'
    ELSE false
  END;
$function$;

CREATE OR REPLACE FUNCTION public.get_team_permission_settings(p_organization_id uuid)
RETURNS TABLE(team_role text, permission_key text, allowed boolean, is_default boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_org_admin(auth.uid(), p_organization_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Organization owner or admin required';
  END IF;

  RETURN QUERY
  SELECT r.team_role, k.permission_key,
    COALESCE(o.allowed, public.default_team_permission(r.team_role, k.permission_key)),
    o.allowed IS NULL
  FROM (VALUES ('manager'), ('technician'), ('requestor'), ('viewer')) AS r(team_role)
  CROSS JOIN unnest(public.configurable_team_permission_keys()) AS k(permission_key)
  LEFT JOIN private.team_permission_overrides AS o
    ON o.organization_id = p_organization_id
   AND o.team_role = r.team_role
   AND o.permission_key = k.permission_key;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_team_permissions(p_organization_id uuid)
RETURNS TABLE(team_id uuid, permission_key text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
  SELECT tm.team_id, k.permission_key
  FROM public.team_members AS tm
  JOIN public.teams AS t ON t.id = tm.team_id
  CROSS JOIN unnest(public.configurable_team_permission_keys()) AS k(permission_key)
  WHERE tm.user_id = auth.uid()
    AND t.organization_id = p_organization_id
    AND public.has_team_permission(auth.uid(), p_organization_id, tm.team_id, k.permission_key);
$function$;

CREATE OR REPLACE FUNCTION public.set_team_permission_override(
  p_organization_id uuid,
  p_team_role text,
  p_permission_key text,
  p_allowed boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_previous boolean;
BEGIN
  IF v_actor IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.organization_members AS om
    JOIN public.organizations AS org ON org.id = om.organization_id
    WHERE om.organization_id = p_organization_id AND om.user_id = v_actor
      AND om.role = 'owner' AND om.status = 'active' AND org.lifecycle_status = 'active'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Organization owner required';
  END IF;
  IF p_team_role IS NULL OR p_team_role NOT IN ('manager', 'technician', 'requestor', 'viewer') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid team role';
  END IF;
  IF p_permission_key IS NULL OR NOT (p_permission_key = ANY (public.configurable_team_permission_keys())) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid permission key';
  END IF;

  SELECT COALESCE(o.allowed, public.default_team_permission(p_team_role, p_permission_key))
  INTO v_previous
  FROM (SELECT 1) AS ignored
  LEFT JOIN private.team_permission_overrides AS o
    ON o.organization_id = p_organization_id AND o.team_role = p_team_role AND o.permission_key = p_permission_key;

  IF p_allowed IS NULL OR p_allowed = public.default_team_permission(p_team_role, p_permission_key) THEN
    DELETE FROM private.team_permission_overrides
    WHERE organization_id = p_organization_id AND team_role = p_team_role AND permission_key = p_permission_key;
  ELSE
    INSERT INTO private.team_permission_overrides (organization_id, team_role, permission_key, allowed, updated_by)
    VALUES (p_organization_id, p_team_role, p_permission_key, p_allowed, v_actor)
    ON CONFLICT (organization_id, team_role, permission_key)
    DO UPDATE SET allowed = EXCLUDED.allowed, updated_by = EXCLUDED.updated_by, updated_at = pg_catalog.now();
  END IF;

  INSERT INTO public.audit_log (organization_id, entity_type, entity_id, entity_name, action, actor_id, changes, metadata)
  SELECT p_organization_id, 'organization', p_organization_id, org.name, 'UPDATE', v_actor,
    jsonb_build_object('team_permission', jsonb_build_object(
      'team_role', p_team_role,
      'permission_key', p_permission_key,
      'old', v_previous,
      'new', COALESCE(p_allowed, public.default_team_permission(p_team_role, p_permission_key))
    )),
    jsonb_build_object('source', 'permission_matrix', 'restored_default', p_allowed IS NULL)
  FROM public.organizations AS org WHERE org.id = p_organization_id;
END;
$function$;

-- ---------------------------------------------------------------------------
-- Work order delete: shared row cleanup + permission-aware RPC
-- ---------------------------------------------------------------------------
-- Internal: no permission check; callers must authorize first.
CREATE FUNCTION private.delete_work_order_rows(p_work_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.work_orders SET primary_image_id = NULL WHERE id = p_work_order_id;

  BEGIN
    DELETE FROM storage.objects o
    USING public.work_order_images wi
    WHERE wi.work_order_id = p_work_order_id
      AND o.bucket_id = 'work-order-images'
      AND o.name = wi.file_url
      AND (storage.foldername(o.name))[2] = p_work_order_id::text;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'delete_work_order_rows storage cleanup failed for %: %', p_work_order_id, SQLERRM;
  END;

  DELETE FROM public.work_order_images WHERE work_order_id = p_work_order_id;
  DELETE FROM public.preventative_maintenance WHERE work_order_id = p_work_order_id;
  DELETE FROM public.work_order_notes WHERE work_order_id = p_work_order_id;
  DELETE FROM public.work_order_costs WHERE work_order_id = p_work_order_id;
  DELETE FROM public.work_order_status_history WHERE work_order_id = p_work_order_id;
  DELETE FROM public.work_order_equipment WHERE work_order_id = p_work_order_id;
  DELETE FROM public.quickbooks_export_logs WHERE work_order_id = p_work_order_id;
  DELETE FROM public.work_orders WHERE id = p_work_order_id;
END;
$function$;

REVOKE ALL ON FUNCTION private.delete_work_order_rows(uuid) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.delete_work_order_cascade(p_work_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_org_id uuid;
  v_team_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT organization_id, team_id INTO v_org_id, v_team_id
  FROM public.work_orders
  WHERE id = p_work_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Work order not found');
  END IF;

  IF NOT (
    public.is_org_admin(auth.uid(), v_org_id)
    OR public.has_team_permission(auth.uid(), v_org_id, v_team_id, 'work_order.delete')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  PERFORM private.delete_work_order_rows(p_work_order_id);

  RETURN jsonb_build_object(
    'success', true,
    'work_order_id', p_work_order_id,
    'organization_id', v_org_id
  );
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'delete_work_order_cascade failed for %: %', p_work_order_id, SQLERRM;
  RETURN jsonb_build_object('success', false, 'error', 'Deletion failed');
END;
$function$;

COMMENT ON FUNCTION public.delete_work_order_cascade(uuid) IS
  'Permanently deletes a work order, related rows, and work order storage objects. Org owners/admins, or team roles granted work_order.delete.';

-- ---------------------------------------------------------------------------
-- Equipment delete: server-side cascade
-- ---------------------------------------------------------------------------
-- Returns note image paths so the client can remove them via the Storage API
-- (best-effort, as before). Linked work orders are deleted with the equipment.
CREATE FUNCTION public.delete_equipment_cascade(p_equipment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_org_id uuid;
  v_team_id uuid;
  v_work_order_id uuid;
  v_work_orders integer := 0;
  v_note_image_paths text[];
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT organization_id, team_id INTO v_org_id, v_team_id
  FROM public.equipment
  WHERE id = p_equipment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Equipment not found');
  END IF;

  IF NOT (
    public.is_org_admin(auth.uid(), v_org_id)
    OR public.has_team_permission(auth.uid(), v_org_id, v_team_id, 'equipment.delete')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  FOR v_work_order_id IN
    SELECT id FROM public.work_orders WHERE equipment_id = p_equipment_id
  LOOP
    PERFORM private.delete_work_order_rows(v_work_order_id);
    v_work_orders := v_work_orders + 1;
  END LOOP;

  SELECT COALESCE(array_agg(eni.file_url), ARRAY[]::text[]) INTO v_note_image_paths
  FROM public.equipment_note_images AS eni
  JOIN public.equipment_notes AS en ON en.id = eni.equipment_note_id
  WHERE en.equipment_id = p_equipment_id;

  DELETE FROM public.equipment_note_images AS eni
  USING public.equipment_notes AS en
  WHERE en.id = eni.equipment_note_id AND en.equipment_id = p_equipment_id;
  DELETE FROM public.equipment_notes WHERE equipment_id = p_equipment_id;
  DELETE FROM public.scans WHERE equipment_id = p_equipment_id;
  DELETE FROM public.equipment WHERE id = p_equipment_id;

  RETURN jsonb_build_object(
    'success', true,
    'equipment_id', p_equipment_id,
    'organization_id', v_org_id,
    'work_orders_deleted', v_work_orders,
    'note_image_paths', to_jsonb(v_note_image_paths)
  );
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'delete_equipment_cascade failed for %: %', p_equipment_id, SQLERRM;
  RETURN jsonb_build_object('success', false, 'error', 'Deletion failed');
END;
$function$;

REVOKE ALL ON FUNCTION public.delete_equipment_cascade(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_equipment_cascade(uuid) TO authenticated;
-- rpc-authenticated-grant-allowed: delete_equipment_cascade

COMMENT ON FUNCTION public.delete_equipment_cascade(uuid) IS
  'Permanently deletes equipment with its work orders, notes, note images and scans. Org owners/admins, or team roles granted equipment.delete.';

-- Direct deletes follow the same rules (the app uses the RPCs above).
DROP POLICY equipment_delete_by_admin ON public.equipment;
CREATE POLICY equipment_delete_by_permission ON public.equipment
  FOR DELETE TO authenticated
  USING (
    public.is_org_admin((SELECT auth.uid()), organization_id)
    OR public.has_team_permission((SELECT auth.uid()), organization_id, team_id, 'equipment.delete')
  );

DROP POLICY work_orders_delete_by_role ON public.work_orders;
CREATE POLICY work_orders_delete_by_role ON public.work_orders
  FOR DELETE TO authenticated
  USING (
    public.is_org_admin((SELECT auth.uid()), organization_id)
    OR public.has_team_permission((SELECT auth.uid()), organization_id, team_id, 'work_order.delete')
    OR (
      is_historical = false
      AND status = 'submitted'
      AND created_by = (SELECT auth.uid())
      AND public.is_org_member((SELECT auth.uid()), organization_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Teams and team members
-- ---------------------------------------------------------------------------
DROP POLICY "admins_delete_teams" ON public.teams;
DROP POLICY "admins_manage_teams" ON public.teams;
DROP POLICY "admins_update_teams" ON public.teams;
DROP POLICY "teams_admin_update" ON public.teams;
DROP POLICY "teams_admin_delete" ON public.teams;
-- teams_admin_insert (create team: owner/admin) is unchanged.

CREATE POLICY teams_update_by_permission ON public.teams
  FOR UPDATE TO authenticated
  USING (
    public.is_org_admin((SELECT auth.uid()), organization_id)
    OR public.has_team_permission((SELECT auth.uid()), organization_id, id, 'team.update')
  )
  WITH CHECK (
    public.is_org_admin((SELECT auth.uid()), organization_id)
    OR public.has_team_permission((SELECT auth.uid()), organization_id, id, 'team.update')
  );

CREATE POLICY teams_delete_by_permission ON public.teams
  FOR DELETE TO authenticated
  USING (
    public.is_org_admin((SELECT auth.uid()), organization_id)
    OR public.has_team_permission((SELECT auth.uid()), organization_id, id, 'team.delete')
  );

DROP POLICY "team_members_admin_delete" ON public.team_members;
DROP POLICY "team_members_admin_insert" ON public.team_members;
DROP POLICY "team_members_admin_update" ON public.team_members;

-- Non-admins with team.members.manage may add, change or remove members of
-- that team, but never grant or touch the team 'owner' role, and may only add
-- active members of the same organization.
CREATE POLICY team_members_insert_by_permission ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams AS t
      WHERE t.id = team_members.team_id
        AND (
          public.is_org_admin((SELECT auth.uid()), t.organization_id)
          OR (
            public.has_team_permission((SELECT auth.uid()), t.organization_id, t.id, 'team.members.manage')
            AND team_members.role <> 'owner'
            AND public.is_org_member(team_members.user_id, t.organization_id)
          )
        )
    )
  );

CREATE POLICY team_members_update_by_permission ON public.team_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams AS t
      WHERE t.id = team_members.team_id
        AND (
          public.is_org_admin((SELECT auth.uid()), t.organization_id)
          OR (
            public.has_team_permission((SELECT auth.uid()), t.organization_id, t.id, 'team.members.manage')
            AND team_members.role <> 'owner'
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams AS t
      WHERE t.id = team_members.team_id
        AND (
          public.is_org_admin((SELECT auth.uid()), t.organization_id)
          OR (
            public.has_team_permission((SELECT auth.uid()), t.organization_id, t.id, 'team.members.manage')
            AND team_members.role <> 'owner'
          )
        )
    )
  );

CREATE POLICY team_members_delete_by_permission ON public.team_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams AS t
      WHERE t.id = team_members.team_id
        AND (
          public.is_org_admin((SELECT auth.uid()), t.organization_id)
          OR (
            public.has_team_permission((SELECT auth.uid()), t.organization_id, t.id, 'team.members.manage')
            AND team_members.role <> 'owner'
          )
        )
    )
  );

COMMIT;
