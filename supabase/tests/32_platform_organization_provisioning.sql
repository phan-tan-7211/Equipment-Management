-- Checkpoint C2: Platform Admin organization provisioning and Workspace
-- organization-creation retirement.

BEGIN;
SELECT plan(32);

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES
  ('32000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'platform@checkpoint-c2.test', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated', '', '', '', ''),
  ('32000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'normal@checkpoint-c2.test', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated', '', '', '', ''),
  ('32000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'org-owner@checkpoint-c2.test', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated', '', '', '', ''),
  ('32000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'org-admin@checkpoint-c2.test', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated', '', '', '', ''),
  ('32000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'revoked-platform@checkpoint-c2.test', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated', '', '', '', ''),
  ('32000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'initial.owner@checkpoint-c2.test', '', now(), now(), now(), '{"provider":"google","providers":["google"]}', '{}', false, 'authenticated', 'authenticated', '', '', '', ''),
  ('32000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'wrong.owner@checkpoint-c2.test', '', now(), now(), now(), '{"provider":"google","providers":["google"]}', '{}', false, 'authenticated', 'authenticated', '', '', '', ''),
  ('32000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'unknown@checkpoint-c2.test', '', now(), now(), now(), '{"provider":"google","providers":["google"]}', '{}', false, 'authenticated', 'authenticated', '', '', '', '');

INSERT INTO public.organizations (id, name, member_count)
VALUES ('32000000-0000-0000-0000-000000000010', 'Existing C2 Organization', 2);

INSERT INTO public.organization_members (
  organization_id, user_id, role, status, access_source
) VALUES
  ('32000000-0000-0000-0000-000000000010', '32000000-0000-0000-0000-000000000003', 'owner', 'active', 'owner'),
  ('32000000-0000-0000-0000-000000000010', '32000000-0000-0000-0000-000000000004', 'admin', 'active', 'invitation'),
  ('32000000-0000-0000-0000-000000000010', '32000000-0000-0000-0000-000000000002', 'member', 'active', 'invitation');

INSERT INTO private.platform_admins (user_id)
VALUES ('32000000-0000-0000-0000-000000000001');

INSERT INTO private.platform_admins (user_id, revoked_at, revoked_by)
VALUES (
  '32000000-0000-0000-0000-000000000005',
  now(),
  '32000000-0000-0000-0000-000000000001'
);

SELECT set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  $$SELECT public.platform_create_organization_and_invite_owner('Forbidden Normal Org', 'owner@normal-c2.test')$$,
  '42501', 'Platform Admin authority required',
  'normal authenticated user cannot provision an organization'
);

RESET ROLE;
SELECT set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  $$SELECT public.platform_create_organization_and_invite_owner('Forbidden Owner Org', 'owner@owner-c2.test')$$,
  '42501', 'Platform Admin authority required',
  'organization owner is not Platform Admin provisioning authority'
);

RESET ROLE;
SELECT set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  $$SELECT public.platform_create_organization_and_invite_owner('Forbidden Admin Org', 'owner@admin-c2.test')$$,
  '42501', 'Platform Admin authority required',
  'organization admin is not Platform Admin provisioning authority'
);

RESET ROLE;
SELECT set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  $$SELECT public.platform_create_organization_and_invite_owner('Forbidden Revoked Org', 'owner@revoked-c2.test')$$,
  '42501', 'Platform Admin authority required',
  'revoked Platform Admin cannot provision an organization'
);

RESET ROLE;
SELECT set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT lives_ok(
  $$SELECT public.platform_create_organization_and_invite_owner('  C2   Customer Organization  ', ' Initial.Owner@Checkpoint-C2.Test ')$$,
  'active Platform Admin can provision organization and initial owner invitation'
);

