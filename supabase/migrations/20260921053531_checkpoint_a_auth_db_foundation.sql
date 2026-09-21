-- Checkpoint A: auth/database foundation.
-- New auth identities may receive a profile and pre-authorized organization
-- access, but must never bootstrap an organization or OWNER membership.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, profiles.name),
        updated_at = now();

  -- Workspace directory selection is an explicit owner/admin authorization.
  -- A workspace_domains match by itself is intentionally not consulted here.
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    role,
    status,
    access_source
  )
  SELECT
    c.organization_id,
    NEW.id,
    'member',
    'active',
    'google_workspace'
  FROM public.organization_member_claims c
  WHERE public.normalize_email(c.email) = public.normalize_email(NEW.email)
    AND c.status IN ('selected', 'claimed')
  ON CONFLICT (organization_id, user_id) DO UPDATE
    SET status = CASE
          WHEN public.organization_members.access_source IS NULL
            OR public.organization_members.access_source = 'google_workspace'
            THEN 'active'
          ELSE public.organization_members.status
        END,
        access_source = COALESCE(
          public.organization_members.access_source,
          'google_workspace'
        )
    WHERE public.organization_members.access_source IS NULL
       OR public.organization_members.access_source = 'google_workspace';

  UPDATE public.organization_member_claims
  SET status = 'claimed',
      claimed_user_id = NEW.id,
      claimed_at = now()
  WHERE public.normalize_email(email) = public.normalize_email(NEW.email)
    AND status = 'selected';

  -- Existing pending grants remain gated by Google identity verification in
  -- apply_pending_admin_grants_for_user().
  PERFORM public.apply_pending_admin_grants_for_user(NEW.id);

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates or updates a profile for a new auth user and applies existing explicit Workspace claims and pending verified admin grants. Never creates an organization or OWNER membership.';

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Preserve the verified service-role provisioning path. The named constraint
-- avoids ambiguity with the function's domain output parameter.
CREATE OR REPLACE FUNCTION public.auto_provision_workspace_organization(
  p_user_id uuid,
  p_domain text,
  p_organization_name text
)
RETURNS TABLE(
  organization_id uuid,
  domain text,
  already_existed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_domain text;
  v_org_id uuid;
  v_existing_org_id uuid;
BEGIN
  v_domain := public.normalize_domain(p_domain);

  IF v_domain IN ('gmail.com', 'googlemail.com') THEN
    RAISE EXCEPTION 'Consumer domains are not supported';
  END IF;

  SELECT d.organization_id INTO v_existing_org_id
  FROM public.workspace_domains d
  WHERE public.normalize_domain(d.domain) = v_domain;

  IF v_existing_org_id IS NOT NULL THEN
    organization_id := v_existing_org_id;
    domain := v_domain;
    already_existed := true;
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT o.id INTO v_existing_org_id
  FROM public.organizations o
  JOIN public.organization_members om ON om.organization_id = o.id
  LEFT JOIN public.personal_organizations po ON po.organization_id = o.id
  WHERE om.user_id = p_user_id
    AND om.role = 'owner'
    AND om.status = 'active'
    AND po.organization_id IS NULL
  ORDER BY o.created_at ASC
  LIMIT 1;

  IF v_existing_org_id IS NOT NULL THEN
    INSERT INTO public.workspace_domains (domain, organization_id)
    VALUES (v_domain, v_existing_org_id)
    ON CONFLICT ON CONSTRAINT workspace_domains_pkey DO NOTHING;

    IF NOT FOUND THEN
      SELECT d.organization_id INTO v_existing_org_id
      FROM public.workspace_domains d
      WHERE public.normalize_domain(d.domain) = v_domain;
    END IF;

    organization_id := v_existing_org_id;
    domain := v_domain;
    already_existed := true;
    RETURN NEXT;
    RETURN;
  END IF;

  INSERT INTO public.organizations (name, plan, member_count, max_members, features)
  VALUES (
    p_organization_name,
    'free',
    1,
    5,
    ARRAY['Equipment Management', 'Work Orders', 'Team Management']
  )
  RETURNING id INTO v_org_id;

  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    role,
    status,
    access_source
  )
  VALUES (v_org_id, p_user_id, 'owner', 'active', 'owner')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.workspace_domains (domain, organization_id)
  VALUES (v_domain, v_org_id)
  ON CONFLICT ON CONSTRAINT workspace_domains_pkey DO NOTHING;

  SELECT d.organization_id INTO v_existing_org_id
  FROM public.workspace_domains d
  WHERE public.normalize_domain(d.domain) = v_domain;

  IF v_existing_org_id IS NOT NULL AND v_existing_org_id <> v_org_id THEN
    DELETE FROM public.organization_members
    WHERE organization_id = v_org_id;

    DELETE FROM public.organizations
    WHERE id = v_org_id;

    organization_id := v_existing_org_id;
    domain := v_domain;
    already_existed := true;
    RETURN NEXT;
    RETURN;
  END IF;

  organization_id := v_org_id;
  domain := v_domain;
  already_existed := false;
  RETURN NEXT;
END;
$$;

COMMENT ON FUNCTION public.auto_provision_workspace_organization(uuid, text, text) IS
  'Atomically provisions or reuses an owner-managed organization for a verified Workspace domain without migrating same-domain users by default.';

REVOKE ALL ON FUNCTION public.auto_provision_workspace_organization(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auto_provision_workspace_organization(uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.auto_provision_workspace_organization(uuid, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.auto_provision_workspace_organization(uuid, text, text) TO service_role;

-- This legacy RPC is SECURITY DEFINER and creates both an organization and an
-- OWNER membership. Keep it available only to trusted service-role callers.
-- The verified Workspace OAuth callback uses the separate service-role-only
-- auto_provision_workspace_organization() path.
REVOKE ALL ON FUNCTION public.create_workspace_organization_for_domain(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_workspace_organization_for_domain(text, text) FROM anon;
REVOKE ALL ON FUNCTION public.create_workspace_organization_for_domain(text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_workspace_organization_for_domain(text, text) TO service_role;
