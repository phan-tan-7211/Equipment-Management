-- Checkpoint B2: a verified Google identity may claim only its matching
-- invitation, preserving the exact invited organization role.

BEGIN;
SELECT plan(35);

CREATE TEMP TABLE google_invitation_ids (
  label text PRIMARY KEY,
  id uuid NOT NULL
);

INSERT INTO google_invitation_ids (label, id) VALUES
  ('organization', '29000000-0000-0000-0000-000000000001'::uuid),
  ('inviter', '29000000-0000-0000-0000-000000000002'::uuid),
  ('member', '29000000-0000-0000-0000-000000000003'::uuid),
  ('owner', '29000000-0000-0000-0000-000000000004'::uuid),
  ('admin', '29000000-0000-0000-0000-000000000005'::uuid),
  ('viewer', '29000000-0000-0000-0000-000000000006'::uuid),
  ('requestor', '29000000-0000-0000-0000-000000000007'::uuid),
  ('wrong-email', '29000000-0000-0000-0000-000000000008'::uuid),
  ('existing-member', '29000000-0000-0000-0000-000000000009'::uuid),
  ('expired', '29000000-0000-0000-0000-000000000010'::uuid),
  ('revoked', '29000000-0000-0000-0000-000000000011'::uuid),
  ('password-user', '29000000-0000-0000-0000-000000000012'::uuid),
  ('unknown-google', '29000000-0000-0000-0000-000000000013'::uuid);

GRANT SELECT ON google_invitation_ids TO authenticated, service_role;

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
SELECT
  ids.id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  CASE ids.label
    WHEN 'inviter' THEN 'inviter@checkpoint-b2.test'
    WHEN 'member' THEN 'member@checkpoint-b2.test'
    WHEN 'owner' THEN 'owner@checkpoint-b2.test'
    WHEN 'admin' THEN 'admin@checkpoint-b2.test'
    WHEN 'viewer' THEN 'viewer@checkpoint-b2.test'
    WHEN 'requestor' THEN 'requestor@checkpoint-b2.test'
    WHEN 'wrong-email' THEN 'wrong-google@checkpoint-b2.test'
    WHEN 'existing-member' THEN 'existing@checkpoint-b2.test'
    WHEN 'expired' THEN 'expired@checkpoint-b2.test'
    WHEN 'revoked' THEN 'revoked@checkpoint-b2.test'
    WHEN 'password-user' THEN 'password@checkpoint-b2.test'
    WHEN 'unknown-google' THEN 'unknown@checkpoint-b2.test'
  END,
  CASE
    WHEN ids.label IN ('inviter', 'password-user')
      THEN extensions.crypt('password123', extensions.gen_salt('bf'))
    ELSE ''
  END,
  now(), now(), now(),
  CASE
    WHEN ids.label IN ('inviter', 'password-user')
      THEN '{"provider":"email","providers":["email"]}'::jsonb
    ELSE '{"provider":"google","providers":["google"]}'::jsonb
  END,
  jsonb_build_object('name', initcap(replace(ids.label, '-', ' '))),
  false, 'authenticated', 'authenticated', '', '', '', ''
FROM google_invitation_ids ids
WHERE ids.label <> 'organization';

INSERT INTO public.organizations (id, name, plan, member_count, max_members, features)
VALUES (
  (SELECT id FROM google_invitation_ids WHERE label = 'organization'),
  'Checkpoint B2 Organization',
  'free',
  1,
  20,
  ARRAY['Equipment Management']
);

INSERT INTO public.organization_members (
  organization_id, user_id, role, status, access_source
) VALUES
  (
    (SELECT id FROM google_invitation_ids WHERE label = 'organization'),
    (SELECT id FROM google_invitation_ids WHERE label = 'inviter'),
    'owner', 'active', 'owner'
  ),
  (
    (SELECT id FROM google_invitation_ids WHERE label = 'organization'),
    (SELECT id FROM google_invitation_ids WHERE label = 'existing-member'),
    'admin', 'active', 'invitation'
  );

