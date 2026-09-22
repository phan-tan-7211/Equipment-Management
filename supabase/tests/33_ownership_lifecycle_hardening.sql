-- Checkpoint C3: ownership and organization lifecycle security hardening.
BEGIN;
SELECT plan(37);

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change) VALUES
('33000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','platform@checkpoint-c3.test','',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}',false,'authenticated','authenticated','','','',''),
('33000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','revoked-platform@checkpoint-c3.test','',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}',false,'authenticated','authenticated','','','',''),
('33000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','owner@checkpoint-c3.test','',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}',false,'authenticated','authenticated','','','',''),
('33000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','admin@checkpoint-c3.test','',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}',false,'authenticated','authenticated','','','',''),
('33000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','member@checkpoint-c3.test','',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}',false,'authenticated','authenticated','','','',''),
('33000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000','other-admin@checkpoint-c3.test','',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}',false,'authenticated','authenticated','','','',''),
('33000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000000','invitee@checkpoint-c3.test','',now(),now(),now(),'{"provider":"google","providers":["google"]}','{}',false,'authenticated','authenticated','','','','');

INSERT INTO public.organizations (id,name,member_count) VALUES
('33000000-0000-0000-0000-000000000010','C3 Primary Organization',3),
('33000000-0000-0000-0000-000000000011','C3 Other Organization',2),
('33000000-0000-0000-0000-000000000012','C3 Delete Organization',1);
INSERT INTO public.organization_members (organization_id,user_id,role,status,access_source) VALUES
('33000000-0000-0000-0000-000000000010','33000000-0000-0000-0000-000000000003','owner','active','owner'),
('33000000-0000-0000-0000-000000000010','33000000-0000-0000-0000-000000000004','admin','active','invitation'),
('33000000-0000-0000-0000-000000000010','33000000-0000-0000-0000-000000000005','member','active','invitation'),
('33000000-0000-0000-0000-000000000011','33000000-0000-0000-0000-000000000006','owner','active','owner'),
('33000000-0000-0000-0000-000000000011','33000000-0000-0000-0000-000000000004','admin','active','invitation'),
('33000000-0000-0000-0000-000000000012','33000000-0000-0000-0000-000000000003','owner','active','owner');
INSERT INTO private.platform_admins(user_id) VALUES('33000000-0000-0000-0000-000000000001');
INSERT INTO private.platform_admins(user_id,revoked_at,revoked_by) VALUES('33000000-0000-0000-0000-000000000002',now(),'33000000-0000-0000-0000-000000000001');

SELECT is((SELECT lifecycle_status FROM public.organizations WHERE id='33000000-0000-0000-0000-000000000010'),'active','existing organization defaults ACTIVE');
SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE organization_id='33000000-0000-0000-0000-000000000010' AND role='owner' AND status='active'),1,'established organization starts with one active OWNER');

SELECT set_config('request.jwt.claims','{"sub":"33000000-0000-0000-0000-000000000004","role":"authenticated"}',true); SET LOCAL ROLE authenticated;
SELECT throws_ok($$UPDATE public.organization_members SET role='owner' WHERE organization_id='33000000-0000-0000-0000-000000000010' AND user_id='33000000-0000-0000-0000-000000000004'$$,'42501',NULL,'Org Admin cannot promote self to OWNER');
SELECT throws_ok($$UPDATE public.organization_members SET role='owner' WHERE organization_id='33000000-0000-0000-0000-000000000010' AND user_id='33000000-0000-0000-0000-000000000005'$$,'42501',NULL,'Org Admin cannot promote another member to OWNER');
SELECT throws_ok($$INSERT INTO public.organization_members(organization_id,user_id,role,status,access_source) VALUES('33000000-0000-0000-0000-000000000010','33000000-0000-0000-0000-000000000007','owner','active','invitation')$$,'42501',NULL,'direct authenticated INSERT with OWNER is denied');

