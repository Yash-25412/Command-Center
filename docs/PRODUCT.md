# Product: concepts, features, decisions

This is the "why" document. If you're about to change behaviour, check here for what's
expected and what was deliberately decided.

## Who it's for

One person: **Yash**, who heads ecom analysis in FP&A and manages a team of about 5–6. He
tracks his own work and his team's in one place. Team members are records (`person`), not
users; nobody else logs in or gets notified. Goal: an app he *wants* to open every day.
Clearing the day should feel satisfying, and the backlog should be visible enough that
it nags him.

## Core objects

| Object | What it is | Key fields |
|---|---|---|
| **Project** | A body of work with an objective | name, objective, target date, status, milestones, health (computed) |
| **Ad Hoc** | The default project for tasks without one. **Not a DB row**: `project_id is null`. | Has its own card and page (`/project/adhoc`) |
| **Task** | A unit of work with a deadline | title, status, priority, due date, assignees (many), category, project, **next action**, context, links, flag, waiting-on / follow-up date, journey |
| **Reminder** | A **dated nudge for Yash himself**, e.g. "Follow up with Suyash on the GRN data" or "Check the category team's emails". Ad hoc, or linked to a project or a person. | title, `remind_on`, optional project / person, `done_at` |
| **Capture** | An inbox note: a half-formed thought to sort later | text → *Make task* (lands in Ad Hoc) or *Dismiss* |
| **Entry** (Journey) | The timeline on a task: update, meeting, decision (with a **why**), and auto-logged status changes | kind, body, reason, status_from/to |
| **Milestone** | A dated checkpoint on a project | name, date, done_at |
| **Person** | A team member Yash tracks | name, role, active (removing keeps history) |

**Reminders vs tasks:** a task is work with an owner and a lifecycle (7 statuses, a
journey). A reminder is a one-line nudge to *Yash* on a date, with no lifecycle beyond
done or not done. Daily rituals (workout, piano) were deliberately **not** made reminders;
practice lives in Life Mastery.

## Task lifecycle

- **Statuses:** Planned → Active → Waiting / Blocked → Review → Done (or Cancelled). Every
  change is written to the journey automatically. Done stamps `completed_at`; un-ticking
  returns the task to Active.
- **Next action:** one line saying what happens next. An Active task without one is
  flagged "No next action".
- **Waiting:** who you're waiting on, since when, and a follow-up date. *Followed up* pushes
  the follow-up date out 2 days; *Got it, resume* moves the task back to Active.
- **Flags:** "Follow-up required" or "Update required", each with a date and a note. They
  work on any open task, whatever its status.
- **Signals** (`src/lib/workspace.ts`): **overdue** = open and past its due date;
  **stale** = no activity for 3+ days (high priority) or 7+ days (other priorities),
  excluding Planned; **no next action**. Together these drive the urgency rank and
  *Needs attention*.

## The Cockpit (`/today`)

The daily view. Days scroll left to right ("the runway"):

1. **The Vault:** tasks *carried forward*, meaning still open with a due date before
   today. They pulse scarlet until cleared. Ticked items stay visible (struck through) for
   the rest of the day, which makes clearing them feel rewarding.
2. **Today:** tasks due today (plus any with `focus_on` = today), and **follow-ups due**
   (flags whose date has arrived, and waiting tasks whose follow-up date has arrived), with
   their one-tap actions. There's a ring showing due items cleared.
