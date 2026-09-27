-- Checkpoint C1: Platform Admin authority is private, independent from
-- organization membership, and mutable only by active Platform Admins.

BEGIN;
SELECT plan(29);

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES
  ('31000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'ordinary@checkpoint-c1.test', '', now(), now(), now(), '{}', '{}', false, 'authenticated', 'authenticated', '', '', '', ''),
  ('31000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'owner@checkpoint-c1.test', '', now(), now(), now(), '{}', '{}', false, 'authenticated', 'authenticated', '', '', '', ''),
  ('31000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'admin@checkpoint-c1.test', '', now(), now(), now(), '{}', '{}', false, 'authenticated', 'authenticated', '', '', '', ''),
  ('31000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'platform-one@checkpoint-c1.test', '', now(), now(), now(), '{}', '{}', false, 'authenticated', 'authenticated', '', '', '', ''),
  ('31000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'platform-two@checkpoint-c1.test', '', now(), now(), now(), '{}', '{}', false, 'authenticated', 'authenticated', '', '', '', '');

INSERT INTO public.organizations (id, name, plan, member_count, max_members, features)
VALUES ('31000000-0000-0000-0000-000000000010', 'Checkpoint C1 Organization', 'free', 2, 20, ARRAY['Equipment Management']);

INSERT INTO public.organization_members (organization_id, user_id, role, status, access_source)
VALUES
  ('31000000-0000-0000-0000-000000000010', '31000000-0000-0000-0000-000000000002', 'owner', 'active', 'owner'),
  ('31000000-0000-0000-0000-000000000010', '31000000-0000-0000-0000-000000000003', 'admin', 'active', 'invitation');

SELECT is((SELECT count(*)::integer FROM private.platform_admins), 0, 'Platform Admin registry starts empty');

SET LOCAL ROLE service_role;
SELECT is(public.is_platform_admin('31000000-0000-0000-0000-000000000001'), false, 'ordinary user is not Platform Admin');
SELECT is(public.is_platform_admin('31000000-0000-0000-0000-000000000002'), false, 'organization owner is not Platform Admin');
SELECT is(public.is_platform_admin('31000000-0000-0000-0000-000000000003'), false, 'organization admin is not Platform Admin');
RESET ROLE;

SELECT is(has_schema_privilege('public', 'private', 'USAGE'), false, 'PUBLIC has no private schema usage');
SELECT is(has_schema_privilege('anon', 'private', 'USAGE'), false, 'anon has no private schema usage');
SELECT is(has_schema_privilege('authenticated', 'private', 'USAGE'), false, 'authenticated has no private schema usage');
SELECT is(has_table_privilege('authenticated', 'private.platform_admins', 'SELECT'), false, 'authenticated cannot read the private registry');
SELECT is(has_table_privilege('authenticated', 'private.platform_admins', 'INSERT,UPDATE,DELETE'), false, 'authenticated cannot write the private registry');
SELECT is(has_function_privilege('authenticated', 'public.is_platform_admin(uuid)', 'EXECUTE'), false, 'authenticated cannot call the service-only predicate');
SELECT is(has_function_privilege('service_role', 'public.is_platform_admin(uuid)', 'EXECUTE'), true, 'service_role can call the Platform Admin predicate');
SELECT is(has_function_privilege('authenticated', 'public.grant_platform_admin(uuid)', 'EXECUTE'), true, 'authenticated can enter the guarded grant operation');
SELECT is(has_function_privilege('authenticated', 'public.revoke_platform_admin(uuid)', 'EXECUTE'), true, 'authenticated can enter the guarded revoke operation');

SELECT set_config('request.jwt.claims', '{"sub":"31000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT throws_ok($$SELECT public.grant_platform_admin('31000000-0000-0000-0000-000000000005')$$, '42501', 'Platform Admin authority required', 'ordinary user cannot grant Platform Admin');
SELECT throws_ok($$SELECT public.revoke_platform_admin('31000000-0000-0000-0000-000000000004')$$, '42501', 'Platform Admin authority required', 'ordinary user cannot revoke Platform Admin');
SELECT throws_ok($$SELECT count(*) FROM private.platform_admins$$, '42501', NULL, 'authenticated client cannot query the private registry directly');
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"sub":"31000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT throws_ok($$SELECT public.grant_platform_admin('31000000-0000-0000-0000-000000000005')$$, '42501', 'Platform Admin authority required', 'organization owner cannot grant Platform Admin');
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"sub":"31000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT throws_ok($$SELECT public.grant_platform_admin('31000000-0000-0000-0000-000000000005')$$, '42501', 'Platform Admin authority required', 'organization admin cannot grant Platform Admin');
RESET ROLE;

-- Controlled bootstrap is intentionally a direct database-administrator insert.
INSERT INTO private.platform_admins (user_id)
VALUES ('31000000-0000-0000-0000-000000000004');

SET LOCAL ROLE service_role;
SELECT is(public.is_platform_admin('31000000-0000-0000-0000-000000000004'), true, 'active private registry entry is Platform Admin');
RESET ROLE;

SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE user_id = '31000000-0000-0000-0000-000000000004'), 0, 'Platform Admin authority creates no organization membership');

SELECT set_config('request.jwt.claims', '{"sub":"31000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT is(public.grant_platform_admin('31000000-0000-0000-0000-000000000005'), true, 'active Platform Admin can grant Platform Admin');
RESET ROLE;

SET LOCAL ROLE service_role;
SELECT is(public.is_platform_admin('31000000-0000-0000-0000-000000000005'), true, 'granted registry entry is active Platform Admin');
RESET ROLE;

SELECT is((SELECT granted_by FROM private.platform_admins WHERE user_id = '31000000-0000-0000-0000-000000000005'), '31000000-0000-0000-0000-000000000004'::uuid, 'grant operation records its Platform Admin actor');
SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE user_id = '31000000-0000-0000-0000-000000000005'), 0, 'granted Platform Admin receives no organization membership');

SET LOCAL ROLE authenticated;
SELECT is(public.revoke_platform_admin('31000000-0000-0000-0000-000000000005'), true, 'active Platform Admin can revoke Platform Admin');
RESET ROLE;

SET LOCAL ROLE service_role;
SELECT is(public.is_platform_admin('31000000-0000-0000-0000-000000000005'), false, 'revoked registry entry is not Platform Admin');
RESET ROLE;

SELECT is((SELECT revoked_by FROM private.platform_admins WHERE user_id = '31000000-0000-0000-0000-000000000005'), '31000000-0000-0000-0000-000000000004'::uuid, 'revoke operation records its Platform Admin actor');

SET LOCAL ROLE authenticated;
SELECT throws_ok($$SELECT public.revoke_platform_admin('31000000-0000-0000-0000-000000000004')$$, '23514', 'Cannot revoke the final active Platform Admin', 'final active Platform Admin cannot be revoked');
RESET ROLE;

SET LOCAL ROLE service_role;
SELECT is(public.is_platform_admin('31000000-0000-0000-0000-000000000004'), true, 'failed final revocation preserves Platform Admin authority');
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
