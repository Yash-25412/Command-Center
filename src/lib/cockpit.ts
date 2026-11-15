import { createClient } from "@/lib/supabase/server";
import { loadWorkspace, DecoratedTask } from "@/lib/workspace";
import { addDaysISO, diffDaysISO, istDate, istToday } from "@/lib/format";
import type { Person, Project, Reminder } from "@/lib/types";

// ---------------------------------------------------------------------------
// Shared vocabulary for the Runway cockpit and dashboard.
//
// "Carried" = still open, and its date is before today (IST). Carried items
// stay visible (and pulse) until cleared — that's the rollover.
// "Day cleared" = by the end of that day, nothing dated on or before it was
// left open (tasks + reminders). Days with nothing due count as cleared, so a
// quiet Sunday never breaks a streak.
// ---------------------------------------------------------------------------

export function projectCode(p: { name: string } | null | undefined): string {
  if (!p) return "AD HOC";
  const first = p.name.trim().split(/\s+/)[0] || p.name;
  return first.slice(0, 6).toUpperCase();
}

export interface CTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due: string | null;
  late: number | null; // >0 = days late, 0 = today, <0 = days ahead
  done: boolean;
  doneToday: boolean;
  code: string;
  projectId: string | null;
  projectName: string;
  who: string;
  assignees: { id: string; name: string; isMe: boolean; hue: number }[];
  next: string;
  flagType: string | null;
  flagDate: string | null;
  flagNote: string | null;
  waitingOn: string | null;
  followUpOn: string | null;
  reason: string | null;
}

export interface CReminder {
  id: string;
  title: string;
  on: string;
  late: number;
  done: boolean;
  link: string; // "@Suyash", "ECOM" or "Ad hoc"
  linkKind: "person" | "project" | "adhoc";
}

function toCTask(t: DecoratedTask, today: string): CTask {
  const done = t.status === "done";
  const completed = istDate(t.completed_at);
  const reason =
    t.status === "blocked"
      ? "Blocked — needs you"
      : t.stale
      ? `Stale ${t.lastActivityDays}d`
      : t.noNextFlag
      ? "No next action"
      : null;
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    due: t.due_date,
    late: t.due_date ? diffDaysISO(today, t.due_date) : null,
    done,
    doneToday: done && completed === today,
    code: projectCode(t.project),
    projectId: t.project_id,
    projectName: t.project?.name || "Ad Hoc",
    who: t.assignees.length ? t.assignees.map((a) => (a.is_me ? "Me" : a.name)).join(", ") : "Unassigned",
    assignees: t.assignees.map((a) => ({ id: a.id, name: a.is_me ? "Me" : a.name, isMe: a.is_me, hue: a.hue })),
    next: t.next_action || "",
    flagType: t.flag_type,
    flagDate: t.flag_date,
    flagNote: t.flag_note,
    waitingOn: t.waiting_on,
    followUpOn: t.follow_up_on,
    reason
  };
}

function toCReminder(r: Reminder, today: string, people: Person[], projects: Project[]): CReminder {
  const person = r.person_id ? people.find((p) => p.id === r.person_id) : null;
  const project = r.project_id ? projects.find((p) => p.id === r.project_id) : null;
  return {
    id: r.id,
    title: r.title,
    on: r.remind_on,
    late: diffDaysISO(today, r.remind_on),
    done: !!r.done_at,
    link: person ? "@" + person.name : project ? projectCode(project) : "Ad hoc",
    linkKind: person ? "person" : project ? "project" : "adhoc"
  };
}

// Outstanding at the end of day D?
function taskOpenAt(t: DecoratedTask, d: string): boolean {
  if (t.status === "cancelled" || !t.due_date || t.due_date > d) return false;
  const created = istDate(t.created_at);
  if (created && created > d) return false;
  if (t.status === "done") {
    const c = istDate(t.completed_at);
    if (!c) return false; // done before completion times were recorded
    return c > d;
  }
  return true;
}
function reminderOpenAt(r: Reminder, d: string): boolean {
  if (r.remind_on > d) return false;
  const created = istDate(r.created_at);
  if (created && created > d) return false;
  const done = istDate(r.done_at);
  return !done || done > d;
}

export type DayState = "cleared" | "partial" | "missed";

export function dayHistory(tasks: DecoratedTask[], reminders: Reminder[], today: string, days: number) {
  const out: { date: string; state: DayState; open: number }[] = [];
  for (let i = days - 1; i >= 1; i--) {
    const d = addDaysISO(today, -i);
    const open = tasks.filter((t) => taskOpenAt(t, d)).length + reminders.filter((r) => reminderOpenAt(r, d)).length;
    const closedThatDay =
      tasks.filter((t) => istDate(t.completed_at) === d).length + reminders.filter((r) => istDate(r.done_at) === d).length;
    out.push({ date: d, state: open === 0 ? "cleared" : closedThatDay > 0 ? "partial" : "missed", open });
  }
  return out;
}

