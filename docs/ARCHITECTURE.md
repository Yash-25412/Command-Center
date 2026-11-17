# Architecture

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14.2 App Router. Pages are **async server components**; writes are **server actions**; there are no API routes besides the auth callback. |
| UI | React 18.3, TypeScript 5.5, Tailwind 3.4, plain CSS in `src/app/globals.css`. Fonts are Manrope and DM Mono via `next/font`. |
| Data and auth | Supabase: Postgres with row-level security (any authenticated user has full access), email magic-link auth. `@supabase/ssr` handles cookies. |
| Hosting | Vercel, region `hnd1` (`vercel.json`). Every push to `main` deploys to production. |

Environment variables (`.env.example`): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ALLOWED_EMAILS` (comma-separated list of who can sign in).

## Request flow and auth

1. `src/middleware.ts` refreshes the Supabase session on every request. Signed-out users
   are sent to `/login`; signed-in users whose email isn't in `ALLOWED_EMAILS` are signed
   out and sent to `/login?denied=1`. **If `ALLOWED_EMAILS` is empty, anyone with a valid link
   can sign in.** Keep it set in Vercel.
2. `/login` sends a magic link with `emailRedirectTo = <origin>/auth/callback`. Supabase
   honours that only if the origin is on its **Redirect URLs** list; otherwise it falls back
   to the **Site URL**.
3. `src/app/auth/callback/route.ts` exchanges the code for a session and redirects to `/`,
   which then redirects to `/today`.

## Routes

| Route | File | Notes |
|---|---|---|
| `/today` | `src/app/(app)/today/page.tsx` | Cockpit. Data from `loadCockpit()`. |
| `/work` | `src/app/(app)/work/page.tsx` → `WorkView.tsx` | List/board, filters (`?scope=all/me/team/flagged`, `?person=`, `?q=`, `?view=`). |
| `/projects` | `src/app/(app)/projects/page.tsx` | Cards and the Ad Hoc card; create-project form. |
| `/project/[id]` | `src/app/(app)/project/[id]/page.tsx` | `id === "adhoc"` renders the Ad Hoc view. |
| `/task/[id]` | `src/app/(app)/task/[id]/page.tsx` | Full task detail (a page, not a panel yet). |
| `/dashboard` | `src/app/(app)/dashboard/page.tsx` | `?tab=overview/review/journal/team`; `?kind=` for journal filtering. Tabs render `src/components/views/*View.tsx`. |
| `/mastery` | `src/app/(app)/mastery/page.tsx` | Server-loads `mastery_state` and renders the client `MasteryOS`. |
| `/inbox`, `/waiting`, `/review`, `/journal`, `/people` | redirect stubs | Kept so old bookmarks still work. |
| `/login`, `/auth/callback` | outside `(app)` | No shell. |

`src/app/(app)/layout.tsx` is the signed-in shell. It loads people, categories and projects
for Capture and renders `RunwayNav` (the pill nav, Work/Life switch and Capture modal).

## Data model (`supabase/schema.sql` + migrations)

| Table | Purpose |
|---|---|
| `person` | Team members (`is_me` marks Yash; `active` false means removed, history kept), with a `hue` used for avatar colour. |
| `category` | Task categories (used by the `#tag` in quick add). |
| `project` | name, objective, status, target_date, pinned, archived_at. |
| `milestone` | project_id, name, date, done_at. |
| `task` | title, context, status (7 values), priority (high/med/low), due_date, focus_on, project_id (**null = Ad Hoc**), category_id, next_action, waiting_on / waiting_since / follow_up_on, flag_type / flag_date / flag_note, created_at, completed_at, last_activity_at. |
| `task_assignee` | Many-to-many link between task and person (`migration-multi-assignee.sql`). Older `doer_id` is a fallback. |
| `entry` | The journey: kind (update/meeting/decision/status/system), body, reason, status_from/to. |
| `link` | URLs attached to tasks. |
| `capture` | Inbox notes. |
| `reminder` | Dated nudges: title, remind_on, project_id?, person_id?, done_at (`migration-reminders.sql`). |
| `mastery_state` | A single JSON row holding the whole Life Mastery store (`migration-mastery-os.sql`). |
| `routine`, `habit`, `habit_log`, `skill`, `skill_practice_log`, `trade`, `trade_image`, `side_hustle_idea` | **Unused** leftovers from an earlier "life mode" (`migration-life-mode.sql`). No UI reads them. |

**Migration order** for an existing database: `migration-task-flags.sql`,
`migration-multi-assignee.sql`, `migration-mastery-os.sql`, `migration-reminders.sql`.
(`migration-life-mode.sql` is optional and unused.) All of them are idempotent.

## Server-side libraries (`src/lib/`)

| File | What it does |
|---|---|
| `supabase/server.ts`, `supabase/client.ts` | Supabase clients (server with cookies; browser). |
| `types.ts` | Row types (`Task`, `Project`, `Person`, `Reminder`, …). |
| `format.ts` | Dates (`istToday`, `istDate`, `addDaysISO`, `diffDaysISO`, `fmtDateWeekday`), labels, status metadata (`STATUS_META`), and the **quick-add parser** `parseQuickAdd(text, names)`. Safe to import on the client. |
| `workspace.ts` | `loadWorkspace()` loads every task with assignees, project and category, and decorates each one: `isOpen`, `overdue`, `stale`, `noNextFlag`, `lastActivityDays`, `reasons`, `rank` (urgency). Almost every page starts here. |
| `cockpit.ts` | The Runway engine. `loadCockpit()` returns carried tasks, the today list, follow-ups, attention, the next 5 days, reminder groups, captures, team pulse, cleared/streak/backlog. `loadMetrics()` returns dashboard metrics. `dayHistory()` and `streaks()` implement the day-cleared rule. `loadReminders()` returns `[]` if the table is missing. |
| `projects.ts` | `loadProjects()` (cards and health), `loadProjectDetail(id)`, `loadAdhoc()`. |

## Server actions (`src/app/actions/`)

| File | Actions |
|---|---|
| `tasks.ts` | `quickAddTask` (parser), `quickAddStructured` (form; accepts `projectId`), `setTaskDone` (one-tap check), `changeStatus`, `followUp`, `resumeFromWaiting`, `setTaskFlag`, `clearTaskFlag`, `quickUpdate` (quick-edit popover), `updateTaskField`, `setTaskAssignees`, `addEntry` (journey), `addLink`, `addCapture`, `convertCapture`, `dismissCapture`, `deleteTask`. |
| `reminders.ts` | `addReminder` (`when` = today/tomorrow/nextweek/YYYY-MM-DD; `link` = `p:<id>` / `u:<id>` / empty), `setReminderDone`, `snoozeReminder` (moves to tomorrow), `deleteReminder`. |
| `projects.ts` | `createProject`, `updateProjectField`, `setTaskProject`, `addMilestone`, `toggleMilestone`. |
| `people.ts` | Add, rename and set the role of people; remove or restore them. |
| `mastery.ts` | `loadMasteryState`, `saveMasteryState`. |

Every action ends with `revalidatePath(...)` for each page that shows the changed data.

## Client components

- `RunwayNav.tsx`: pill nav, ⌘K listener, a `cc:capture` window event (`openCapture(tab)`),
  and the `QuickAdd` modal.
- `QuickAdd.tsx`: the Capture modal (Task typed/form, Reminder, Inbox).
- `cockpit/CockpitItems.tsx`: `TaskCard`, `ReminderItem`, `ReminderComposer`, `Dock`.
  These use instant local state, then the server action.
- `WorkView.tsx`, `TaskRow.tsx`, `QuickEdit.tsx`: the All work list and board, and the
  quick-edit popover.
- Task-detail editors: `StatusPicker`, `NextActionEditor`, `JourneyComposer`,
  `TaskFlagPanel`, `TaskAssignees`, `ProjectPicker`, `TaskFieldSelect`, `TaskFieldDate`,
  `DeleteTaskButton`.
- `life/mastery/MasteryOS.tsx`: all of Life Mastery (store, debounced Supabase save, tools,
  log modal, week view).

## Styling

All tokens and component classes live in `src/app/globals.css`. Tailwind maps colour names
to those CSS variables (`tailwind.config.ts`). See `docs/DESIGN.md`. (`src/globals.css` is
an unused leftover from an older theme.)