3. **Next five days:** tasks only, by due date.
4. Below the runway:
   - **Needs attention:** blocked, stale or no-next-action tasks not already shown above,
     ranked by urgency.
   - **Reminders:** the **only** place reminders appear: the composer, then carried (red),
     today and the next 7 days. Hover a reminder to snooze it one day (+1d) or delete it.
     *(Decision: Yash didn't want reminders mixed into the task columns.)*
   - **Inbox:** captures, each with *Make task* or *Dismiss*.
   - **Team pulse:** open, late, blocked and waiting counts per person; links to their
     filtered work.
5. **Dock:** the day-cleared ring, + Reminder / + Task / + Inbox, and the streak.

### Day cleared and the streak

- **Day cleared:** at the end of the day, nothing dated on or before it was left open
  (tasks and reminders). For *today*, follow-ups that are due also have to be handled.
  A day with nothing due counts as cleared.
- **Streak:** consecutive cleared days, computed from real history (`completed_at`,
  `done_at`, `created_at`) in **IST**. Today is added only once it's cleared, so an
  unfinished morning never shows a broken streak. The best streak is taken over the last
  120 days.
- **Rollover is automatic:** nothing moves in the database. "Carried" is computed by
  comparing dates to today.

## Capture (⌘K)

One door for everything that comes in:

- **Task, typed:** `Rahul: reconcile March revenue by fri #revenue !high` sets the person,
  due weekday (`today`, `tomorrow`, `mon`…`sun`), category and priority. A live preview
  shows how it was parsed. Every part is optional.
- **Task, form:** title, several assignees, project (defaults to Ad Hoc), category,
  priority, due date.
- **Reminder:** text, with when (Today / Tomorrow / Next Mon / pick a date) and an optional
  project or person link.
- **Inbox:** free text.

## All work (`/work`)

The **List** view groups tasks by status, with a pencil quick-edit on each row (due date,
flag, one-line update that also becomes the next action). The **Board** view has one
column per status; drag a card to change its status, and the move is logged. Filters:
All / Me / Team / Flagged / a single person, plus search.

## Projects

- **Card:** health, objective, progress ring, open/overdue/blocked/stale counts, next
  milestone, last update. Ad Hoc is always the first card, drawn with a dashed border.
- **Health** (`src/lib/projects.ts`):
  - **Red / Blocked:** any task is blocked, or a milestone date has passed unfinished.
  - **Amber / Needs attention:** something is overdue, stale or missing a next action.
  - **Green / On track:** otherwise.
- **Detail:** objective, where we are (the latest update), Done / Happening /
  Blocked·Waiting·Next columns, milestones, a decisions log and a merged journey.

## Dashboard (`/dashboard`)

- **Overview** (all computed from real data; never hard-code numbers):
  - streak and best streak
  - closed this week vs last week
  - on-time rate over 30 days (done on or before the due date)
  - items carried now
  - average cycle time over 30 days (created → done)
  - 14-day velocity (closed vs created)
  - 12-week overdue rate
  - 12-week days-cleared heatmap
  - age of carried items
  - completion per project
- **Weekly review:** completed, blocked, waiting, overdue and stale tasks, and what's due
  next week.
- **Journal:** every update, meeting and decision, grouped by day, filterable by type.
- **Team:** per-person load and top tasks, plus team management (add, rename, set role,
  remove or restore).

## Life · Mastery (`/mastery`)

Four phased programmes: **Piano**, **Handstand**, **Dragon Flag** and **Marathon**. The
content is JSON in `src/components/life/mastery/data/`.

- **Skill rail:** shows the phase ring and whether you've logged today. A **Week** card holds
  the 7-day prescription, the Sunday recovery checklist, the monthly consistency
  calendar and the load rules.
- **Per skill:**
  - a phase stepper
  - tabs: Focus, Theory/Form cues, Practice/Protocol, Guardrails, **Phase gate**
    (tick every criterion to unlock the next phase; the first clear date is
    recorded), Notes (autosaved) and Log
  - where the programme data provides them (handstand v1.1+): each protocol block
    opens to step-by-step **how-to** instructions and a **should feel** line;
    Guardrails lists the **form break signs** that end a set; the gate shows
    **passing feels like** / **not yet if**
  - **Log today's session:** tick the phase's protocol items and add notes
  - **Body check:** green / amber / red for the relevant body part, showing the
    phase's stop rules
- **One compact practice tool per skill:**
  - Piano: metronome and Sa drone
  - Handstand: hold timer
  - Dragon flag: descent-tempo counter
  - Marathon: cadence beat

  *Decision:* the on-screen keyboard, 25-minute slot timer, lever/torque slider and
  distance/HR/RPE dials were removed as gimmicks that recorded nothing. Numbers belong in
  the session log notes.
- **Persistence:** the whole store is one JSON row (`mastery_state`), saved with a short
  delay after each change. It can be exported and imported as JSON.

## Decisions log

| Date | Decision |
|---|---|
| 2026-11-15 | Three luxury-glass directions prototyped (Midnight Noir, Smoked Bronze, Runway). **Runway** chosen. Noir saved as a separate design system for future projects. |
| 2026-11-15 | Nine screens folded into Cockpit / All work / Projects / Dashboard, plus Life; every feature kept. |
| 2026-11-15 | Reminders are dated personal nudges (ad hoc, project or person), not daily rituals. |
| 2026-11-15 | Streak = days cleared (everything due handled), not "any activity". |
| 2026-11-15 | Ad Hoc is the default project for unmapped tasks. |
| 2026-11-16 | Work straight on `main`, with one production link. |
| 2026-11-16 | Life Mastery restyled into Runway; practice tools reduced to one compact tool per skill. |
| 2026-11-16 | Reminders live only in the Reminders card, not in the Vault or day columns. |
| 2026-11-21 | Life programme content is edited in the "Handstand, Flag & Marathon" artifact and synced into `data/physical.json` (same schema). |