export function streaks(history: { state: DayState }[], todayCleared: boolean) {
  let current = todayCleared ? 1 : 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].state !== "cleared") break;
    current++;
  }
  let best = 0;
  let run = 0;
  const states: DayState[] = history.map((h) => h.state);
  if (todayCleared) states.push("cleared");
  states.forEach((st) => {
    run = st === "cleared" ? run + 1 : 0;
    best = Math.max(best, run);
  });
  return { current, best: Math.max(best, current) };
}

export async function loadReminders(): Promise<Reminder[]> {
  const supabase = createClient();
  // If the reminders migration hasn't been run yet, the query errors — treat
  // that as "no reminders" so the rest of the app keeps working.
  const { data, error } = await supabase.from("reminder").select("*").order("remind_on", { ascending: true });
  if (error) return [];
  return (data || []) as Reminder[];
}

export async function loadCockpit() {
  const ws = await loadWorkspace();
  const supabase = createClient();
  const today = istToday();
  const [reminders, { data: captures }] = await Promise.all([
    loadReminders(),
    supabase.from("capture").select("id,text,created_at").order("created_at", { ascending: false })
  ]);

  const all = ws.tasks.filter((t) => t.status !== "cancelled");
  const cts = all.map((t) => toCTask(t, today));
  const open = cts.filter((t) => !t.done);

  const carried = cts
    .filter((t) => t.late !== null && t.late > 0 && (!t.done || t.doneToday))
    .sort((a, b) => Number(a.done) - Number(b.done) || (b.late || 0) - (a.late || 0));
  const dueToday = cts
    .filter((t) => t.late === 0 && (!t.done || t.doneToday))
    .sort((a, b) => Number(a.done) - Number(b.done));
  const focusExtra = open.filter(
    (t) => all.find((x) => x.id === t.id)?.focus_on === today && t.late !== 0 && !(t.late && t.late > 0)
  );
  const todayList = dueToday.concat(focusExtra);

  const followUps = open.filter(
    (t) =>
      (t.flagType && t.flagDate && t.flagDate <= today) ||
      (t.status === "waiting" && t.followUpOn && t.followUpOn <= today)
  );

  const shown = new Set(carried.concat(todayList, followUps).map((t) => t.id));
  const rankOf = new Map(all.map((t) => [t.id, t.rank]));
  const attention = open
    .filter((t) => t.reason && !shown.has(t.id))
    .sort((a, b) => (rankOf.get(a.id) || 0) - (rankOf.get(b.id) || 0))
    .slice(0, 6);

  const rems = reminders.map((r) => toCReminder(r, today, ws.people, ws.projects));
  const remCarried = rems.filter((r) => r.late > 0 && (!r.done || istDate(reminders.find((x) => x.id === r.id)?.done_at) === today));
  const remToday = rems.filter((r) => r.late === 0);
  const remUpcoming = rems.filter((r) => r.late < 0 && r.late >= -7 && !r.done);

  const days = [1, 2, 3, 4, 5].map((n) => {
    const d = addDaysISO(today, n);
    return {
      date: d,
      tasks: open.filter((t) => t.due === d),
      reminders: rems.filter((r) => r.on === d && !r.done)
    };
  });

  const openDue =
    carried.filter((t) => !t.done).length +
    todayList.filter((t) => !t.done).length +
    followUps.length +
    remCarried.filter((r) => !r.done).length +
    remToday.filter((r) => !r.done).length;
  const doneDue =
    carried.filter((t) => t.done).length +
    todayList.filter((t) => t.done).length +
    remCarried.filter((r) => r.done).length +
    remToday.filter((r) => r.done).length;
  const cleared = openDue === 0;

  const history = dayHistory(all, reminders, today, 120);
  const { current: streak, best } = streaks(history, cleared);
  const week = history.slice(-6).map((h) => ({ date: h.date, state: h.state as DayState | "today" }));
  week.push({ date: today, state: cleared ? "cleared" : "today" });

  const backlog = carried.filter((t) => !t.done).length + remCarried.filter((r) => !r.done).length;
  const backlogTotal = carried.length + remCarried.length;

  const team = ws.people
    .filter((p) => !p.is_me && p.active)
    .map((p) => {
      const mine = open.filter((t) => t.assignees.some((a) => a.id === p.id));
      return {
        id: p.id,
        name: p.name,
        hue: p.hue,
        open: mine.length,
        overdue: mine.filter((t) => t.late !== null && t.late > 0).length,
        blocked: mine.filter((t) => t.status === "blocked").length,
        waiting: mine.filter((t) => t.status === "waiting").length
      };
    });

  return {
    today,
    carried,
    todayList,
    followUps,
    attention,
    days,
    remCarried,
    remToday,
    remUpcoming,
    captures: captures || [],
    team,
    cleared,
    openDue,
    doneDue,
    streak,
    best,
    week,
    backlog,
    backlogTotal,
    people: ws.people,
    projects: ws.projects,
    remindersReady: true
  };
}

