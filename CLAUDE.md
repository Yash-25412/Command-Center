# CLAUDE.md: briefing for AI agents

You're working on **Command Center**, a single-user web app owned by **Yash** (heads ecom
analysis in FP&A at PhysicsWallah, manages a team of ~5–6). He uses it every day to run his
work and personal practice. Read this file top to bottom before changing anything. Then
read whichever of `docs/` applies to your task.

## 1. Orientation in 60 seconds

- **What it is:** a daily cockpit for tasks, projects, dated reminders and team follow-ups,
  plus a Life Mastery side for skill practice. See `README.md` for the screen map and
  `docs/PRODUCT.md` for every concept.
- **Stack:** Next.js 14 App Router with **server components + server actions** (no API
  routes, no client data layer), React 18, TypeScript, Tailwind 3, Supabase
  (Postgres + email magic-link auth), deployed on Vercel.
- **Where things are:**
  - `src/app/(app)/*`: every signed-in page (shared shell in `src/app/(app)/layout.tsx`)
  - `src/app/actions/*`: all writes (server actions)
  - `src/lib/workspace.ts`: loads every task and decorates it (overdue, stale, urgency rank)
  - `src/lib/cockpit.ts`: the Cockpit and Dashboard engine (carried items, reminders,
    day-cleared history, streaks, metrics)
  - `src/components/RunwayNav.tsx`: top navigation and Capture (⌘K)
  - `src/components/life/mastery/MasteryOS.tsx`: all of Life Mastery (client component)
  - `supabase/`: `schema.sql` (fresh install) plus `migration-*.sql` (incremental changes)
- **Design language:** "Runway". Read `docs/DESIGN.md` before touching UI. Use the existing
  classes (`glass`, `eyebrow`, `seg`, `pill`, `chk`, `carried`, `btn`, `field`, `card`);
  don't invent new colours.

## 2. Working rules (agreed with Yash)

1. **Push straight to `main`.** Yash wants one live link, so don't use feature branches or
   PRs unless he asks. Every push to `main` deploys to production on Vercel.
2. **Verify every push.** You may not be able to build locally (see §4). After pushing, poll
   the commit status until Vercel reports success:
   ```bash
   gh api repos/Yash-25412/Command-Center/commits/$(git rev-parse HEAD)/status \
     --jq '.state + " · " + (.statuses[0].description // "")'
   ```
   If it fails, open the deployment's `target_url` (or read the error) and fix it
   immediately; production is broken until you do.
3. **Database changes = a new migration file** (`supabase/migration-<name>.sql`,
   idempotent: `if not exists`, `drop policy if exists`) **and** append the same DDL to
   `supabase/schema.sql`. Agents can't run SQL against Yash's Supabase, so tell him exactly
   which file to paste into the SQL Editor. Make the app tolerate the migration not having
   run yet (see `loadReminders()` in `src/lib/cockpit.ts`: a query error becomes an empty
   list).
4. **Don't regress existing features.** The redesign folded nine old screens into four,
   but every feature was kept: statuses, flags, follow-ups, waiting/blocked, journey,
   decisions with reasons, links, milestones, team management, quick-add grammar, the
   board's drag and drop. `docs/PRODUCT.md` has the full inventory; check it before
   removing anything.
5. **No redundancy, no gimmicks.** Yash explicitly prefers fewer, purposeful elements, so
   each control or metric has to earn its place. (Example: in Mastery the on-screen
   keyboard, lever slider and HR dials were removed; each skill keeps one compact tool.)
6. **Commit messages:** imperative summary line, a short body explaining *why*. End with
   the attribution trailer your environment specifies, if any.
7. **Keep these docs current.** If you add a route, table, concept or design rule, update
   `README.md` / `docs/*` in the same commit. Add a line to `docs/ROADMAP.md` → *History*.

## 3. Product rules that are easy to get wrong

- **The day is an IST day.** Servers run in UTC. Use `istToday()`, `istDate(ts)`,
  `addDaysISO()` and `diffDaysISO()` from `src/lib/format.ts`; never use
  `new Date().toISOString().slice(0,10)` for "today" on the server. (Life Mastery runs on
  the client and uses local time.)
- **Carried** = still open and dated before today. Carried tasks live in the Vault; carried
  reminders sit at the top of the Reminders card in red. They pulse until cleared. Scarlet
  is reserved for this; don't use it for anything else.