RESET ROLE; SELECT set_config('request.jwt.claims','{"sub":"33000000-0000-0000-0000-000000000003","role":"authenticated"}',true); SET LOCAL ROLE authenticated;
SELECT throws_ok($$UPDATE public.organization_members SET role='owner' WHERE organization_id='33000000-0000-0000-0000-000000000010' AND user_id='33000000-0000-0000-0000-000000000005'$$,'42501',NULL,'Org Owner cannot create a second OWNER');
UPDATE public.organization_members SET status='inactive' WHERE organization_id='33000000-0000-0000-0000-000000000010' AND user_id='33000000-0000-0000-0000-000000000003';
SELECT is((SELECT status FROM public.organization_members WHERE organization_id='33000000-0000-0000-0000-000000000010' AND user_id='33000000-0000-0000-0000-000000000003'),'active','direct UPDATE cannot deactivate active OWNER');
SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE organization_id='33000000-0000-0000-0000-000000000010' AND role='owner' AND status='active'),1,'failed mutations preserve one OWNER');
SELECT is((public.initiate_ownership_transfer('33000000-0000-0000-0000-000000000010','33000000-0000-0000-0000-000000000004')->>'success')::boolean,true,'valid OWNER initiates transfer');

RESET ROLE; CREATE TEMP TABLE c3_transfer AS SELECT id FROM public.ownership_transfer_requests WHERE organization_id='33000000-0000-0000-0000-000000000010' AND status='pending'; GRANT SELECT ON c3_transfer TO authenticated;
SELECT set_config('request.jwt.claims','{"sub":"33000000-0000-0000-0000-000000000005","role":"authenticated"}',true); SET LOCAL ROLE authenticated;
SELECT is((public.respond_to_ownership_transfer((SELECT id FROM c3_transfer),true)->>'success')::boolean,false,'unauthorized non-target cannot accept transfer');
RESET ROLE; SELECT set_config('request.jwt.claims','{"sub":"33000000-0000-0000-0000-000000000004","role":"authenticated"}',true); SET LOCAL ROLE authenticated;
SELECT is((public.respond_to_ownership_transfer((SELECT id FROM c3_transfer),true)->>'success')::boolean,true,'target ADMIN accepts valid transfer');
RESET ROLE;
SELECT is((SELECT role FROM public.organization_members WHERE organization_id='33000000-0000-0000-0000-000000000010' AND user_id='33000000-0000-0000-0000-000000000003'),'admin','old OWNER becomes ADMIN');
SELECT is((SELECT role FROM public.organization_members WHERE organization_id='33000000-0000-0000-0000-000000000010' AND user_id='33000000-0000-0000-0000-000000000004'),'owner','target becomes OWNER');
SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE organization_id='33000000-0000-0000-0000-000000000010' AND role='owner' AND status='active'),1,'exactly one OWNER remains');
SELECT is((SELECT count(*)::integer FROM public.organizations WHERE id NOT IN('33000000-0000-0000-0000-000000000010','33000000-0000-0000-0000-000000000011','33000000-0000-0000-0000-000000000012') AND name LIKE '%Organization'),0,'transfer creates no replacement organization');

SELECT set_config('request.jwt.claims','{"sub":"33000000-0000-0000-0000-000000000004","role":"authenticated"}',true); SET LOCAL ROLE authenticated;
SELECT is((public.initiate_ownership_transfer('33000000-0000-0000-0000-000000000010','33000000-0000-0000-0000-000000000006')->>'success')::boolean,false,'cross-org target denied');
SELECT is((public.respond_to_ownership_transfer((SELECT id FROM c3_transfer),true)->>'success')::boolean,false,'repeated response cannot transfer twice');

RESET ROLE; SELECT set_config('request.jwt.claims','{"sub":"33000000-0000-0000-0000-000000000003","role":"authenticated"}',true); SET LOCAL ROLE authenticated;
SELECT is((public.delete_organization('33000000-0000-0000-0000-000000000012','C3 Delete Organization',false)->>'success')::boolean,true,'OWNER deletes eligible organization');
RESET ROLE;
SELECT is((SELECT count(*)::integer FROM public.organizations WHERE id='33000000-0000-0000-0000-000000000012'),0,'organization is deleted');
SELECT is((SELECT count(*)::integer FROM public.personal_organizations WHERE user_id='33000000-0000-0000-0000-000000000003'),0,'deletion creates no personal organization');
SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE user_id='33000000-0000-0000-0000-000000000003' AND role='owner' AND organization_id<>'33000000-0000-0000-0000-000000000010'),0,'deletion grants no surprise OWNER');

