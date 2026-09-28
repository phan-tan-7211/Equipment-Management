-- Self-registration access request security and lifecycle contract.
BEGIN;
SELECT plan(21);

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud, confirmation_token, recovery_token,
  email_change_token_new, email_change
) VALUES
  ('35000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'platform@checkpoint-35.test', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated', '', '', '', ''),
  ('35000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'requester@checkpoint-35.test', '', now(), now(), now(), '{"provider":"google","providers":["google"]}', '{}', false, 'authenticated', 'authenticated', '', '', '', ''),
  ('35000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'invited@checkpoint-35.test', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated', '', '', '', ''),
  ('35000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'member@checkpoint-35.test', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated', '', '', '', '');

INSERT INTO public.profiles (id, email, name) VALUES
  ('35000000-0000-0000-0000-000000000001', 'platform@checkpoint-35.test', 'Checkpoint 35 Platform Admin'),
  ('35000000-0000-0000-0000-000000000002', 'requester@checkpoint-35.test', 'Checkpoint 35 Requester'),
  ('35000000-0000-0000-0000-000000000003', 'invited@checkpoint-35.test', 'Checkpoint 35 Invited'),
  ('35000000-0000-0000-0000-000000000004', 'member@checkpoint-35.test', 'Checkpoint 35 Member')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.organizations (id, name, member_count)
VALUES ('35000000-0000-0000-0000-000000000010', 'Checkpoint 35 Organization', 1);
INSERT INTO public.organization_members (organization_id, user_id, role, status, access_source)
VALUES ('35000000-0000-0000-0000-000000000010', '35000000-0000-0000-0000-000000000004', 'member', 'active', 'invitation');
INSERT INTO private.platform_admins (user_id)
VALUES ('35000000-0000-0000-0000-000000000001');

SELECT is(has_table_privilege('authenticated', 'private.workspace_access_requests', 'SELECT'), false, 'authenticated cannot read access request table directly');
SELECT is(has_table_privilege('authenticated', 'private.workspace_access_requests', 'INSERT,UPDATE,DELETE'), false, 'authenticated cannot write access request table directly');
SELECT is(has_function_privilege('anon', 'public.ensure_workspace_access_request()', 'EXECUTE'), false, 'anonymous users cannot create access requests');
SELECT is(has_function_privilege('authenticated', 'public.ensure_workspace_access_request()', 'EXECUTE'), true, 'authenticated users can enter the guarded request operation');
SELECT is(has_function_privilege('authenticated', 'public.platform_list_access_requests(text)', 'EXECUTE'), true, 'Platform Admin list RPC is callable through the guarded authenticated surface');

SELECT set_config('request.jwt.claims', '{"sub":"35000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT is((public.ensure_workspace_access_request()).request_status, 'pending', 'uninvited authenticated user receives a pending access request');
SELECT is((public.ensure_workspace_access_request()).request_status, 'pending', 'repeated request creation is idempotent');
SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE user_id = '35000000-0000-0000-0000-000000000002'), 0, 'self-registration does not create organization membership');
RESET ROLE;
SELECT is((SELECT count(*)::integer FROM private.workspace_access_requests WHERE user_id = '35000000-0000-0000-0000-000000000002'), 1, 'repeated request does not create duplicates');

INSERT INTO public.organization_invitations (organization_id, email, role, invited_by, expires_at, status, invitation_token)
VALUES ('35000000-0000-0000-0000-000000000010', 'invited@checkpoint-35.test', 'member', '35000000-0000-0000-0000-000000000001', now() + interval '7 days', 'pending', '35000000-0000-0000-0000-000000000035');
SELECT set_config('request.jwt.claims', '{"sub":"35000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT is((public.ensure_workspace_access_request()).request_status, 'invitation_pending', 'invited user remains on invitation flow');
RESET ROLE;
SELECT is((SELECT count(*)::integer FROM private.workspace_access_requests WHERE user_id = '35000000-0000-0000-0000-000000000003'), 0, 'invited user does not receive a duplicate self-registration request');

SELECT set_config('request.jwt.claims', '{"sub":"35000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT throws_ok($$SELECT public.platform_list_access_requests('pending')$$, '42501', 'Platform Admin authority required', 'ordinary user cannot list access requests');
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"sub":"35000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::integer FROM public.platform_list_access_requests('pending')), 1, 'Platform Admin can list pending access requests');
SELECT is((SELECT assigned_role FROM public.platform_approve_access_request((SELECT request_id FROM public.platform_list_access_requests('pending') WHERE user_id = '35000000-0000-0000-0000-000000000002'), '35000000-0000-0000-0000-000000000010'::uuid, 'member')), 'member', 'Platform Admin can approve with an explicit role');
RESET ROLE;
SELECT is((SELECT status FROM private.workspace_access_requests WHERE user_id = '35000000-0000-0000-0000-000000000002'), 'approved', 'approval records final request state');
SELECT is((SELECT role FROM public.organization_members WHERE user_id = '35000000-0000-0000-0000-000000000002'), 'member', 'approval creates the requested membership role');
SELECT is((SELECT access_source FROM public.organization_members WHERE user_id = '35000000-0000-0000-0000-000000000002'), 'manual', 'approval records manual access attribution');

SELECT set_config('request.jwt.claims', '{"sub":"35000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT throws_ok($$SELECT public.platform_reject_access_request('35000000-0000-0000-0000-000000000002')$$, '42501', 'Platform Admin authority required', 'ordinary user cannot reject access requests');
RESET ROLE;

INSERT INTO private.workspace_access_requests (user_id, email, display_name)
VALUES ('35000000-0000-0000-0000-000000000003', 'invited@checkpoint-35.test', 'Checkpoint 35 Invited');
SELECT set_config('request.jwt.claims', '{"sub":"35000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT is((SELECT request_status FROM public.platform_reject_access_request((SELECT request_id FROM public.platform_list_access_requests('pending') WHERE user_id = '35000000-0000-0000-0000-000000000003'), 'not approved')), 'rejected', 'Platform Admin can reject a pending request');
RESET ROLE;
SELECT is((SELECT rejection_reason FROM private.workspace_access_requests WHERE user_id = '35000000-0000-0000-0000-000000000003'), 'not approved', 'rejection reason is retained for audit');
SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE user_id = '35000000-0000-0000-0000-000000000003'), 0, 'rejection does not create membership');

SELECT * FROM finish();
ROLLBACK;
