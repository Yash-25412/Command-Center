-- Clears all demo tasks, projects, journal entries, links, milestones and
-- inbox captures. Leaves your people and categories in place so Quick add
-- keeps working right away. Safe to run any time you want a clean slate.

truncate capture, entry, link, milestone, task, routine, project restart identity cascade;
