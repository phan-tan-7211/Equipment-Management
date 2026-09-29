-- Re-apply the #762 / #1310 function-grant lockdown to the equipment_groups
-- trigger helpers added in 20260911022811_equipment_groups_management_codes.
--
-- CREATE FUNCTION grants EXECUTE to PUBLIC by default, so these three
-- SECURITY INVOKER trigger functions became executable by anon and
-- authenticated (REST-exposed), breaking the "only three anon-callable public
-- functions" contract enforced by supabase/tests/13_security_definer_rpc_grants.sql.
-- Triggers keep firing: trigger execution does not check EXECUTE privilege.

REVOKE ALL ON FUNCTION public.touch_equipment_group_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_equipment_group_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_used_equipment_group_delete() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.touch_equipment_group_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.protect_equipment_group_code() TO service_role;
GRANT EXECUTE ON FUNCTION public.prevent_used_equipment_group_delete() TO service_role;
