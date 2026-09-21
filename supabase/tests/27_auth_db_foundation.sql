-- pgTAP coverage for Checkpoint A auth/database foundation.

BEGIN;
SELECT plan(23);

CREATE TEMP TABLE auth_foundation_ids (
  label text PRIMARY KEY,
  id uuid NOT NULL
);

INSERT INTO auth_foundation_ids (label, id) VALUES
  ('org', '27000000-0000-0000-0000-000000000001'::uuid),
  ('admin', '27000000-0000-0000-0000-000000000002'::uuid),
  ('unknown-email', '27000000-0000-0000-0000-000000000003'::uuid),
  ('unknown-google', '27000000-0000-0000-0000-000000000004'::uuid),
  ('invited', '27000000-0000-0000-0000-000000000005'::uuid),
  ('claimed', '27000000-0000-0000-0000-000000000006'::uuid),
  ('directory-user', '27000000-0000-0000-0000-000000000007'::uuid);

GRANT SELECT ON auth_foundation_ids TO authenticated, service_role;

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  (SELECT id FROM auth_foundation_ids WHERE label = 'admin'),
  '00000000-0000-0000-0000-000000000000'::uuid,
  'admin@checkpoint-a.test',
  extensions.crypt('password123', extensions.gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"name": "Checkpoint Admin"}'::jsonb,
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
);

INSERT INTO public.organizations (id, name, plan, member_count, max_members, features)
VALUES (
  (SELECT id FROM auth_foundation_ids WHERE label = 'org'),
  'Checkpoint A Organization',
  'free',
  1,
  10,
  ARRAY['Equipment Management']
);

INSERT INTO public.organization_members (
  organization_id,
  user_id,
  role,
  status,
  access_source
) VALUES (
  (SELECT id FROM auth_foundation_ids WHERE label = 'org'),
  (SELECT id FROM auth_foundation_ids WHERE label = 'admin'),
  'owner',
  'active',
  'owner'
);

INSERT INTO public.workspace_domains (domain, organization_id)
VALUES (
  'checkpoint-a.test',
  (SELECT id FROM auth_foundation_ids WHERE label = 'org')
);

-- Password-backed auth identity: profile only, no implicit organization access.
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  (SELECT id FROM auth_foundation_ids WHERE label = 'unknown-email'),
  '00000000-0000-0000-0000-000000000000'::uuid,
  'unknown-email@outside.test',
  extensions.crypt('password123', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"name": "Unknown Email User"}'::jsonb,
  false, 'authenticated', 'authenticated', '', '', '', ''
);

SELECT is(
  (SELECT count(*)::integer
   FROM public.profiles
   WHERE id = (SELECT id FROM auth_foundation_ids WHERE label = 'unknown-email')),
  1,
  'unknown password user receives a profile'
);

SELECT is(
  (SELECT count(*)::integer
   FROM public.personal_organizations
   WHERE user_id = (SELECT id FROM auth_foundation_ids WHERE label = 'unknown-email')),
  0,
  'unknown password user receives no personal organization'
);

SELECT is(
  (SELECT count(*)::integer
   FROM public.organization_members
   WHERE user_id = (SELECT id FROM auth_foundation_ids WHERE label = 'unknown-email')),
  0,
  'unknown password user receives no organization membership or OWNER role'
);

-- A domain mapping alone is not authorization, including for Google users.
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  (SELECT id FROM auth_foundation_ids WHERE label = 'unknown-google'),
  '00000000-0000-0000-0000-000000000000'::uuid,
  'unknown-google@checkpoint-a.test',
  '',
  now(), now(), now(),
  '{"provider": "google", "providers": ["google"]}'::jsonb,
  '{"name": "Unknown Google User"}'::jsonb,
  false, 'authenticated', 'authenticated', '', '', '', ''
);

SELECT is(
  (SELECT count(*)::integer
   FROM public.organization_members
   WHERE user_id = (SELECT id FROM auth_foundation_ids WHERE label = 'unknown-google')),
  0,
  'workspace_domains match alone grants no membership'
);

