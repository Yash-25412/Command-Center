-- Demo data. Run this after schema.sql, in the same SQL Editor.
-- Safe to re-run: it clears these tables first.

truncate capture, entry, link, milestone, task, routine, project, category, person restart identity cascade;

insert into capture (text) values
  ('Ask Finance for the Q2 accrual breakdown'),
  ('Neha: check for duplicates in the events table after the schema change #product'),
  ('Look at Amit''s retention chart before Monday');

insert into person (name, is_me, role, hue) values
  ('Me', true, 'Manager', 275),
  ('Rahul', false, 'Analyst', 25),
  ('Ankit', false, 'Analyst', 150),
  ('Priya', false, 'Analyst', 335),
  ('Neha', false, 'Product Analyst', 215),
  ('Amit', false, 'Analyst', 85);

insert into category (name, color) values
  ('Revenue', '#4b4fb5'),
  ('Automation', '#1d6d84'),
  ('Analytics', '#4b4fb5'),
  ('Product', '#8f5f0a'),
  ('Reporting', '#6b675e'),
  ('Strategic', '#4b4fb5'),
  ('Team Management', '#8f5f0a'),
  ('Operations', '#6b675e'),
  ('Ad-hoc', '#6b675e');

insert into project (name, objective, status, priority, owner_id, start_date, target_date, pinned)
select 'Revenue Assurance',
  'Make month-end revenue tie out across source systems, the reporting layer and Finance, automatically.',
  'active', 'high', id, current_date - 40, current_date + 36, true
from person where name = 'Me';

insert into project (name, objective, status, priority, owner_id, start_date, target_date, pinned)
select 'Analytics Automation',
  'Replace manual weekly and monthly reporting with scheduled pipelines the team can trust.',
  'active', 'med', id, current_date - 30, current_date + 45, false
from person where name = 'Me';

insert into project (name, objective, status, priority, owner_id, start_date, target_date, pinned)
select 'Product Analytics',
  'A clean event pipeline plus self-serve funnel and retention views for the Product team.',
  'active', 'med', id, current_date - 25, current_date + 30, false
from person where name = 'Me';

insert into project (name, objective, status, priority, owner_id, start_date, target_date, pinned)
select 'Team Operations',
  'Keep the team rhythm, quarterly plans and onboarding in good shape.',
  'active', 'med', id, current_date - 20, current_date + 14, false
from person where name = 'Me';

-- Milestones
insert into milestone (project_id, name, date, done_at, sort_order)
select id, 'August data validated', current_date - 5, now() - interval '5 days', 1 from project where name = 'Revenue Assurance';
insert into milestone (project_id, name, date, sort_order)
select id, 'Finance sign-off on the logic', current_date + 6, 2 from project where name = 'Revenue Assurance';
insert into milestone (project_id, name, date, sort_order)
select id, 'Automation live in production', current_date + 22, 3 from project where name = 'Revenue Assurance';
insert into milestone (project_id, name, date, sort_order)
select id, 'September close runs unattended', current_date + 36, 4 from project where name = 'Revenue Assurance';

insert into milestone (project_id, name, date, sort_order)
select id, 'Weekly KPI pack automated', current_date + 10, 1 from project where name = 'Analytics Automation';
insert into milestone (project_id, name, date, sort_order)
select id, 'Data quality alerts live', current_date + 14, 2 from project where name = 'Analytics Automation';
insert into milestone (project_id, name, date, sort_order)
select id, 'Legacy Excel reports retired', current_date + 40, 3 from project where name = 'Analytics Automation';

insert into milestone (project_id, name, date, sort_order)
select id, 'Event schema signed off', current_date + 1, 1 from project where name = 'Product Analytics';
insert into milestone (project_id, name, date, sort_order)
select id, 'Funnel analysis shared', current_date + 5, 2 from project where name = 'Product Analytics';
insert into milestone (project_id, name, date, sort_order)
select id, 'Retention model v1', current_date + 14, 3 from project where name = 'Product Analytics';