INSERT INTO public.organization_invitations (
  organization_id, email, role, invited_by, invitation_token,
  status, expires_at, accepted_at, declined_at
) VALUES
  ((SELECT id FROM google_invitation_ids WHERE label = 'organization'), 'member@checkpoint-b2.test', 'member', (SELECT id FROM google_invitation_ids WHERE label = 'inviter'), '29100000-0000-0000-0000-000000000001', 'pending', now() + interval '1 day', NULL, NULL),
  ((SELECT id FROM google_invitation_ids WHERE label = 'organization'), 'owner@checkpoint-b2.test', 'owner', (SELECT id FROM google_invitation_ids WHERE label = 'inviter'), '29100000-0000-0000-0000-000000000002', 'pending', now() + interval '1 day', NULL, NULL),
  ((SELECT id FROM google_invitation_ids WHERE label = 'organization'), 'admin@checkpoint-b2.test', 'admin', (SELECT id FROM google_invitation_ids WHERE label = 'inviter'), '29100000-0000-0000-0000-000000000003', 'pending', now() + interval '1 day', NULL, NULL),
  ((SELECT id FROM google_invitation_ids WHERE label = 'organization'), 'viewer@checkpoint-b2.test', 'viewer', (SELECT id FROM google_invitation_ids WHERE label = 'inviter'), '29100000-0000-0000-0000-000000000004', 'pending', now() + interval '1 day', NULL, NULL),
  ((SELECT id FROM google_invitation_ids WHERE label = 'organization'), 'requestor@checkpoint-b2.test', 'requestor', (SELECT id FROM google_invitation_ids WHERE label = 'inviter'), '29100000-0000-0000-0000-000000000005', 'pending', now() + interval '1 day', NULL, NULL),
  ((SELECT id FROM google_invitation_ids WHERE label = 'organization'), 'invited-target@checkpoint-b2.test', 'member', (SELECT id FROM google_invitation_ids WHERE label = 'inviter'), '29100000-0000-0000-0000-000000000006', 'pending', now() + interval '1 day', NULL, NULL),
  ((SELECT id FROM google_invitation_ids WHERE label = 'organization'), 'existing@checkpoint-b2.test', 'viewer', (SELECT id FROM google_invitation_ids WHERE label = 'inviter'), '29100000-0000-0000-0000-000000000007', 'pending', now() + interval '1 day', NULL, NULL),
  ((SELECT id FROM google_invitation_ids WHERE label = 'organization'), 'expired@checkpoint-b2.test', 'member', (SELECT id FROM google_invitation_ids WHERE label = 'inviter'), '29100000-0000-0000-0000-000000000008', 'pending', now() - interval '1 minute', NULL, NULL),
  ((SELECT id FROM google_invitation_ids WHERE label = 'organization'), 'revoked@checkpoint-b2.test', 'member', (SELECT id FROM google_invitation_ids WHERE label = 'inviter'), '29100000-0000-0000-0000-000000000009', 'declined', now() + interval '1 day', NULL, now()),
  ((SELECT id FROM google_invitation_ids WHERE label = 'organization'), 'password@checkpoint-b2.test', 'member', (SELECT id FROM google_invitation_ids WHERE label = 'inviter'), '29100000-0000-0000-0000-000000000010', 'pending', now() + interval '1 day', NULL, NULL);

-- Matching verified Google identities receive the invitation's exact role.
SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT id::text FROM google_invitation_ids WHERE label = 'member'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
SELECT is((public.accept_invitation_atomic('29100000-0000-0000-0000-000000000001')->>'role')::text, 'member', 'matching Google user claims MEMBER invitation');
RESET ROLE;
SELECT is((SELECT role FROM public.organization_members WHERE user_id = (SELECT id FROM google_invitation_ids WHERE label = 'member')), 'member', 'MEMBER role is stored exactly');
SELECT is((SELECT access_source FROM public.organization_members WHERE user_id = (SELECT id FROM google_invitation_ids WHERE label = 'member')), 'invitation', 'Google claim remains attributed to the invitation authorization path');

SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT id::text FROM google_invitation_ids WHERE label = 'member'), 'role', 'authenticated', 'email', 'member@checkpoint-b2.test')::text, true);
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  $$ UPDATE public.organization_invitations SET role = 'owner' WHERE invitation_token = '29100000-0000-0000-0000-000000000001' $$,
  '42501',
  'Invitation authorization fields cannot be changed',
  'invitee cannot rewrite the role on an invitation it can update'
);
RESET ROLE;
SELECT is((SELECT role FROM public.organization_invitations WHERE invitation_token = '29100000-0000-0000-0000-000000000001'), 'member', 'invitee role rewrite attempt leaves invitation unchanged');

SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT id::text FROM google_invitation_ids WHERE label = 'owner'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
SELECT is((public.accept_invitation_atomic('29100000-0000-0000-0000-000000000002')->>'success')::boolean, false, 'second OWNER invitation is rejected for an established organization');
RESET ROLE;
SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE user_id = (SELECT id FROM google_invitation_ids WHERE label = 'owner')), 0, 'rejected second OWNER invitation grants no membership');

SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT id::text FROM google_invitation_ids WHERE label = 'admin'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
SELECT is((public.accept_invitation_atomic('29100000-0000-0000-0000-000000000003')->>'role')::text, 'admin', 'matching Google user claims ADMIN invitation');
RESET ROLE;
SELECT is((SELECT role FROM public.organization_members WHERE user_id = (SELECT id FROM google_invitation_ids WHERE label = 'admin')), 'admin', 'ADMIN role is stored exactly');

SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT id::text FROM google_invitation_ids WHERE label = 'viewer'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
SELECT is((public.accept_invitation_atomic('29100000-0000-0000-0000-000000000004')->>'role')::text, 'viewer', 'matching Google user claims VIEWER invitation');
RESET ROLE;
SELECT is((SELECT role FROM public.organization_members WHERE user_id = (SELECT id FROM google_invitation_ids WHERE label = 'viewer')), 'viewer', 'VIEWER role is stored exactly');

SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT id::text FROM google_invitation_ids WHERE label = 'requestor'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
SELECT is((public.accept_invitation_atomic('29100000-0000-0000-0000-000000000005')->>'role')::text, 'requestor', 'matching Google user claims REQUESTOR invitation');
RESET ROLE;
SELECT is((SELECT role FROM public.organization_members WHERE user_id = (SELECT id FROM google_invitation_ids WHERE label = 'requestor')), 'requestor', 'REQUESTOR role is stored exactly');

-- A different Google email cannot consume the invitation.
SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT id::text FROM google_invitation_ids WHERE label = 'wrong-email'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
SELECT is((public.accept_invitation_atomic('29100000-0000-0000-0000-000000000006')->>'success')::boolean, false, 'wrong Google email is rejected');
RESET ROLE;
SELECT is((SELECT status FROM public.organization_invitations WHERE invitation_token = '29100000-0000-0000-0000-000000000006'), 'pending', 'wrong-email attempt leaves invitation pending');
SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE user_id = (SELECT id FROM google_invitation_ids WHERE label = 'wrong-email')), 0, 'wrong-email attempt grants no membership');

-- OAuth callback replay is idempotent and does not duplicate membership.
SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT id::text FROM google_invitation_ids WHERE label = 'member'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
SELECT is((public.accept_invitation_atomic('29100000-0000-0000-0000-000000000001')->>'success')::boolean, true, 'repeated claim by the same identity succeeds idempotently');
RESET ROLE;
SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE organization_id = (SELECT id FROM google_invitation_ids WHERE label = 'organization') AND user_id = (SELECT id FROM google_invitation_ids WHERE label = 'member')), 1, 'repeated claim creates no duplicate membership');

SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT id::text FROM google_invitation_ids WHERE label = 'wrong-email'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
SELECT is((public.accept_invitation_atomic('29100000-0000-0000-0000-000000000001')->>'success')::boolean, false, 'already-consumed invitation cannot be claimed by another identity');
RESET ROLE;

