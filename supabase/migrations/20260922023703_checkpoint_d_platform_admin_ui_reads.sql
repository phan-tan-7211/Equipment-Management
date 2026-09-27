BEGIN;

CREATE OR REPLACE FUNCTION public.current_user_is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
  SELECT auth.uid() IS NOT NULL
    AND public.is_platform_admin(auth.uid());
$function$;

CREATE OR REPLACE FUNCTION public.platform_list_organizations(
  p_search text DEFAULT NULL,
  p_lifecycle_status text DEFAULT NULL
)
RETURNS TABLE(
  organization_id uuid,
  organization_name text,
  lifecycle_status text,
  created_at timestamptz,
  owner_user_id uuid,
  owner_name text,
  owner_email text,
  pending_owner_invitation_id uuid,
  pending_owner_email text,
  pending_owner_expires_at timestamptz,
  pending_owner_can_resend boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL OR NOT public.is_platform_admin(v_caller) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Platform Admin authority required';
  END IF;
  IF p_lifecycle_status IS NOT NULL AND p_lifecycle_status NOT IN ('active', 'suspended') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid lifecycle status';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.name,
    o.lifecycle_status,
    o.created_at,
    owner_member.user_id,
    owner_profile.name,
    owner_auth.email::text,
    pending_invitation.id,
    pending_invitation.email,
    pending_invitation.expires_at,
    COALESCE(
      pending_invitation.invited_by = v_caller
      AND pending_invitation.status = 'pending'
      AND pending_invitation.expires_at > pg_catalog.now(),
      false
    )
  FROM public.organizations AS o
  LEFT JOIN LATERAL (
    SELECT om.user_id
    FROM public.organization_members AS om
    WHERE om.organization_id = o.id AND om.role = 'owner' AND om.status = 'active'
    LIMIT 1
  ) AS owner_member ON true
  LEFT JOIN public.profiles AS owner_profile ON owner_profile.id = owner_member.user_id
  LEFT JOIN auth.users AS owner_auth ON owner_auth.id = owner_member.user_id
  LEFT JOIN LATERAL (
    SELECT oi.id, oi.email, oi.expires_at, oi.status, oi.invited_by
    FROM public.organization_invitations AS oi
    WHERE oi.organization_id = o.id
      AND oi.role = 'owner'
      AND oi.status = 'pending'
      AND owner_member.user_id IS NULL
    ORDER BY oi.created_at DESC
    LIMIT 1
  ) AS pending_invitation ON true
  WHERE (NULLIF(pg_catalog.btrim(COALESCE(p_search, '')), '') IS NULL
         OR o.name ILIKE '%' || pg_catalog.btrim(p_search) || '%')
    AND (p_lifecycle_status IS NULL OR o.lifecycle_status = p_lifecycle_status)
  ORDER BY o.created_at DESC, o.name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.platform_get_organization(p_organization_id uuid)
RETURNS TABLE(
  organization_id uuid,
  organization_name text,
  lifecycle_status text,
  created_at timestamptz,
  owner_user_id uuid,
  owner_name text,
  owner_email text,
  pending_owner_invitation_id uuid,
  pending_owner_email text,
  pending_owner_expires_at timestamptz,
  pending_owner_status text,
  pending_owner_can_resend boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL OR NOT public.is_platform_admin(v_caller) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Platform Admin authority required';
  END IF;

  RETURN QUERY
  SELECT
    o.id, o.name, o.lifecycle_status, o.created_at,
    owner_member.user_id, owner_profile.name, owner_auth.email::text,
    owner_invitation.id, owner_invitation.email, owner_invitation.expires_at,
    owner_invitation.status,
    COALESCE(
      owner_invitation.invited_by = v_caller
      AND owner_invitation.status = 'pending'
      AND owner_invitation.expires_at > pg_catalog.now()
      AND owner_member.user_id IS NULL,
      false
    )
  FROM public.organizations AS o
  LEFT JOIN LATERAL (
    SELECT om.user_id FROM public.organization_members AS om
    WHERE om.organization_id = o.id AND om.role = 'owner' AND om.status = 'active'
    LIMIT 1
  ) AS owner_member ON true
  LEFT JOIN public.profiles AS owner_profile ON owner_profile.id = owner_member.user_id
  LEFT JOIN auth.users AS owner_auth ON owner_auth.id = owner_member.user_id
  LEFT JOIN LATERAL (
    SELECT oi.id, oi.email, oi.expires_at, oi.status, oi.invited_by
    FROM public.organization_invitations AS oi
    WHERE oi.organization_id = o.id AND oi.role = 'owner'
    ORDER BY oi.created_at DESC
    LIMIT 1
  ) AS owner_invitation ON true
  WHERE o.id = p_organization_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.platform_list_organizations(text, text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.platform_get_organization(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.current_user_is_platform_admin() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.platform_list_organizations(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_get_organization(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_platform_admin() TO authenticated;

-- rpc-authenticated-grant-allowed: current_user_is_platform_admin
-- rpc-authenticated-grant-allowed: platform_list_organizations
-- rpc-authenticated-grant-allowed: platform_get_organization

COMMENT ON FUNCTION public.platform_list_organizations(text, text) IS
  'Narrow Platform Admin organization summary list. Does not grant tenant table access.';
COMMENT ON FUNCTION public.platform_get_organization(uuid) IS
  'Narrow Platform Admin organization detail summary. Does not grant tenant table access.';
COMMENT ON FUNCTION public.current_user_is_platform_admin() IS
  'Returns whether auth.uid() has active authority in private.platform_admins.';

COMMIT;
