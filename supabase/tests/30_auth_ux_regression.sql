-- Checkpoint B3: existing access survives linked authentication identities,
-- while authentication alone cannot cross an organization boundary.

BEGIN;
SELECT plan(10);

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'owner@checkpoint-b3.test',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"google","providers":["email","google"]}',
    '{"name":"Existing Owner"}',
    false, 'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'member@checkpoint-b3.test',
    '', now(), now(), now(),
    '{"provider":"google","providers":["google"]}',
    '{"name":"Existing Member"}',
    false, 'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'unknown@checkpoint-b3.test',
    '', now(), now(), now(),
    '{"provider":"google","providers":["google"]}',
    '{"name":"Unknown Google User"}',
    false, 'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'target@checkpoint-b3.test',
    '', now(), now(), now(),
    '{"provider":"google","providers":["google"]}',
    '{"name":"Invited Target"}',
    false, 'authenticated', 'authenticated', '', '', '', ''
  );

INSERT INTO auth.identities (
  id, user_id, provider, provider_id, identity_data, created_at, updated_at
) VALUES
  (
    '30000000-0000-0000-0000-000000000011',
    '30000000-0000-0000-0000-000000000001',
    'email',
    '30000000-0000-0000-0000-000000000001',
    '{"email":"owner@checkpoint-b3.test","email_verified":true}',
    now(), now()
  ),
  (
    '30000000-0000-0000-0000-000000000012',
    '30000000-0000-0000-0000-000000000001',
    'google',
    'google-owner-checkpoint-b3',
    '{"email":"owner@checkpoint-b3.test","email_verified":true}',
    now(), now()
  );

INSERT INTO public.organizations (id, name, plan, member_count, max_members, features)
VALUES
  ('30000000-0000-0000-0000-000000000021', 'Checkpoint B3 Org A', 'free', 2, 20, ARRAY['Equipment Management']),
  ('30000000-0000-0000-0000-000000000022', 'Checkpoint B3 Org B', 'free', 0, 20, ARRAY['Equipment Management']);

INSERT INTO public.organization_members (organization_id, user_id, role, status, access_source)
VALUES
  ('30000000-0000-0000-0000-000000000021', '30000000-0000-0000-0000-000000000001', 'owner', 'active', 'owner'),
  ('30000000-0000-0000-0000-000000000021', '30000000-0000-0000-0000-000000000002', 'member', 'active', 'invitation');

INSERT INTO public.organization_invitations (
  organization_id, email, role, invited_by, invitation_token, status, expires_at
) VALUES (
  '30000000-0000-0000-0000-000000000022',
  'target@checkpoint-b3.test',
  'admin',
  '30000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000031',
  'pending',
  now() + interval '1 day'
);

SELECT is(
  (SELECT count(*)::integer FROM auth.users WHERE email = 'owner@checkpoint-b3.test'),
  1,
  'password and Google identities resolve to one existing auth user'
);
SELECT is(
  (SELECT count(*)::integer FROM auth.identities WHERE user_id = '30000000-0000-0000-0000-000000000001'),
  2,
  'existing owner retains both password and Google identities'
);
SELECT is(
  (SELECT role FROM public.organization_members WHERE user_id = '30000000-0000-0000-0000-000000000001'),
  'owner',
  'existing owner role is preserved'
);
SELECT is(
  (SELECT count(*)::integer FROM public.organization_members WHERE user_id = '30000000-0000-0000-0000-000000000001'),
  1,
  'linked owner identity does not duplicate membership'
);
SELECT is(
  (SELECT role FROM public.organization_members WHERE user_id = '30000000-0000-0000-0000-000000000002'),
  'member',
  'existing member role is preserved after Google authentication'
);

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
SET LOCAL ROLE authenticated;
SELECT is(
  (public.accept_invitation_atomic('30000000-0000-0000-0000-000000000031')->>'success')::boolean,
  false,
  'Org A owner cannot claim an Org B invitation addressed to another verified email'
);
RESET ROLE;

SELECT is(
  (SELECT count(*)::integer FROM public.organization_members WHERE organization_id = '30000000-0000-0000-0000-000000000022'),
  0,
  'failed cross-organization claim creates no Org B membership'
);
SELECT is(
  (SELECT status FROM public.organization_invitations WHERE invitation_token = '30000000-0000-0000-0000-000000000031'),
  'pending',
  'failed cross-organization claim does not consume the invitation'
);
SELECT is(
  (SELECT count(*)::integer FROM public.organization_members WHERE user_id = '30000000-0000-0000-0000-000000000003'),
  0,
  'unknown Google user has no organization membership'
);
SELECT is(
  (SELECT count(*)::integer FROM public.organization_members WHERE user_id = '30000000-0000-0000-0000-000000000003' AND role = 'owner'),
  0,
  'unknown Google user receives no owner role'
);

SELECT * FROM finish();
ROLLBACK;