-- An existing active membership is preserved and never duplicated or remapped.
SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT id::text FROM google_invitation_ids WHERE label = 'existing-member'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
SELECT is((public.accept_invitation_atomic('29100000-0000-0000-0000-000000000007')->>'success')::boolean, false, 'pending invitation does not replace an existing membership');
RESET ROLE;
SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE organization_id = (SELECT id FROM google_invitation_ids WHERE label = 'organization') AND user_id = (SELECT id FROM google_invitation_ids WHERE label = 'existing-member')), 1, 'existing membership is not duplicated');
SELECT is((SELECT role FROM public.organization_members WHERE user_id = (SELECT id FROM google_invitation_ids WHERE label = 'existing-member')), 'admin', 'existing membership role is preserved');

-- Invalid invitation states and tokens remain rejected.
SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT id::text FROM google_invitation_ids WHERE label = 'expired'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
SELECT is((public.accept_invitation_atomic('29100000-0000-0000-0000-000000000008')->>'success')::boolean, false, 'expired invitation is rejected');
RESET ROLE;

SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT id::text FROM google_invitation_ids WHERE label = 'revoked'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
SELECT is((public.accept_invitation_atomic('29100000-0000-0000-0000-000000000009')->>'success')::boolean, false, 'revoked or declined invitation is rejected');
SELECT is((public.accept_invitation_atomic('29999999-0000-0000-0000-000000000099')->>'success')::boolean, false, 'invalid invitation token is rejected');
RESET ROLE;

-- Password-based invitation acceptance uses the same verified-email RPC.
SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT id::text FROM google_invitation_ids WHERE label = 'password-user'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
SELECT is((public.accept_invitation_atomic('29100000-0000-0000-0000-000000000010')->>'success')::boolean, true, 'verified password user can still accept an invitation');
RESET ROLE;
SELECT is((SELECT role FROM public.organization_members WHERE user_id = (SELECT id FROM google_invitation_ids WHERE label = 'password-user')), 'member', 'password invitation preserves its MEMBER role');

-- Authentication without an invitation is not organization authorization.
SELECT is((SELECT count(*)::integer FROM public.profiles WHERE id = (SELECT id FROM google_invitation_ids WHERE label = 'unknown-google')), 1, 'unknown Google user receives a profile');
SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE user_id = (SELECT id FROM google_invitation_ids WHERE label = 'unknown-google')), 0, 'unknown Google user receives no organization role');
SELECT is((SELECT count(*)::integer FROM public.personal_organizations WHERE user_id = (SELECT id FROM google_invitation_ids WHERE label = 'unknown-google')), 0, 'unknown Google user receives no personal organization');

-- Expanding accepted roles must not expand ordinary organization-admin powers.
SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT id::text FROM google_invitation_ids WHERE label = 'inviter'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
SELECT throws_like(
  $$ SELECT public.create_invitation_atomic('29000000-0000-0000-0000-000000000001', 'forbidden-owner@checkpoint-b2.test', 'owner', NULL, '29000000-0000-0000-0000-000000000002') $$,
  '%PERMISSION_DENIED: This invitation role requires a trusted service%',
  'ordinary organization owner cannot create an OWNER invitation'
);
SELECT throws_like(
  $$ SELECT public.create_invitation_atomic('29000000-0000-0000-0000-000000000001', 'spoofed@checkpoint-b2.test', 'member', NULL, '29000000-0000-0000-0000-000000000004') $$,
  '%Invitation creator must match the authenticated user%',
  'authenticated caller cannot spoof invitation creator identity'
);
RESET ROLE;

SELECT set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
SET LOCAL ROLE service_role;
SELECT lives_ok(
  $$ SELECT public.create_invitation_atomic('29000000-0000-0000-0000-000000000001', 'future-owner@checkpoint-b2.test', 'owner', NULL, '29000000-0000-0000-0000-000000000002') $$,
  'trusted service role can create a future platform-managed OWNER invitation through the hardened RPC'
);
RESET ROLE;

SELECT is((SELECT role FROM public.organization_invitations WHERE email = 'future-owner@checkpoint-b2.test'), 'owner', 'trusted RPC preserves future OWNER invitation role exactly');

SELECT is((SELECT count(*)::integer FROM public.organizations WHERE id = (SELECT id FROM google_invitation_ids WHERE label = 'organization')), 1, 'invitation claims create no duplicate organization');

SELECT * FROM finish();
ROLLBACK;
