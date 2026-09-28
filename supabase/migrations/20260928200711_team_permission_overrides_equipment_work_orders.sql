-- Enforce equipment and work order write permissions in the database and let
-- organization owners customize selected team-role permissions.
--
-- Before this migration several permissive FOR ALL / UPDATE policies only
-- checked organization membership, so any active member could insert, update
-- or delete equipment and work orders through the API. Role rules lived only in
-- the frontend. Defaults below preserve the current UI behavior.
-- SELECT policies are intentionally unchanged.

BEGIN;

-- ---------------------------------------------------------------------------
-- Per-organization overrides for configurable team-role permissions.
-- ---------------------------------------------------------------------------
CREATE TABLE private.team_permission_overrides (
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_role text NOT NULL,
  permission_key text NOT NULL,
  allowed boolean NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  PRIMARY KEY (organization_id, team_role, permission_key),
  CONSTRAINT team_permission_overrides_role_check
    CHECK (team_role IN ('manager', 'technician', 'requestor', 'viewer')),
  CONSTRAINT team_permission_overrides_key_check
    CHECK (permission_key IN ('equipment.create', 'equipment.update', 'equipment.delete', 'work_order.delete'))
);

ALTER TABLE private.team_permission_overrides ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.team_permission_overrides FROM PUBLIC, anon, authenticated;

