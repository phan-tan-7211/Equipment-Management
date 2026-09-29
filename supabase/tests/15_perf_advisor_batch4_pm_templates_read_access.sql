BEGIN;
SELECT plan(3);

SELECT is(
  (SELECT count(*)::int FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'pm_checklist_templates'
     AND policyname = 'pm_templates_read_access'),
  0,
  'Redundant pm_templates_read_access policy dropped'
);

SELECT is(
  (SELECT count(*)::int FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'pm_checklist_templates'
     AND policyname = 'pm_checklist_templates_select_consolidated'),
  1,
  'pm_checklist_templates_select_consolidated policy retained'
);

-- pm_templates_admin_manage (FOR ALL) was later split into per-command admin
-- policies by 20260602160603 (batch 5, see test 16); admin writes stay covered.
SELECT is(
  (SELECT count(*)::int FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'pm_checklist_templates'
     AND policyname IN ('pm_checklist_templates_admin_insert',
                        'pm_checklist_templates_admin_update',
                        'pm_checklist_templates_delete_consolidated')),
  3,
  'pm_checklist_templates admin write policies retained'
);

SELECT * FROM finish();
ROLLBACK;