// ---------------------------------------------------------------------------
// Dashboard metrics — all computed from real task / reminder history.
// ---------------------------------------------------------------------------
export async function loadMetrics() {
  const ws = await loadWorkspace();
  const reminders = await loadReminders();
  const today = istToday();
  const all = ws.tasks.filter((t) => t.status !== "cancelled");
  const open = all.filter((t) => t.status !== "done");

  const completedOn = (t: DecoratedTask) => (t.status === "done" ? istDate(t.completed_at) : null);
  const inRange = (d: string | null, from: string, to: string) => !!d && d >= from && d <= to;

  // Velocity, last 14 days
  const velocity = Array.from({ length: 14 }, (_, i) => {
    const d = addDaysISO(today, i - 13);
    return {
      date: d,
      closed: all.filter((t) => completedOn(t) === d).length,
      created: all.filter((t) => istDate(t.created_at) === d).length
    };
  });

  const weekStart = addDaysISO(today, -6);
  const lastWeekStart = addDaysISO(today, -13);
  const closedThisWeek = all.filter((t) => inRange(completedOn(t), weekStart, today)).length;
  const closedLastWeek = all.filter((t) => inRange(completedOn(t), lastWeekStart, addDaysISO(weekStart, -1))).length;

  // On-time rate, 30 days: of tasks completed in the window that had a due date,
  // how many were completed on or before it.
  const from30 = addDaysISO(today, -29);
  const completed30 = all.filter((t) => t.due_date && inRange(completedOn(t), from30, today));
  const onTime30 = completed30.filter((t) => (completedOn(t) || "") <= (t.due_date || ""));
  const onTimeRate = completed30.length ? Math.round((onTime30.length / completed30.length) * 100) : null;

  // Cycle time, 30 days (created -> done)
  const cycles = all
    .filter((t) => inRange(completedOn(t), from30, today))
    .map((t) => diffDaysISO(completedOn(t)!, istDate(t.created_at)!));
  const cycleTime = cycles.length ? Math.round((cycles.reduce((a, b) => a + b, 0) / cycles.length) * 10) / 10 : null;

  // Overdue rate per week, 12 weeks: at each week's end, share of open dated
  // tasks that were past due.
  const overdueRate = Array.from({ length: 12 }, (_, i) => {
    const end = addDaysISO(today, -7 * (11 - i));
    const openAt = all.filter((t) => {
      const created = istDate(t.created_at);
      if (!t.due_date || (created && created > end)) return false;
      const c = completedOn(t);
      return !(t.status === "done" && (!c || c <= end));
    });
    const late = openAt.filter((t) => (t.due_date || "") < end).length;
    return { end, pct: openAt.length ? Math.round((late / openAt.length) * 100) : 0 };
  });

  const history = dayHistory(all, reminders, today, 85);
  const carriedTasks = open.filter((t) => t.due_date && t.due_date < today);
  const carriedRems = reminders.filter((r) => !r.done_at && r.remind_on < today);
  const ages = carriedTasks.map((t) => diffDaysISO(today, t.due_date!)).concat(carriedRems.map((r) => diffDaysISO(today, r.remind_on)));
  const aging = [
    { label: "1 day", n: ages.filter((a) => a <= 1).length },
    { label: "2–3 days", n: ages.filter((a) => a >= 2 && a <= 3).length },
    { label: "4–7 days", n: ages.filter((a) => a >= 4 && a <= 7).length },
    { label: "7+ days", n: ages.filter((a) => a > 7).length }
  ];

  const openToday =
    all.filter((t) => taskOpenAt(t, today)).length + reminders.filter((r) => reminderOpenAt(r, today)).length;
  const { current: streak, best } = streaks(history, openToday === 0);

  const projects = ws.projects
    .filter((p) => !p.archived_at && p.status !== "cancelled")
    .map((p) => {
      const pt = all.filter((t) => t.project_id === p.id);
      const done = pt.filter((t) => t.status === "done").length;
      return { id: p.id, name: p.name, pct: pt.length ? Math.round((done / pt.length) * 100) : 0, open: pt.length - done };
    });

  return {
    today,
    velocity,
    closedThisWeek,
    closedLastWeek,
    onTimeRate,
    cycleTime,
    overdueRate,
    history,
    aging,
    carriedNow: ages.length,
    streak,
    best,
    projects
  };
}
