-- Checkpoint B1: Google authentication must preserve an existing Supabase
-- user's UUID-backed authorization and must not authorize unknown users.
-- Supabase Auth performs the verified-email identity link; this test models
-- the resulting same-user UUID and verifies the application's DB behavior.

BEGIN;
SELECT plan(14);

CREATE TEMP TABLE google_identity_ids (
  label text PRIMARY KEY,
  id uuid NOT NULL
);

INSERT INTO google_identity_ids (label, id) VALUES
  ('organization', '28000000-0000-0000-0000-000000000001'::uuid),
  ('existing-user', '28000000-0000-0000-0000-000000000002'::uuid),
  ('unknown-user', '28000000-0000-0000-0000-000000000003'::uuid),
  ('email-identity', '28000000-0000-0000-0000-000000000004'::uuid),
  ('google-identity', '28000000-0000-0000-0000-000000000005'::uuid),
  ('unknown-google-identity', '28000000-0000-0000-0000-000000000006'::uuid);

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  (SELECT id FROM google_identity_ids WHERE label = 'existing-user'),
  '00000000-0000-0000-0000-000000000000'::uuid,
  'existing-authorized@checkpoint-b1.test',
  extensions.crypt('password123', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"name": "Existing Authorized User"}'::jsonb,
  false, 'authenticated', 'authenticated', '', '', '', ''
);

INSERT INTO auth.identities (
  id, user_id, provider, provider_id, identity_data, created_at, updated_at
) VALUES (
  (SELECT id FROM google_identity_ids WHERE label = 'email-identity'),
  (SELECT id FROM google_identity_ids WHERE label = 'existing-user'),
  'email',
  (SELECT id::text FROM google_identity_ids WHERE label = 'existing-user'),
  '{"email": "existing-authorized@checkpoint-b1.test", "email_verified": true}'::jsonb,
  now(), now()
);

INSERT INTO public.organizations (id, name, plan, member_count, max_members, features)
VALUES (
  (SELECT id FROM google_identity_ids WHERE label = 'organization'),
  'Checkpoint B1 Organization',
  'free',
  1,
  10,
  ARRAY['Equipment Management']
);

INSERT INTO public.organization_members (
  organization_id, user_id, role, status, access_source
) VALUES (
  (SELECT id FROM google_identity_ids WHERE label = 'organization'),
  (SELECT id FROM google_identity_ids WHERE label = 'existing-user'),
  'admin',
  'active',
  'invitation'
);

-- Model the result of Supabase automatic linking after Google verifies the
-- same email: a second identity points to the existing auth.users UUID.
INSERT INTO auth.identities (
  id, user_id, provider, provider_id, identity_data, created_at, updated_at
) VALUES (
  (SELECT id FROM google_identity_ids WHERE label = 'google-identity'),
  (SELECT id FROM google_identity_ids WHERE label = 'existing-user'),
  'google',
  'google-existing-authorized-b1',
  '{"email": "existing-authorized@checkpoint-b1.test", "email_verified": true}'::jsonb,
  now(), now()
);

UPDATE auth.users
SET raw_app_meta_data = '{"provider": "google", "providers": ["email", "google"]}'::jsonb,
    last_sign_in_at = now(),
    updated_at = now()
WHERE id = (SELECT id FROM google_identity_ids WHERE label = 'existing-user');

SELECT is(
  (SELECT count(*)::integer
   FROM auth.users
   WHERE email = 'existing-authorized@checkpoint-b1.test'),
  1,
  'Google identity linking keeps one Supabase auth user for the verified email'
);

SELECT is(
  (SELECT user_id
   FROM auth.identities
   WHERE provider = 'google'
     AND provider_id = 'google-existing-authorized-b1'),
  (SELECT id FROM google_identity_ids WHERE label = 'existing-user'),
  'Google identity is linked to the existing password user UUID'
);

SELECT is(
  (SELECT count(*)::integer
   FROM auth.identities
   WHERE user_id = (SELECT id FROM google_identity_ids WHERE label = 'existing-user')),
  2,
  'existing user retains email identity and gains one Google identity'
);