insert into milestone (project_id, name, date, sort_order)
select id, 'Q4 OKRs final', current_date + 9, 1 from project where name = 'Team Operations';
insert into milestone (project_id, name, date, sort_order)
select id, 'Hiring plan approved', current_date + 12, 2 from project where name = 'Team Operations';

-- Tasks. One block per task: insert, then its entries and links keyed off the new id.
do $$
declare
  t_id uuid;
  p_ra uuid; p_aa uuid; p_pa uuid; p_to uuid;
  me uuid; rahul uuid; ankit uuid; priya uuid; neha uuid; amit uuid;
  c_auto uuid; c_rev uuid; c_ana uuid; c_prod uuid; c_rep uuid; c_strat uuid; c_team uuid; c_ops uuid; c_adhoc uuid;
begin
  select id into p_ra from project where name = 'Revenue Assurance';
  select id into p_aa from project where name = 'Analytics Automation';
  select id into p_pa from project where name = 'Product Analytics';
  select id into p_to from project where name = 'Team Operations';
  select id into me from person where name = 'Me';
  select id into rahul from person where name = 'Rahul';
  select id into ankit from person where name = 'Ankit';
  select id into priya from person where name = 'Priya';
  select id into neha from person where name = 'Neha';
  select id into amit from person where name = 'Amit';
  select id into c_auto from category where name = 'Automation';
  select id into c_rev from category where name = 'Revenue';
  select id into c_ana from category where name = 'Analytics';
  select id into c_prod from category where name = 'Product';
  select id into c_rep from category where name = 'Reporting';
  select id into c_strat from category where name = 'Strategic';
  select id into c_team from category where name = 'Team Management';
  select id into c_ops from category where name = 'Operations';
  select id into c_adhoc from category where name = 'Ad-hoc';

  -- 1: Revenue reconciliation automation
  insert into task (title, description, project_id, doer_id, category_id, status, priority, due_date, next_action, waiting_on, waiting_since, expected_by, follow_up_on, last_activity_at, created_at)
  values ('Revenue reconciliation automation',
    'Revenue in the reporting layer does not match source A at month end. The goal is an automated reconciliation that runs after every close and flags breaks before Finance finds them. Expected output: a scheduled job, an exceptions sheet, and a one-page method note that Finance signs off.',
    p_ra, rahul, c_auto, 'waiting', 'high', current_date + 6, 'Validate March revenue numbers with Finance', 'Finance team', current_date - 3, current_date + 2, current_date + 1, now() - interval '1 day', now() - interval '12 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values
    (t_id, 'update', 'Initial problem identified: revenue mismatch between source A and the reporting layer.', now() - interval '12 days'),
    (t_id, 'meeting', 'Discussed with the finance team. They see the gap mostly in late-month registrations.', now() - interval '10 days'),
    (t_id, 'update', 'Identified the attribution logic issue: refunds are netted against the wrong period.', now() - interval '8 days'),
    (t_id, 'update', 'Updated transformation logic (Rahul) and re-ran against July.', now() - interval '6 days'),
    (t_id, 'update', 'Validation completed for August data. Variance down to 0.02%.', now() - interval '5 days'),
    (t_id, 'update', 'Pending final finance confirmation.', now() - interval '3 days'),
    (t_id, 'status', '', now() - interval '3 days'),
    (t_id, 'update', 'Finance asked for March as the control month. Rahul is preparing it.', now() - interval '1 day');
  update entry set status_from = 'Active', status_to = 'Waiting' where task_id = t_id and kind = 'status';
  insert into link (task_id, url, title, type) values
    (t_id, 'https://docs.google.com/example', 'Reconciliation logic', 'Google Doc'),
    (t_id, 'https://sheets.google.com/example', 'Aug exceptions sheet', 'Google Sheet'),
    (t_id, 'https://example.atlassian.net/browse/RECON-482', 'RECON-482', 'Jira');

  -- 2: Attribution logic fix
  insert into task (title, description, project_id, doer_id, category_id, status, priority, due_date, next_action, last_activity_at, created_at)
  values ('Attribution logic fix', 'Renewal orders are tagged to the original booking month, which pushes revenue into the wrong period. Fix the mapping table and prove it on August.',
    p_ra, rahul, c_rev, 'active', 'high', current_date - 2, 'Re-run August with the corrected mapping', now() - interval '2 days', now() - interval '9 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values
    (t_id, 'update', 'Found the mapping error: renewals tagged to the original booking month.', now() - interval '9 days'),
    (t_id, 'update', 'Patch drafted. Needs a re-run before we trust it.', now() - interval '4 days'),
    (t_id, 'update', 'Mapping table updated. Re-run scheduled for tonight.', now() - interval '2 days');

  -- 3: Prepare CFO revenue analysis
  insert into task (title, description, project_id, doer_id, category_id, status, priority, due_date, next_action, promised_to, focus_on, last_activity_at, created_at)
  values ('Prepare CFO revenue analysis', 'Board pre-read: revenue by segment, variance against plan, and what the reconciliation work changes. One page of commentary, three charts.',
    p_ra, me, c_rep, 'active', 'high', current_date, 'Pull Aug numbers from the finance sheet', 'the CFO', current_date, now() - interval '2 days', now() - interval '6 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values
    (t_id, 'update', 'CFO asked for a segment view instead of a single total.', now() - interval '6 days'),
    (t_id, 'update', 'Outline agreed: three charts and one page of commentary.', now() - interval '2 days');
  insert into link (task_id, url, title, type) values
    (t_id, 'https://sheets.google.com/example2', 'Finance master sheet', 'Google Sheet'),
    (t_id, 'https://docs.google.com/example2', 'Draft commentary', 'Google Doc');

  -- 4: Registration-level reconciliation
  insert into task (title, description, project_id, doer_id, category_id, status, priority, due_date, next_action, last_activity_at, created_at)
  values ('Registration-level reconciliation for new business', 'Extend the reconciliation to the new-business line using registrations as the unit of record.',
    p_ra, ankit, c_rev, 'review', 'med', current_date + 3, 'Read Ankit''s method note and reply', now() - interval '1 day', now() - interval '8 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values
    (t_id, 'update', 'Started with the June cohort as a test.', now() - interval '8 days');
  insert into entry (task_id, kind, body, reason, occurred_at) values
    (t_id, 'decision', 'Use registration-level reconciliation for the new-business line.',
     'Order-level data lags by up to five days. Registrations are the record Finance closes on, so breaks show up earlier.', now() - interval '4 days');
  insert into entry (task_id, kind, body, occurred_at) values
    (t_id, 'update', 'Method note ready for review.', now() - interval '1 day'),
    (t_id, 'status', '', now() - interval '1 day');
  update entry set status_from = 'Active', status_to = 'Review' where task_id = t_id and kind = 'status';
  insert into link (task_id, url, title, type) values (t_id, 'https://docs.google.com/example3', 'Method note', 'Google Doc');

  -- 5: September revenue report
  insert into task (title, description, project_id, doer_id, category_id, status, priority, due_date, last_activity_at, created_at)
  values ('September revenue report', 'Monthly recurring report.', p_ra, me, c_rep, 'planned', 'med', current_date + 8, now() - interval '20 days', now() - interval '20 days');

  -- 20: Review Rahul's reconciliation logic
  insert into task (title, description, project_id, doer_id, category_id, status, priority, due_date, next_action, focus_on, last_activity_at, created_at)
  values ('Review Rahul''s reconciliation logic', 'Rahul shared the updated transformation. Check the refund netting and the period boundaries before Finance sees it.',
    p_ra, me, c_team, 'review', 'high', current_date, 'Read the transformation diff and leave comments', current_date, now() - interval '1 day', now() - interval '1 day')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values (t_id, 'update', 'Rahul shared the updated transformation for review.', now() - interval '1 day');
  insert into link (task_id, url, title, type) values (t_id, 'https://github.com/example/pull/1', 'Transformation diff', 'Pull request');

  -- 21: August close validation (done)
  insert into task (title, description, project_id, doer_id, category_id, status, priority, completed_at, last_activity_at, created_at)
  values ('August close validation', 'Validate August close numbers against the source system.', p_ra, rahul, c_rev, 'done', 'med', now() - interval '1 day', now() - interval '1 day', now() - interval '14 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values (t_id, 'update', 'Validation completed for August data.', now() - interval '5 days'),
    (t_id, 'status', '', now() - interval '1 day');
  update entry set status_from = 'Review', status_to = 'Done' where task_id = t_id and kind = 'status';

  -- 6: Automate weekly KPI pack
  insert into task (title, description, project_id, doer_id, category_id, status, priority, due_date, next_action, last_activity_at, created_at)
  values ('Automate weekly KPI pack', 'Replace the manual Monday KPI deck with a scheduled export that lands in the team channel.',
    p_aa, priya, c_auto, 'active', 'med', current_date + 10, 'Schedule the job for Monday 7am', now() - interval '2 days', now() - interval '15 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values
    (t_id, 'update', 'Queries frozen and layout approved.', now() - interval '7 days'),
    (t_id, 'update', 'Chart export working. Scheduling is next.', now() - interval '2 days');
  insert into link (task_id, url, title, type) values (t_id, 'https://notion.so/example', 'KPI queries', 'Notion');

  -- 7: Revenue dashboard
  insert into task (title, description, project_id, doer_id, category_id, status, priority, due_date, last_activity_at, created_at)
  values ('Revenue dashboard', 'Self-serve revenue dashboard for leadership, fed by the reconciled tables.', p_aa, priya, c_ana, 'active', 'med', current_date + 7, now() - interval '4 days', now() - interval '11 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values (t_id, 'update', 'First version is with the team for feedback. Nothing back yet.', now() - interval '4 days');
  insert into link (task_id, url, title, type) values (t_id, 'https://example.com/dashboard', 'Dashboard draft', 'Dashboard');

  -- 8: Data quality alerts (blocked)
  insert into task (title, description, project_id, doer_id, category_id, status, priority, due_date, next_action, waiting_on, last_activity_at, created_at)
  values ('Data quality alerts', 'Alert on null spikes, late loads and row-count drops across six core tables.',
    p_aa, amit, c_auto, 'blocked', 'high', current_date + 2, 'Escalate the access ticket to the IT lead', 'Warehouse write access, IT ticket IT-2210', now() - interval '2 days', now() - interval '13 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values
    (t_id, 'update', 'Alert rules written for six core tables.', now() - interval '6 days'),
    (t_id, 'update', 'Cannot deploy: warehouse write access has not been granted.', now() - interval '2 days'),
    (t_id, 'status', '', now() - interval '2 days');
  update entry set status_from = 'Active', status_to = 'Blocked' where task_id = t_id and kind = 'status';
  insert into link (task_id, url, title, type) values
    (t_id, 'https://example.atlassian.net/browse/IT-2210', 'IT-2210', 'Jira'),
    (t_id, 'https://docs.google.com/example4', 'Alert rules', 'Google Doc');

  -- 9: Retire legacy Excel reports
  insert into task (title, description, project_id, doer_id, category_id, status, priority, due_date, last_activity_at, created_at)
  values ('Retire legacy Excel reports', 'Eleven recurring Excel reports still run by hand. Retire each one once its replacement is live.',
    p_aa, ankit, c_rep, 'planned', 'low', current_date + 25, now() - interval '14 days', now() - interval '14 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values (t_id, 'update', 'Inventory of 11 reports listed.', now() - interval '14 days');

  -- 10: Product events pipeline (blocked)
  insert into task (title, description, project_id, doer_id, category_id, status, priority, due_date, next_action, waiting_on, focus_on, last_activity_at, created_at)
  values ('Product events pipeline', 'Stream checkout and onboarding events into the warehouse with a stable schema Product can query.',
    p_pa, neha, c_prod, 'blocked', 'high', current_date + 1, 'Get schema sign-off from the Product lead', 'Decision on the event schema from Product', current_date, now() - interval '1 day', now() - interval '16 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values
    (t_id, 'update', 'Draft event schema shared with Product.', now() - interval '9 days'),
    (t_id, 'meeting', 'Sync with Product: two naming conflicts on the checkout events.', now() - interval '5 days'),
    (t_id, 'update', 'Neha is holding the build until the schema is signed off.', now() - interval '1 day'),
    (t_id, 'status', '', now() - interval '1 day');
  update entry set status_from = 'Active', status_to = 'Blocked' where task_id = t_id and kind = 'status';
  insert into link (task_id, url, title, type) values (t_id, 'https://docs.google.com/example5', 'Draft event schema', 'Google Doc');

  -- 11: Funnel drop-off analysis
  insert into task (title, description, project_id, doer_id, category_id, status, priority, due_date, next_action, last_activity_at, created_at)
  values ('Funnel drop-off analysis', 'Where do new users fall out between sign-up and first purchase, and does it differ by channel?',
    p_pa, neha, c_ana, 'active', 'med', current_date - 1, 'Split by acquisition channel', now() - interval '3 days', now() - interval '10 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values (t_id, 'update', 'Overall funnel is done. The channel split is what remains.', now() - interval '3 days');
  insert into link (task_id, url, title, type) values (t_id, 'https://example.com/notebook', 'Funnel notebook', 'Notebook');

  -- 12: Retention cohort model
  insert into task (title, description, project_id, doer_id, category_id, status, priority, due_date, next_action, last_activity_at, created_at)
  values ('Retention cohort model', 'Weekly retention curves by signup cohort, ready for Product to self-serve.',
    p_pa, amit, c_ana, 'active', 'med', current_date + 12, 'Choose the cohort definition', now() - interval '9 days', now() - interval '18 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values (t_id, 'update', 'Two candidate cohort definitions compared. No decision yet.', now() - interval '9 days');

  -- 13: Feature adoption tracker
  insert into task (title, description, project_id, doer_id, category_id, status, priority, due_date, last_activity_at, created_at)
  values ('Feature adoption tracker', 'Track adoption of the last four launches. Starts after the funnel work.',
    p_pa, priya, c_prod, 'planned', 'low', current_date + 20, now() - interval '10 days', now() - interval '10 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values (t_id, 'update', 'Scoped with Product. Starts after the funnel work.', now() - interval '10 days');

  -- 14: Product metrics glossary (done)
  insert into task (title, description, project_id, doer_id, category_id, status, priority, completed_at, last_activity_at, created_at)
  values ('Product metrics glossary', 'One page defining every metric Product and Finance quote.', p_pa, ankit, c_prod, 'done', 'low', now() - interval '3 days', now() - interval '3 days', now() - interval '20 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values
    (t_id, 'update', 'Glossary published and linked from the dashboard.', now() - interval '3 days'),
    (t_id, 'status', '', now() - interval '3 days');
  update entry set status_from = 'Review', status_to = 'Done' where task_id = t_id and kind = 'status';

  -- 15: Team OKR draft
  insert into task (title, description, project_id, doer_id, category_id, status, priority, due_date, next_action, last_activity_at, created_at)
  values ('Team OKR draft', 'Q4 objectives for the analytics team, trimmed to three.', p_to, me, c_strat, 'active', 'med', current_date + 5, 'Draft three objectives and share with the leads', now() - interval '5 days', now() - interval '5 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values (t_id, 'update', 'Started from last quarter. Needs trimming to three objectives.', now() - interval '5 days');
  insert into link (task_id, url, title, type) values (t_id, 'https://docs.google.com/example6', 'Last quarter OKRs', 'Google Doc');

  -- 16: Quarterly hiring plan (waiting)
  insert into task (title, description, project_id, doer_id, category_id, status, priority, due_date, next_action, waiting_on, waiting_since, expected_by, follow_up_on, last_activity_at, created_at)
  values ('Quarterly hiring plan', 'Headcount ask for next quarter with the justification for each role.',
    p_to, me, c_team, 'waiting', 'med', current_date + 9, 'Review headcount numbers when HR replies', 'HR', current_date - 4, current_date + 4, current_date + 2, now() - interval '4 days', now() - interval '6 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values
    (t_id, 'update', 'Sent the headcount ask to HR.', now() - interval '4 days'),
    (t_id, 'status', '', now() - interval '4 days');
  update entry set status_from = 'Active', status_to = 'Waiting' where task_id = t_id and kind = 'status';

  -- 18: Analyst onboarding doc
  insert into task (title, description, project_id, doer_id, category_id, status, priority, due_date, next_action, last_activity_at, created_at)
  values ('Analyst onboarding doc', 'First-week guide for new analysts: access, tools, standards.', p_to, amit, c_team, 'review', 'low', current_date + 4, 'Review and approve', now() - interval '3 days', now() - interval '12 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values (t_id, 'update', 'Draft ready for review.', now() - interval '3 days');
  insert into link (task_id, url, title, type) values (t_id, 'https://notion.so/example2', 'Onboarding draft', 'Notion');

  -- 19: 1:1 notes, Q3 wrap-up
  insert into task (title, description, project_id, doer_id, category_id, status, priority, due_date, last_activity_at, created_at)
  values ('1:1 notes, Q3 wrap-up', 'Collect wins and feedback for each person ahead of the Q3 wrap-up conversations.', p_to, me, c_team, 'planned', 'low', current_date + 14, now() - interval '2 days', now() - interval '2 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values (t_id, 'update', 'Will gather wins and feedback per person before the wrap-ups.', now() - interval '2 days');

  -- 24: Data access policy (waiting)
  insert into task (title, description, project_id, doer_id, category_id, status, priority, due_date, next_action, waiting_on, waiting_since, expected_by, follow_up_on, last_activity_at, created_at)
  values ('Data access policy for analysts', 'Agree who can query which tables, and how access is requested and reviewed.',
    p_to, me, c_ops, 'waiting', 'med', current_date + 6, 'Ask Security whether the draft passed review', 'Security team', current_date - 6, current_date + 1, current_date, now() - interval '6 days', now() - interval '8 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values
    (t_id, 'update', 'Draft policy sent to Security for review.', now() - interval '6 days'),
    (t_id, 'status', '', now() - interval '6 days');
  update entry set status_from = 'Active', status_to = 'Waiting' where task_id = t_id and kind = 'status';

  -- 22: Vendor invoice audit (done)
  insert into task (title, description, project_id, doer_id, category_id, status, priority, completed_at, last_activity_at, created_at)
  values ('Vendor invoice audit', 'Audit last quarter vendor invoices against contracts.', p_to, ankit, c_ops, 'done', 'med', now() - interval '4 days', now() - interval '4 days', now() - interval '18 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values (t_id, 'update', 'Audit finished. Two overcharges raised with vendors.', now() - interval '4 days');

  -- 23: SQL style guide (done)
  insert into task (title, description, project_id, doer_id, category_id, status, priority, completed_at, last_activity_at, created_at)
  values ('SQL style guide', 'Shared conventions for naming, formatting and review.', p_to, neha, c_ops, 'done', 'low', now() - interval '6 days', now() - interval '6 days', now() - interval '22 days')
  returning id into t_id;
  insert into entry (task_id, kind, body, occurred_at) values (t_id, 'update', 'Style guide published to the team wiki.', now() - interval '6 days');

end $$;
