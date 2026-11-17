# Command Center

Yash's personal workload and project command center: one private web app for running work
(projects, tasks, follow-ups, a small team) plus a **Life** side for personal skill practice
(Life Mastery: piano, handstand, dragon flag, marathon).

It's designed as a daily habit: open it in the morning, clear what's due, and keep the
"day cleared" streak alive. The visual direction is **Runway**: obsidian frosted glass, a
pearl accent, scarlet reserved for overdue (carried) items, and days laid out left to right.

- **Live:** https://command-center-one-lime.vercel.app (pushes to `main` deploy automatically)
- **Stack:** Next.js 14 (App Router, server actions) · React 18 · TypeScript · Tailwind 3 ·
  Supabase (Postgres + email-link auth) · Vercel

> **AI agents starting a new session:** read [`CLAUDE.md`](CLAUDE.md) first. It's the
> top-down briefing: how the repo is laid out, the rules for working in it, and the gotchas
> that have already cost time.

## The app in one screen

| Area | Route | What it's for |
|---|---|---|
| **Cockpit** | `/today` | The daily view, scrolling left to right: **the Vault** (tasks carried forward from earlier days, pulsing red until cleared), **Today** (tasks due, follow-ups), then the **next five days**. Below that: Needs attention, **Reminders**, Inbox, Team pulse. A dock at the bottom shows the day-cleared ring and the streak. |
| **All work** | `/work` | Every task. List (grouped by status) or Board (drag between statuses). Filters: All / Me / Team / Flagged / per person, and search. |
| **Projects** | `/projects`, `/project/[id]` | Project cards with health, progress, milestones, decisions and a merged journey. **Ad Hoc** (`/project/adhoc`) is the default home for tasks without a project. |
| **Task** | `/task/[id]` | Next action, waiting/blocked details, follow-up/update flags, links, the Journey (updates, meetings, decisions with reasons), assignees, status. |
| **Dashboard** | `/dashboard` | Live metrics (streak, velocity, on-time rate, overdue rate, cycle time, days-cleared heatmap, backlog age, project completion) plus **Weekly review**, **Journal** and **Team** tabs. |
| **Life · Mastery** | `/mastery` | Four phased skill programmes with phase gates, session logging, a body-status check, a weekly schedule and one compact practice tool per skill. |
| **Capture** | `⌘K` / `Ctrl+K` anywhere | Add a task (natural language or form), a dated reminder, or an inbox note. |

Old routes (`/inbox`, `/waiting`, `/review`, `/journal`, `/people`) redirect to their new homes.

## Run it locally

```bash
cp .env.example .env.local   # fill in the three values
npm install
npm run dev                  # http://localhost:3000
```

The database schema and migrations are in `supabase/`. **[`DEPLOY.md`](DEPLOY.md)** explains how
to set up Supabase and Vercel from scratch, and which migrations an existing database still needs.

## Documentation

| File | Read it for |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Start here if you're an AI agent (or a new contributor): rules, workflow, gotchas. |
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | What the app does and why: every concept (carried items, reminders vs tasks, day-cleared streak, Ad Hoc, flags, health) and the decisions behind them. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Code map: routes, data model, server actions, the cockpit/metrics engine, auth. |
| [`docs/DESIGN.md`](docs/DESIGN.md) | The Runway design system: tokens, CSS classes, patterns, do/don't. Also where the Noir alternative lives. |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | History of what was built, what's next, and known loose ends. |
| [`DEPLOY.md`](DEPLOY.md) | Supabase + Vercel setup, migrations, auth redirect URLs. |