SELECT ok(
  (SELECT encrypted_password <> ''
   FROM auth.users
   WHERE id = (SELECT id FROM google_identity_ids WHERE label = 'existing-user')),
  'existing password credential remains available after Google identity linking'
);

SELECT is(
  (SELECT count(*)::integer
   FROM public.profiles
   WHERE id = (SELECT id FROM google_identity_ids WHERE label = 'existing-user')),
  1,
  'existing linked user keeps one profile'
);

SELECT is(
  (SELECT count(*)::integer
   FROM public.organizations
   WHERE id = (SELECT id FROM google_identity_ids WHERE label = 'organization')),
  1,
  'Google identity linking creates no duplicate organization'
);

SELECT is(
  (SELECT count(*)::integer
   FROM public.organization_members
   WHERE user_id = (SELECT id FROM google_identity_ids WHERE label = 'existing-user')
     AND organization_id = (SELECT id FROM google_identity_ids WHERE label = 'organization')),
  1,
  'Google identity linking creates no duplicate membership'
);

SELECT is(
  (SELECT role::text
   FROM public.organization_members
   WHERE user_id = (SELECT id FROM google_identity_ids WHERE label = 'existing-user')
     AND organization_id = (SELECT id FROM google_identity_ids WHERE label = 'organization')),
  'admin',
  'existing organization role is preserved'
);

SELECT is(
  (SELECT count(*)::integer
   FROM public.personal_organizations
   WHERE user_id = (SELECT id FROM google_identity_ids WHERE label = 'existing-user')),
  0,
  'linked existing user receives no personal organization'
);

-- An unknown Google identity is authenticated but remains unauthorized.
CREATE TEMP TABLE organization_count_before_unknown AS
SELECT count(*)::integer AS organization_count
FROM public.organizations;

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  (SELECT id FROM google_identity_ids WHERE label = 'unknown-user'),
  '00000000-0000-0000-0000-000000000000'::uuid,
  'unknown-google@checkpoint-b1.test',
  '',
  now(), now(), now(),
  '{"provider": "google", "providers": ["google"]}'::jsonb,
  '{"name": "Unknown Google User"}'::jsonb,
  false, 'authenticated', 'authenticated', '', '', '', ''
);

INSERT INTO auth.identities (
  id, user_id, provider, provider_id, identity_data, created_at, updated_at
) VALUES (
  (SELECT id FROM google_identity_ids WHERE label = 'unknown-google-identity'),
  (SELECT id FROM google_identity_ids WHERE label = 'unknown-user'),
  'google',
  'google-unknown-b1',
  '{"email": "unknown-google@checkpoint-b1.test", "email_verified": true}'::jsonb,
  now(), now()
);

SELECT is(
  (SELECT count(*)::integer
   FROM public.profiles
   WHERE id = (SELECT id FROM google_identity_ids WHERE label = 'unknown-user')),
  1,
  'unknown Google user receives a profile'
);

SELECT is(
  (SELECT count(*)::integer
   FROM public.organization_members
   WHERE user_id = (SELECT id FROM google_identity_ids WHERE label = 'unknown-user')),
  0,
  'unknown Google user receives no organization role'
);

SELECT is(
  (SELECT count(*)::integer
   FROM public.organization_members
   WHERE user_id = (SELECT id FROM google_identity_ids WHERE label = 'unknown-user')
     AND role = 'owner'),
  0,
  'unknown Google user receives no OWNER membership'
);

SELECT is(
  (SELECT count(*)::integer FROM public.organizations),
  (SELECT organization_count FROM organization_count_before_unknown),
  'unknown Google authentication creates no organization'
);

SELECT is(
  (SELECT count(*)::integer
   FROM public.personal_organizations
   WHERE user_id = (SELECT id FROM google_identity_ids WHERE label = 'unknown-user')),
  0,
  'unknown Google user receives no personal organization'
);

SELECT * FROM finish();
ROLLBACK;