SELECT is(
  (SELECT count(*)::integer
   FROM public.personal_organizations
   WHERE user_id = (SELECT id FROM auth_foundation_ids WHERE label = 'unknown-google')),
  0,
  'unknown Google user receives no personal organization'
);

-- Invitation acceptance remains the source of truth for invitation membership.
INSERT INTO public.organization_invitations (
  organization_id,
  email,
  role,
  invited_by,
  invitation_token,
  expires_at
) VALUES (
  (SELECT id FROM auth_foundation_ids WHERE label = 'org'),
  'invited@outside.test',
  'member',
  (SELECT id FROM auth_foundation_ids WHERE label = 'admin'),
  '27000000-1111-0000-0000-000000000001'::uuid,
  now() + interval '1 day'
);

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  (SELECT id FROM auth_foundation_ids WHERE label = 'invited'),
  '00000000-0000-0000-0000-000000000000'::uuid,
  'invited@outside.test',
  extensions.crypt('password123', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"name": "Invited User"}'::jsonb,
  false, 'authenticated', 'authenticated', '', '', '', ''
);

SELECT is(
  (SELECT count(*)::integer
   FROM public.organization_members
   WHERE user_id = (SELECT id FROM auth_foundation_ids WHERE label = 'invited')),
  0,
  'invited user is not joined before invitation acceptance'
);

SELECT set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (SELECT id::text FROM auth_foundation_ids WHERE label = 'invited'),
    'role', 'authenticated'
  )::text,
  true
);

SET LOCAL ROLE authenticated;

SELECT is(
  (
    public.accept_invitation_atomic(
      '27000000-1111-0000-0000-000000000001'::uuid,
      (SELECT id FROM auth_foundation_ids WHERE label = 'invited')
    )->>'success'
  )::boolean,
  true,
  'valid invitation remains accepted through the existing RPC'
);

RESET ROLE;

SELECT is(
  (SELECT role
   FROM public.organization_members
   WHERE organization_id = (SELECT id FROM auth_foundation_ids WHERE label = 'org')
     AND user_id = (SELECT id FROM auth_foundation_ids WHERE label = 'invited')),
  'member',
  'invitation creates the requested non-owner role'
);

SELECT is(
  (SELECT access_source
   FROM public.organization_members
   WHERE organization_id = (SELECT id FROM auth_foundation_ids WHERE label = 'org')
     AND user_id = (SELECT id FROM auth_foundation_ids WHERE label = 'invited')),
  'invitation',
  'invitation membership remains attributed to invitation flow'
);

-- An owner/admin-selected Workspace claim remains valid authorization.
INSERT INTO public.organization_member_claims (
  organization_id,
  email,
  source,
  status,
  created_by
) VALUES (
  (SELECT id FROM auth_foundation_ids WHERE label = 'org'),
  'claimed@checkpoint-a.test',
  'google_workspace',
  'selected',
  (SELECT id FROM auth_foundation_ids WHERE label = 'admin')
);

INSERT INTO public.google_workspace_directory_users (
  id,
  organization_id,
  google_user_id,
  primary_email,
  full_name,
  suspended,
  last_synced_at
) VALUES (
  (SELECT id FROM auth_foundation_ids WHERE label = 'directory-user'),
  (SELECT id FROM auth_foundation_ids WHERE label = 'org'),
  'checkpoint-a-directory-user',
  'claimed@checkpoint-a.test',
  'Claimed Workspace User',
  false,
  now()
);

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  (SELECT id FROM auth_foundation_ids WHERE label = 'claimed'),
  '00000000-0000-0000-0000-000000000000'::uuid,
  'claimed@checkpoint-a.test',
  '',
  now(), now(), now(),
  '{"provider": "google", "providers": ["google"]}'::jsonb,
  '{"name": "Claimed Workspace User"}'::jsonb,
  false, 'authenticated', 'authenticated', '', '', '', ''
);

SELECT is(
  (SELECT role
   FROM public.organization_members
   WHERE organization_id = (SELECT id FROM auth_foundation_ids WHERE label = 'org')
     AND user_id = (SELECT id FROM auth_foundation_ids WHERE label = 'claimed')),
  'member',
  'approved Workspace claim creates member role'
);

