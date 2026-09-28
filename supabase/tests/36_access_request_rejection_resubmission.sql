-- Rejected access requests remain stable until the requester explicitly resubmits.
BEGIN;
SELECT plan(18);

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud, confirmation_token, recovery_token,
  email_change_token_new, email_change
) VALUES
  ('36000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'platform@checkpoint-36.test', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated', '', '', '', ''),
  ('36000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'requester@checkpoint-36.test', '', now(), now(), now(), '{"provider":"google","providers":["google"]}', '{}', false, 'authenticated', 'authenticated', '', '', '', '');

INSERT INTO public.profiles (id, email, name) VALUES
  ('36000000-0000-0000-0000-000000000001', 'platform@checkpoint-36.test', 'Checkpoint 36 Platform Admin'),
  ('36000000-0000-0000-0000-000000000002', 'requester@checkpoint-36.test', 'Checkpoint 36 Requester')
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email, name = EXCLUDED.name;

INSERT INTO private.platform_admins (user_id)
VALUES ('36000000-0000-0000-0000-000000000001');

SELECT is(has_function_privilege('anon', 'public.resubmit_workspace_access_request()', 'EXECUTE'), false, 'anonymous users cannot resubmit access requests');
SELECT is(has_function_privilege('authenticated', 'public.resubmit_workspace_access_request()', 'EXECUTE'), true, 'authenticated users can enter the guarded resubmission operation');

SELECT set_config('request.jwt.claims', '{"sub":"36000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT is((public.ensure_workspace_access_request()).request_status, 'pending', 'first sign-in creates one pending request');
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"sub":"36000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT is(
  (SELECT request_status FROM public.platform_reject_access_request(
    (SELECT request_id FROM public.platform_list_access_requests('pending') WHERE user_id = '36000000-0000-0000-0000-000000000002'),
    'Organization assignment could not be verified'
  )),
  'rejected',
  'Platform Admin can reject the pending request'
);
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"sub":"36000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT is((public.ensure_workspace_access_request()).request_status, 'rejected', 'next sign-in returns the rejected state');
SELECT is((public.ensure_workspace_access_request()).request_status, 'rejected', 'repeated sign-in keeps the rejected state');
SELECT is((public.ensure_workspace_access_request()).rejection_reason, 'Organization assignment could not be verified', 'requester can see the rejection reason');
SELECT is((public.ensure_workspace_access_request()).reviewed_by_name, 'Checkpoint 36 Platform Admin', 'requester can see the reviewer display name');
RESET ROLE;

SELECT is((SELECT count(*)::integer FROM private.workspace_access_requests WHERE user_id = '36000000-0000-0000-0000-000000000002'), 1, 'signing in again does not create another request');
SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE user_id = '36000000-0000-0000-0000-000000000002'), 0, 'rejection still grants no membership');

SELECT set_config('request.jwt.claims', '{"sub":"36000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT is((public.resubmit_workspace_access_request()).request_status, 'pending', 'requester can explicitly resubmit a rejected request');
RESET ROLE;

SELECT is((SELECT count(*)::integer FROM private.workspace_access_requests WHERE user_id = '36000000-0000-0000-0000-000000000002'), 2, 'resubmission preserves the rejected history row');
SELECT is((SELECT count(*)::integer FROM private.workspace_access_requests WHERE user_id = '36000000-0000-0000-0000-000000000002' AND status = 'pending'), 1, 'resubmission creates exactly one pending row');
SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE user_id = '36000000-0000-0000-0000-000000000002'), 0, 'resubmission does not grant membership');

SELECT set_config('request.jwt.claims', '{"sub":"36000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  $$SELECT public.resubmit_workspace_access_request()$$,
  '23505',
  'Access request is already pending',
  'a pending request cannot be resubmitted again'
);
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"sub":"36000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::integer FROM public.platform_list_access_requests(NULL) WHERE user_id = '36000000-0000-0000-0000-000000000002'), 2, 'Platform Admin history contains both attempts');
SELECT is((SELECT reviewed_by_name FROM public.platform_list_access_requests('rejected') WHERE user_id = '36000000-0000-0000-0000-000000000002'), 'Checkpoint 36 Platform Admin', 'Platform Admin history identifies the reviewer');
SELECT is((SELECT rejection_reason FROM public.platform_list_access_requests('rejected') WHERE user_id = '36000000-0000-0000-0000-000000000002'), 'Organization assignment could not be verified', 'Platform Admin history retains the rejection reason');
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
