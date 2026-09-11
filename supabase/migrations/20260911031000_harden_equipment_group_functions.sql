-- Trigger functions are internal implementation details. PostgreSQL grants
-- EXECUTE on new functions to PUBLIC by default, which makes SECURITY DEFINER
-- trigger functions appear callable through the API. Revoke direct execution;
-- triggers continue to invoke them normally.

REVOKE EXECUTE ON FUNCTION public.assign_equipment_management_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_equipment_classification_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_equipment_group_changes() FROM PUBLIC, anon, authenticated;

-- Equipment groups are authenticated organization master data. Keep the table
-- undiscoverable to anonymous clients; authenticated access remains governed by RLS.
REVOKE ALL ON TABLE public.equipment_groups FROM anon;