SELECT is(
  (SELECT access_source
   FROM public.organization_members
   WHERE organization_id = (SELECT id FROM auth_foundation_ids WHERE label = 'org')
     AND user_id = (SELECT id FROM auth_foundation_ids WHERE label = 'claimed')),
  'google_workspace',
  'approved Workspace claim records google_workspace access source'
);

SELECT is(
  (SELECT status
   FROM public.organization_member_claims
   WHERE organization_id = (SELECT id FROM auth_foundation_ids WHERE label = 'org')
     AND public.normalize_email(email) = 'claimed@checkpoint-a.test'),
  'claimed',
  'selected Workspace claim is marked claimed'
);

SELECT is(
  (SELECT count(*)::integer
   FROM public.personal_organizations
   WHERE user_id = (SELECT id FROM auth_foundation_ids WHERE label = 'claimed')),
  0,
  'Workspace-claimed user receives no personal organization'
);

SELECT set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (SELECT id::text FROM auth_foundation_ids WHERE label = 'admin'),
    'role', 'authenticated'
  )::text,
  true
);

SET LOCAL ROLE authenticated;

SELECT lives_ok(
  $$
    SELECT public.select_google_workspace_members(
      '27000000-0000-0000-0000-000000000001'::uuid,
      ARRAY['claimed@checkpoint-a.test'],
      ARRAY[]::text[]
    )
  $$,
  're-selecting an existing Workspace member remains idempotent'
);

RESET ROLE;

SELECT is(
  (SELECT count(*)::integer
   FROM public.organization_members
   WHERE organization_id = (SELECT id FROM auth_foundation_ids WHERE label = 'org')
     AND user_id = (SELECT id FROM auth_foundation_ids WHERE label = 'claimed')),
  1,
  'existing Workspace membership is not duplicated'
);

SELECT is(
  has_function_privilege(
    'authenticated',
    'public.create_workspace_organization_for_domain(text, text)',
    'EXECUTE'
  ),
  false,
  'authenticated cannot execute legacy organization creation RPC'
);

SELECT is(
  has_function_privilege(
    'anon',
    'public.create_workspace_organization_for_domain(text, text)',
    'EXECUTE'
  ),
  false,
  'anon cannot execute legacy organization creation RPC'
);

SELECT is(
  has_function_privilege(
    'service_role',
    'public.create_workspace_organization_for_domain(text, text)',
    'EXECUTE'
  ),
  true,
  'service_role retains the minimum trusted legacy RPC permission'
);

SELECT is(
  has_function_privilege(
    'authenticated',
    'public.auto_provision_workspace_organization(uuid, text, text)',
    'EXECUTE'
  ),
  false,
  'authenticated cannot execute verified Workspace provisioning RPC'
);

SELECT is(
  has_function_privilege(
    'service_role',
    'public.auto_provision_workspace_organization(uuid, text, text)',
    'EXECUTE'
  ),
  true,
  'service_role can execute verified Workspace provisioning RPC'
);

SET LOCAL ROLE service_role;

SELECT lives_ok(
  $$
    SELECT public.auto_provision_workspace_organization(
      '27000000-0000-0000-0000-000000000002'::uuid,
      'verified-checkpoint-a.test',
      'Verified Checkpoint A Organization'
    )
  $$,
  'trusted service-role Workspace provisioning remains executable'
);

RESET ROLE;

SELECT is(
  (SELECT organization_id::text
   FROM public.workspace_domains
   WHERE domain = 'verified-checkpoint-a.test'),
  '27000000-0000-0000-0000-000000000001',
  'trusted Workspace provisioning maps the verified domain to an owner-managed organization'
);

SET LOCAL ROLE authenticated;

SELECT throws_ok(
  $$
    SELECT public.create_workspace_organization_for_domain(
      'forbidden-checkpoint-a.test',
      'Forbidden Organization'
    )
  $$,
  '42501',
  NULL,
  'arbitrary authenticated caller is denied organization creation RPC execution'
);

RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
