# Roadmap and history

## History

| Date | What shipped |
|---|---|
| 2026-11 (early) | Stage 1: Supabase persistence, magic-link sign-in, quick add, inbox, work list, task detail with journey. Then: Today, Waiting, Projects, People, Journal, Weekly Review, flags, multi-assignee, board view, Life Mastery (piano, handstand, dragon flag, marathon). |
| 2026-11-15 | Three design directions prototyped; **Runway** chosen. Noir saved as a design system. |
| 2026-11-15 | **Runway redesign** (`e995b46`): new theme, pill nav, Capture ⌘K (task/reminder/inbox), Cockpit runway, dated reminders (`reminder` table), day-cleared streak, Ad Hoc, Dashboard with tabs, redirects from old routes. |
| 2026-11-16 | Life Mastery rebuilt in Runway (`d1d6dca`); practice tools reduced to one per skill. |
| 2026-11-16 | Reminders shown only in the Reminders card (`95e0943`); dark native dropdowns (`466b005`). |
| 2026-11-17 | Repo documentation for agents: `CLAUDE.md`, `docs/*`, `.env.example`. |
| 2026-11-17 | Runway saved as a reusable Design System artifact. |

## Next (agreed direction, not built yet)

1. **Task and project detail as slide-over panels** over the current page (as in the
   prototype) instead of full-page navigation. Likely approach: Next intercepting routes
   (`(.)task/[id]`) inside `(app)`, reusing the existing page content.
2. **Quick-edit popover parity on Cockpit cards** (due date, flag, update), as on All work.
3. **Restyle the remaining legacy bits** of task and project detail (old `chip-*` and
   `card` usage) to native Runway components.
4. **Reminders:** recurring reminders (e.g. "every Monday") if Yash asks; edit-in-place.

## Known loose ends

- `src/globals.css` (old "Moss" theme) and `src/components/ProgressRing.tsx` are unused
  and safe to delete.
- The tables from `migration-life-mode.sql` (`routine`, `habit`, `habit_log`, `skill`, `trade`,
  …) are unused. Don't build on them without asking; Life Mastery stores everything in
  `mastery_state`.
- `task.doer_id` is a legacy single-assignee column; `task_assignee` is the real one.
- `src/lib/projects.ts` `computeHealth` uses a UTC date for overdue milestones; move it to
  `istToday()` when you're next in that file.
- No automated tests. Logic worth covering first: `dayHistory` / `streaks` and
  `parseQuickAdd`.