- **Reminders appear only in the Reminders card on the Cockpit** (carried, today, next 7
  days), never in the Vault, Today or day columns. Yash asked for this explicitly.
- **Day cleared** = nothing dated on or before that day was left open at the end of it
  (tasks + reminders; today also counts follow-ups that are due). Days with nothing due
  count as cleared. **Streak** = consecutive cleared days; today only counts once it's
  cleared, so a day still in progress never breaks the streak.
- **Ad Hoc** isn't a database row. It's `task.project_id is null`. Anything created without
  a project lands there.
- **Single user.** `person` rows are the team Yash tracks, not users. Only emails in
  `ALLOWED_EMAILS` can sign in.

## 4. Environment gotchas (learned the hard way)

- **Sandboxed sessions may have no npm registry access**, so `npm install` / `next build`
  can fail locally. Fall back to a syntax check of the files you changed:
  ```bash
  tsc --noEmit --jsx preserve --target es2020 --module esnext --moduleResolution bundler \
      --skipLibCheck --noResolve --isolatedModules --resolveJsonModule <files> \
    | grep -E "error TS1[0-9]{3}|error TS17"
  ```
  Then rely on the Vercel build (§2.2) as the real type-check.
- **React 18 types:** don't use `useOptimistic` or other canary-only hooks. Use local
  state and a `useEffect` re-sync (see `useLocal` in `src/components/cockpit/CockpitItems.tsx`).
  Never pass an `async` function to `startTransition`; call the action inside a
  `() => { … }` block. Form `action={async (fd) => …}` is fine.
- **Tailwind + CSS-variable colours:** colours like `accent`, `red` and `ink` are
  `var(--x)`, so opacity modifiers (`bg-red/40`) generate **nothing**. Use arbitrary values
  (`bg-[rgba(255,90,95,0.4)]`) instead.
- **Native `<select>` dropdowns** are styled in `globals.css` (dark options). Keep that rule,
  or Windows/Chrome shows white-on-white.
- **Auth redirects:** magic links only return to URLs on Supabase → Authentication → URL
  Configuration → Redirect URLs. Site URL is the production domain. If sign-in lands on
  `localhost:3000`, that list is the cause, not the code.
- **The repo moved** to `Yash-25412/Command-Center` (capital letters). Use that remote URL.

## 5. How to add things (patterns to copy)

| You want to… | Copy this |
|---|---|
| Add a page | `src/app/(app)/<route>/page.tsx` as an async server component with `export const dynamic = "force-dynamic"`; data via `loadWorkspace()` / `loadCockpit()`; header = `eyebrow` + light `h1` (see `/projects`). Add it to `NAV` in `RunwayNav.tsx` only if it's a top-level destination. |
| Add a write | Server action in `src/app/actions/<area>.ts` (`"use server"`), then `revalidatePath` every page that shows the data (`/today`, `/work`, `/dashboard`, `/task/[id]`, …). |
| Add an instant-feeling toggle | Client component plus local state and an action call, like `TaskCard` / `ReminderItem` in `CockpitItems.tsx`. |
| Add a metric | Compute it in `loadMetrics()` (`src/lib/cockpit.ts`) from real history, never fake data, and render it as a `Tile` or a `glass` section in `/dashboard`. |
| Open Capture from code | `openCapture("task" | "reminder" | "inbox")` from `RunwayNav.tsx` (client only). |
| Change Life Mastery | Everything is in `MasteryOS.tsx`. Programme content is JSON in `src/components/life/mastery/data/`. The store shape is persisted as one JSON row in `mastery_state`, so keep old keys readable. |

## 6. Related artifacts outside the repo

- **Design prototypes** (three directions, interactive): the Claude Design canvas
  "Command Center — Luxury Glass Prototypes":
  https://claude.ai/artifact/8v5gYQNKHj9RWYJfpabTWp. Board 03 "The Runway" is the chosen
  direction.
- **Midnight Noir Glass design system:** the runner-up direction, saved as a Claude Design
  System for future projects: https://claude.ai/artifact/VbesHgvFvfJ186SYNxKW9J. When Yash says
  "use Noir" for a new project, that's this.

These are claude.ai artifacts, so they're visible only to Yash's account.