RESET ROLE;
SELECT is(
  (SELECT count(*)::integer FROM public.organizations WHERE name = 'C2 Customer Organization'),
  1,
  'organization name is normalized and organization is created once'
);
SELECT is(
  (SELECT member_count FROM public.organizations WHERE name = 'C2 Customer Organization'),
  0,
  'new organization starts with member_count zero'
);
SELECT is(
  (SELECT count(*)::integer
   FROM public.organization_members AS om
   JOIN public.organizations AS o ON o.id = om.organization_id
   WHERE o.name = 'C2 Customer Organization'),
  0,
  'new organization has no membership before invitation claim'
);
SELECT is(
  (SELECT count(*)::integer
   FROM public.organization_members AS om
   JOIN public.organizations AS o ON o.id = om.organization_id
   WHERE o.name = 'C2 Customer Organization'
     AND om.user_id = '32000000-0000-0000-0000-000000000001'),
  0,
  'provisioning Platform Admin receives no organization membership'
);
SELECT is(
  (SELECT count(*)::integer
   FROM public.organization_invitations AS oi
   JOIN public.organizations AS o ON o.id = oi.organization_id
   WHERE o.name = 'C2 Customer Organization'
     AND oi.status = 'pending'),
  1,
  'initial owner invitation is created pending'
);
SELECT is(
  (SELECT oi.role
   FROM public.organization_invitations AS oi
   JOIN public.organizations AS o ON o.id = oi.organization_id
   WHERE o.name = 'C2 Customer Organization'),
  'owner',
  'initial invitation role is exactly OWNER'
);
SELECT is(
  (SELECT oi.email
   FROM public.organization_invitations AS oi
   JOIN public.organizations AS o ON o.id = oi.organization_id
   WHERE o.name = 'C2 Customer Organization'),
  'initial.owner@checkpoint-c2.test',
  'initial owner email is normalized'
);

SELECT set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  $$SELECT public.platform_create_organization_and_invite_owner('Atomic Failure Organization', 'not-an-email')$$,
  '22023', 'A valid owner email is required',
  'invalid owner email is rejected'
);
RESET ROLE;
SELECT is(
  (SELECT count(*)::integer FROM public.organizations WHERE name = 'Atomic Failure Organization'),
  0,
  'failed provisioning leaves no partial organization'
);
SELECT is(
  (SELECT count(*)::integer FROM public.organization_invitations WHERE email = 'not-an-email'),
  0,
  'failed provisioning leaves no partial invitation'
);

SELECT set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  $$SELECT public.platform_create_organization_and_invite_owner('c2 customer organization', 'another@checkpoint-c2.test')$$,
  '23505', 'An organization with this name already exists',
  'case-insensitive duplicate organization name is rejected'
);

-- Existing B2 claim remains the only path that creates initial OWNER membership.
RESET ROLE;
CREATE TEMP TABLE c2_invitation_tokens (invitation_token uuid PRIMARY KEY);
INSERT INTO c2_invitation_tokens
SELECT oi.invitation_token
FROM public.organization_invitations AS oi
JOIN public.organizations AS o ON o.id = oi.organization_id
WHERE o.name = 'C2 Customer Organization';
GRANT SELECT ON c2_invitation_tokens TO authenticated;

SELECT set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000007","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT is(
  (public.accept_invitation_atomic((SELECT invitation_token FROM c2_invitation_tokens))->>'success')::boolean,
  false,
  'wrong verified identity cannot claim initial OWNER invitation'
);

RESET ROLE;
SELECT set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT is(
  (public.accept_invitation_atomic((SELECT invitation_token FROM c2_invitation_tokens))->>'role')::text,
  'owner',
  'matching verified identity claims the OWNER invitation through B2'
);
RESET ROLE;
SELECT is(
  (SELECT om.role
   FROM public.organization_members AS om
   JOIN public.organizations AS o ON o.id = om.organization_id
   WHERE o.name = 'C2 Customer Organization'
     AND om.user_id = '32000000-0000-0000-0000-000000000006'),
  'owner',
  'B2 stores the invited owner membership exactly'
);

