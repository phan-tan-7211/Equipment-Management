-- Checkpoint D: narrow Platform Administration read contracts.
BEGIN;
SELECT plan(15);

INSERT INTO auth.users (id,instance_id,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data,is_super_admin,role,aud,confirmation_token,recovery_token,email_change_token_new,email_change) VALUES
('34000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','platform@checkpoint-d.test','',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}',false,'authenticated','authenticated','','','',''),
('34000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','normal@checkpoint-d.test','',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}',false,'authenticated','authenticated','','','',''),
('34000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','owner@checkpoint-d.test','',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}',false,'authenticated','authenticated','','','',''),
('34000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','admin@checkpoint-d.test','',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}',false,'authenticated','authenticated','','','',''),
('34000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','revoked@checkpoint-d.test','',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}',false,'authenticated','authenticated','','','','');
INSERT INTO public.organizations(id,name,member_count) VALUES('34000000-0000-0000-0000-000000000010','Checkpoint D Organization',2);
INSERT INTO public.organization_members(organization_id,user_id,role,status,access_source) VALUES
('34000000-0000-0000-0000-000000000010','34000000-0000-0000-0000-000000000003','owner','active','owner'),
('34000000-0000-0000-0000-000000000010','34000000-0000-0000-0000-000000000004','admin','active','invitation');
INSERT INTO private.platform_admins(user_id) VALUES('34000000-0000-0000-0000-000000000001');
INSERT INTO private.platform_admins(user_id,revoked_at,revoked_by) VALUES('34000000-0000-0000-0000-000000000005',now(),'34000000-0000-0000-0000-000000000001');

SELECT set_config('request.jwt.claims','{"sub":"34000000-0000-0000-0000-000000000002","role":"authenticated"}',true); SET LOCAL ROLE authenticated;
SELECT throws_ok($$SELECT public.platform_list_organizations()$$,'42501','Platform Admin authority required','normal user cannot list platform organizations');
SELECT is(public.current_user_is_platform_admin(),false,'normal user is not reported as Platform Admin');
RESET ROLE; SELECT set_config('request.jwt.claims','{"sub":"34000000-0000-0000-0000-000000000003","role":"authenticated"}',true); SET LOCAL ROLE authenticated;
SELECT throws_ok($$SELECT public.platform_list_organizations()$$,'42501','Platform Admin authority required','Org OWNER alone cannot list platform organizations');
RESET ROLE; SELECT set_config('request.jwt.claims','{"sub":"34000000-0000-0000-0000-000000000004","role":"authenticated"}',true); SET LOCAL ROLE authenticated;
SELECT throws_ok($$SELECT public.platform_get_organization('34000000-0000-0000-0000-000000000010')$$,'42501','Platform Admin authority required','Org ADMIN alone cannot read platform detail');
RESET ROLE; SELECT set_config('request.jwt.claims','{"sub":"34000000-0000-0000-0000-000000000005","role":"authenticated"}',true); SET LOCAL ROLE authenticated;
SELECT throws_ok($$SELECT public.platform_list_organizations()$$,'42501','Platform Admin authority required','revoked Platform Admin cannot list organizations');
SELECT is(public.current_user_is_platform_admin(),false,'revoked Platform Admin is not reported as active');

RESET ROLE; SELECT set_config('request.jwt.claims','{"sub":"34000000-0000-0000-0000-000000000001","role":"authenticated"}',true); SET LOCAL ROLE authenticated;
SELECT is(public.current_user_is_platform_admin(),true,'active Platform Admin is reported from auth.uid');
SELECT is((SELECT organization_name FROM public.platform_list_organizations()),'Checkpoint D Organization','active Platform Admin receives organization summary');
SELECT is((SELECT lifecycle_status FROM public.platform_list_organizations()),'active','summary exposes ACTIVE lifecycle');
SELECT is((SELECT owner_email FROM public.platform_list_organizations()),'owner@checkpoint-d.test','summary exposes current OWNER email');
SELECT is((SELECT organization_name FROM public.platform_get_organization('34000000-0000-0000-0000-000000000010')),'Checkpoint D Organization','Platform Admin receives narrow organization detail');
SELECT lives_ok($$SELECT public.platform_suspend_organization('34000000-0000-0000-0000-000000000010','D test')$$,'Platform Admin can suspend from UI contract');
SELECT is((SELECT lifecycle_status FROM public.platform_list_organizations(NULL,'suspended')),'suspended','summary reflects SUSPENDED lifecycle');
RESET ROLE;
SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE user_id='34000000-0000-0000-0000-000000000001'),0,'Platform Admin read authority creates no membership');
SELECT is(has_function_privilege('anon','public.platform_list_organizations(text,text)','EXECUTE'),false,'anon cannot execute platform summary RPC');

SELECT * FROM finish();
ROLLBACK;