-- Built-in defaults. Team owners are treated as managers.
CREATE FUNCTION public.default_team_permission(p_team_role text, p_permission_key text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $function$
  SELECT CASE p_permission_key
    WHEN 'equipment.create' THEN p_team_role IN ('manager', 'technician')
    WHEN 'equipment.update' THEN p_team_role IN ('manager', 'technician')
    WHEN 'equipment.delete' THEN false
    WHEN 'work_order.delete' THEN false
    ELSE false
  END;
$function$;

REVOKE ALL ON FUNCTION public.default_team_permission(text, text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.default_team_permission(text, text) TO authenticated;
-- rpc-authenticated-grant-allowed: default_team_permission

-- True when the user holds a team role on p_team_id (in p_organization_id)
-- whose effective permission for p_permission_key is allowed.
-- Organization owners/admins are handled separately by is_org_admin.
CREATE FUNCTION public.has_team_permission(
  p_user_id uuid,
  p_organization_id uuid,
  p_team_id uuid,
  p_permission_key text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private
SET row_security = off
AS $function$
  SELECT p_user_id IS NOT NULL
    AND p_team_id IS NOT NULL
    AND public.is_org_member(p_user_id, p_organization_id)
    AND EXISTS (
      SELECT 1
      FROM public.team_members AS tm
      JOIN public.teams AS t ON t.id = tm.team_id
      CROSS JOIN LATERAL (
        SELECT CASE WHEN tm.role::text = 'owner' THEN 'manager' ELSE tm.role::text END AS team_role
      ) AS r
      LEFT JOIN private.team_permission_overrides AS o
        ON o.organization_id = p_organization_id
       AND o.team_role = r.team_role
       AND o.permission_key = p_permission_key
      WHERE tm.user_id = p_user_id
        AND tm.team_id = p_team_id
        AND t.organization_id = p_organization_id
        AND COALESCE(o.allowed, public.default_team_permission(r.team_role, p_permission_key))
    );
$function$;

REVOKE ALL ON FUNCTION public.has_team_permission(uuid, uuid, uuid, text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_team_permission(uuid, uuid, uuid, text) TO authenticated;
-- rpc-authenticated-grant-allowed: has_team_permission

-- Effective matrix for the permission matrix page (owners and admins only).
CREATE FUNCTION public.get_team_permission_settings(p_organization_id uuid)
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
  CROSS JOIN (VALUES ('equipment.create'), ('equipment.update'), ('equipment.delete'), ('work_order.delete')) AS k(permission_key)
  LEFT JOIN private.team_permission_overrides AS o
    ON o.organization_id = p_organization_id
   AND o.team_role = r.team_role
   AND o.permission_key = k.permission_key;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_team_permission_settings(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_team_permission_settings(uuid) TO authenticated;
-- rpc-authenticated-grant-allowed: get_team_permission_settings

-- Owner-only. p_allowed NULL restores the built-in default.
CREATE FUNCTION public.set_team_permission_override(
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
  IF p_permission_key IS NULL OR p_permission_key NOT IN ('equipment.create', 'equipment.update', 'equipment.delete', 'work_order.delete') THEN
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

REVOKE ALL ON FUNCTION public.set_team_permission_override(uuid, text, text, boolean) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_team_permission_override(uuid, text, text, boolean) TO authenticated;
-- rpc-authenticated-grant-allowed: set_team_permission_override

-- ---------------------------------------------------------------------------
-- equipment: replace member-wide write policies.
-- ---------------------------------------------------------------------------
DROP POLICY "equipment_access_consolidated" ON public.equipment;
DROP POLICY "equipment_admin_access" ON public.equipment;
DROP POLICY "equipment_member_update" ON public.equipment;
DROP POLICY "equipment_team_manager_delete" ON public.equipment;
DROP POLICY "team_members_create_equipment" ON public.equipment;

CREATE POLICY equipment_insert_by_permission ON public.equipment
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_admin((SELECT auth.uid()), organization_id)
    OR public.has_team_permission((SELECT auth.uid()), organization_id, team_id, 'equipment.create')
  );

CREATE POLICY equipment_update_by_permission ON public.equipment
  FOR UPDATE TO authenticated
  USING (
    public.is_org_admin((SELECT auth.uid()), organization_id)
    OR public.has_team_permission((SELECT auth.uid()), organization_id, team_id, 'equipment.update')
  )
  WITH CHECK (
    public.is_org_admin((SELECT auth.uid()), organization_id)
    OR public.has_team_permission((SELECT auth.uid()), organization_id, team_id, 'equipment.update')
  );

CREATE POLICY equipment_delete_by_permission ON public.equipment
  FOR DELETE TO authenticated
  USING (
    public.is_org_admin((SELECT auth.uid()), organization_id)
    OR public.has_team_permission((SELECT auth.uid()), organization_id, team_id, 'equipment.delete')
  );

-- ---------------------------------------------------------------------------
-- work_orders: replace member-wide write policies.
-- ---------------------------------------------------------------------------
DROP POLICY "Admins can create historical work orders" ON public.work_orders;
DROP POLICY "Admins can delete work orders" ON public.work_orders;
DROP POLICY "Admins can update historical work orders" ON public.work_orders;
DROP POLICY "Users can create work orders in their organization" ON public.work_orders;
DROP POLICY "Users can update work orders in their organization" ON public.work_orders;
DROP POLICY "admins_delete_work_orders" ON public.work_orders;
DROP POLICY "members_access_work_orders" ON public.work_orders;
DROP POLICY "work_orders_insert_consolidated" ON public.work_orders;
DROP POLICY "work_orders_update_consolidated" ON public.work_orders;

-- Any member may create a regular work order; historical records are admin-only.
CREATE POLICY work_orders_insert_by_role ON public.work_orders
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      is_historical = false
      AND created_by = (SELECT auth.uid())
      AND public.is_org_member((SELECT auth.uid()), organization_id)
    )
    OR (
      is_historical = true
      AND public.is_org_admin((SELECT auth.uid()), organization_id)
      AND created_by_admin = (SELECT auth.uid())
    )
  );

-- Admins; the assignee; team owners/managers/technicians on the work order's
-- team; or the creator while the request is still submitted (the creator may
-- also move it to cancelled).
CREATE POLICY work_orders_update_by_role ON public.work_orders
  FOR UPDATE TO authenticated
  USING (
    public.is_org_admin((SELECT auth.uid()), organization_id)
    OR (
      is_historical = false
      AND public.is_org_member((SELECT auth.uid()), organization_id)
      AND (
        assignee_id = (SELECT auth.uid())
        OR (created_by = (SELECT auth.uid()) AND status = 'submitted')
        OR EXISTS (
          SELECT 1 FROM public.team_members AS tm
          WHERE tm.team_id = work_orders.team_id
            AND tm.user_id = (SELECT auth.uid())
            AND tm.role IN ('owner', 'manager', 'technician')
        )
      )
    )
  )
  WITH CHECK (
    public.is_org_admin((SELECT auth.uid()), organization_id)
    OR (
      is_historical = false
      AND public.is_org_member((SELECT auth.uid()), organization_id)
      AND (
        assignee_id = (SELECT auth.uid())
        OR (created_by = (SELECT auth.uid()) AND status IN ('submitted', 'cancelled'))
        OR EXISTS (
          SELECT 1 FROM public.team_members AS tm
          WHERE tm.team_id = work_orders.team_id
            AND tm.user_id = (SELECT auth.uid())
            AND tm.role IN ('owner', 'manager', 'technician')
        )
      )
    )
  );

-- Admins, team roles granted work_order.delete, or the creator of a request
-- that is still submitted (used to roll back a failed QR create).
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

COMMENT ON FUNCTION public.has_team_permission(uuid, uuid, uuid, text) IS
  'RLS helper: effective team-role permission with per-organization overrides.';
COMMENT ON FUNCTION public.get_team_permission_settings(uuid) IS
  'Owner/admin view of effective configurable team-role permissions.';
COMMENT ON FUNCTION public.set_team_permission_override(uuid, text, text, boolean) IS
  'Owner-only: set or reset a configurable team-role permission; audited.';

COMMIT;