SELECT set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT is(
  (public.accept_invitation_atomic((SELECT invitation_token FROM c2_invitation_tokens))->>'success')::boolean,
  true,
  'repeated claim by the same owner succeeds idempotently'
);
RESET ROLE;
SELECT is(
  (SELECT count(*)::integer
   FROM public.organization_members AS om
   JOIN public.organizations AS o ON o.id = om.organization_id
   WHERE o.name = 'C2 Customer Organization'
     AND om.user_id = '32000000-0000-0000-0000-000000000006'),
  1,
  'repeated claim cannot create duplicate membership'
);
SELECT is(
  (SELECT count(*)::integer FROM public.organization_members WHERE user_id = '32000000-0000-0000-0000-000000000008'),
  0,
  'unknown Google user without invitation receives no organization'
);

-- Workspace OAuth requires an existing organization and active OWNER/ADMIN.
SELECT set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  $$SELECT public.create_google_workspace_oauth_session(NULL, '/dashboard', 'https://example.test')$$,
  '22004', 'Existing organization is required to connect Google Workspace',
  'Workspace OAuth cannot start without an existing organization'
);

RESET ROLE;
SELECT set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  $$SELECT public.create_google_workspace_oauth_session('32000000-0000-0000-0000-000000000010', '/dashboard', 'https://example.test')$$,
  '42501', 'Only active organization owners or admins can connect Google Workspace',
  'ordinary organization member cannot start Workspace OAuth'
);

CREATE TEMP TABLE c2_oauth_sessions (session_token text PRIMARY KEY);
GRANT ALL ON c2_oauth_sessions TO authenticated, service_role;

RESET ROLE;
SELECT set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT lives_ok(
  $$INSERT INTO c2_oauth_sessions SELECT session_token FROM public.create_google_workspace_oauth_session('32000000-0000-0000-0000-000000000010', '/dashboard', 'https://example.test')$$,
  'active organization owner can start Workspace OAuth'
);

RESET ROLE;
SELECT set_config('request.jwt.claims', '{"sub":"32000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT lives_ok(
  $$SELECT public.create_google_workspace_oauth_session('32000000-0000-0000-0000-000000000010', '/dashboard', 'https://example.test')$$,
  'active organization admin can start Workspace OAuth'
);

-- Revoke the owner's authorization after session creation. Callback validation
-- must fail without consuming authority granted before the external redirect.
RESET ROLE;
UPDATE public.organization_members
SET role = 'member'
WHERE organization_id = '32000000-0000-0000-0000-000000000010'
  AND user_id = '32000000-0000-0000-0000-000000000003';

SET LOCAL ROLE service_role;
SELECT is(
  (SELECT is_valid
   FROM public.validate_google_workspace_oauth_session(
     (SELECT session_token FROM c2_oauth_sessions LIMIT 1)
   )),
  false,
  'Workspace callback revalidates organization authorization'
);

RESET ROLE;
SELECT is(
  has_function_privilege('authenticated', 'public.create_workspace_organization_for_domain(text,text)', 'EXECUTE'),
  false,
  'authenticated cannot execute retired Workspace organization creation RPC'
);
SELECT is(
  has_function_privilege('service_role', 'public.auto_provision_workspace_organization(uuid,text,text)', 'EXECUTE'),
  false,
  'service role cannot execute retired Workspace auto-provisioning RPC'
);
SELECT throws_ok(
  $$SELECT public.auto_provision_workspace_organization('32000000-0000-0000-0000-000000000003', 'new-domain.test', 'Forbidden Workspace Org')$$,
  '0A000', 'Workspace organization auto-provisioning has been retired',
  'historical Workspace auto-provision implementation fails closed'
);
SELECT is(
  (SELECT count(*)::integer FROM public.organizations WHERE name = 'Forbidden Workspace Org'),
  0,
  'retired Workspace path creates no organization'
);
SELECT is(
  (SELECT count(*)::integer FROM public.google_workspace_oauth_sessions WHERE organization_id IS NULL),
  0,
  'Workspace OAuth stores no organization-less sessions'
);

SELECT * FROM finish();
ROLLBACK;
