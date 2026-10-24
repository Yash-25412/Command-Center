-- Adds a general-purpose "needs follow-up / needs update" flag to tasks,
-- independent of status. Works on any open task, not just ones in the
-- Waiting status.

alter table task add column if not exists flag_type text;
alter table task add column if not exists flag_date date;
alter table task add column if not exists flag_note text;

-- Keep flag_type to the two known values (nullable, so "no flag" stays valid).
alter table task drop constraint if exists task_flag_type_check;
alter table task add constraint task_flag_type_check
  check (flag_type is null or flag_type in ('follow_up', 'update'));