SELECT set_config('request.jwt.claims','{"sub":"33000000-0000-0000-0000-000000000003","role":"authenticated"}',true); SET LOCAL ROLE authenticated;
SELECT throws_ok($$SELECT public.platform_suspend_organization('33000000-0000-0000-0000-000000000010')$$,'42501','Platform Admin authority required','Org member cannot suspend');
RESET ROLE; SELECT set_config('request.jwt.claims','{"sub":"33000000-0000-0000-0000-000000000002","role":"authenticated"}',true); SET LOCAL ROLE authenticated;
SELECT throws_ok($$SELECT public.platform_suspend_organization('33000000-0000-0000-0000-000000000010')$$,'42501','Platform Admin authority required','revoked Platform Admin cannot suspend');
RESET ROLE; SELECT set_config('request.jwt.claims','{"sub":"33000000-0000-0000-0000-000000000001","role":"authenticated"}',true); SET LOCAL ROLE authenticated;
SELECT lives_ok($$SELECT public.platform_suspend_organization('33000000-0000-0000-0000-000000000010','C3 test')$$,'Platform Admin suspends organization');
RESET ROLE;
SELECT is((SELECT lifecycle_status FROM public.organizations WHERE id='33000000-0000-0000-0000-000000000010'),'suspended','lifecycle is SUSPENDED');
SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE organization_id='33000000-0000-0000-0000-000000000010'),3,'suspension retains memberships');
SELECT is((SELECT count(*)::integer FROM public.audit_log WHERE organization_id='33000000-0000-0000-0000-000000000010' AND changes->'lifecycle_status'->>'new'='suspended'),1,'suspension is audited');

SELECT set_config('request.jwt.claims','{"sub":"33000000-0000-0000-0000-000000000004","role":"authenticated"}',true); SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE organization_id='33000000-0000-0000-0000-000000000010'),0,'suspended private access is blocked');
SELECT throws_ok($$INSERT INTO public.organization_members(organization_id,user_id,role,status,access_source) VALUES('33000000-0000-0000-0000-000000000010','33000000-0000-0000-0000-000000000007','member','active','invitation')$$,'42501',NULL,'suspended tenant mutation is blocked');
SELECT throws_ok($$SELECT public.create_google_workspace_oauth_session('33000000-0000-0000-0000-000000000010','/dashboard','https://example.test')$$,'42501','Only active organization owners or admins can connect Google Workspace','suspended Workspace connection blocked');

RESET ROLE; SELECT set_config('request.jwt.claims','{"sub":"33000000-0000-0000-0000-000000000001","role":"authenticated"}',true); SET LOCAL ROLE authenticated;
SELECT lives_ok($$SELECT public.platform_reactivate_organization('33000000-0000-0000-0000-000000000010','C3 complete')$$,'Platform Admin reactivates organization');
RESET ROLE;
SELECT is((SELECT lifecycle_status FROM public.organizations WHERE id='33000000-0000-0000-0000-000000000010'),'active','lifecycle returns ACTIVE');
SELECT is((SELECT count(*)::integer FROM public.audit_log WHERE organization_id='33000000-0000-0000-0000-000000000010' AND changes->'lifecycle_status'->>'new'='active'),1,'reactivation is audited');
SELECT set_config('request.jwt.claims','{"sub":"33000000-0000-0000-0000-000000000004","role":"authenticated"}',true); SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE organization_id='33000000-0000-0000-0000-000000000010'),3,'tenant access returns after reactivation');
SELECT is((public.leave_organization_safely('33000000-0000-0000-0000-000000000010')->>'success')::boolean,false,'active OWNER cannot leave');
RESET ROLE;
SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE organization_id='33000000-0000-0000-0000-000000000010' AND role='owner' AND status='active'),1,'final state retains one OWNER');
SELECT is((SELECT count(*)::integer FROM public.organization_members WHERE user_id='33000000-0000-0000-0000-000000000001'),0,'Platform Admin gains no membership');

SELECT * FROM finish();
ROLLBACK;
