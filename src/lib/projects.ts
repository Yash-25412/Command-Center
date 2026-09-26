import { createClient } from "@/lib/supabase/server";
import { fmtDate, fmtDateWeekday } from "@/lib/format";
import { loadWorkspace, DecoratedTask } from "@/lib/workspace";

export interface ProjectHealth {
  color: "green" | "amber" | "red";
  label: string;
  why: string;
}

function computeHealth(open: DecoratedTask[], milestones: { date: string | null; done_at: string | null }[]): ProjectHealth {
  const blocked = open.filter((t) => t.status === "blocked").length;
  const overdue = open.filter((t) => t.overdue).length;
  const stale = open.filter((t) => t.stale).length;
  const noNext = open.filter((t) => t.noNextFlag).length;
  const today = new Date().toISOString().slice(0, 10);
  const overdueMilestone = milestones.some((m) => !m.done_at && m.date && m.date < today);

  if (blocked > 0) {
    return { color: "red", label: "Blocked", why: `${blocked} blocked task${blocked === 1 ? "" : "s"} need${blocked === 1 ? "s" : ""} you` };
  }
  if (overdueMilestone) {
    return { color: "red", label: "Blocked", why: "A milestone has passed with work unfinished" };
  }
  if (overdue || stale || noNext) {
    const parts = [
      overdue ? `${overdue} overdue` : "",
      stale ? `${stale} stale` : "",
      noNext ? `${noNext} without a next action` : ""
    ].filter(Boolean);
    return { color: "amber", label: "Needs attention", why: parts.join(", ") };
  }
  return { color: "green", label: "On track", why: "On track" };
}

export async function loadProjects() {
  const { tasks, projects } = await loadWorkspace();
  const supabase = createClient();
  const { data: milestones } = await supabase.from("milestone").select("*");

  return projects.map((p) => {
    const pTasks = tasks.filter((t) => t.project_id === p.id);
    const open = pTasks.filter((t) => t.isOpen);
    const done = pTasks.filter((t) => t.status === "done");
    const pMilestones = (milestones || []).filter((m) => m.project_id === p.id);
    const health = computeHealth(open, pMilestones);
    const pct = pTasks.length ? Math.round((done.length / pTasks.length) * 100) : 0;
    const nextMs = pMilestones
      .filter((m) => !m.done_at)
      .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"))[0];
    const lastActivity = pTasks
      .slice()
      .sort((a, b) => b.last_activity_at.localeCompare(a.last_activity_at))[0];

    return {
      project: p,
      health,
      taskCount: pTasks.length,
      doneCount: done.length,
      openCount: open.length,
      blocked: open.filter((t) => t.status === "blocked").length,
      overdue: open.filter((t) => t.overdue).length,
      stale: open.filter((t) => t.stale).length,
      pct,
      nextMsLabel: nextMs ? `${nextMs.name}, ${nextMs.date ? fmtDate(nextMs.date) : "no date"}` : "No milestones set",
      lastActivityLabel: lastActivity ? fmtDateWeekday(lastActivity.last_activity_at.slice(0, 10)) : "No activity yet"
    };
  });
}

export async function loadProjectDetail(projectId: string) {
  const { tasks, categories } = await loadWorkspace();
  const supabase = createClient();

  const [{ data: project }, { data: milestones }] = await Promise.all([
    supabase.from("project").select("*").eq("id", projectId).maybeSingle(),
    supabase.from("milestone").select("*").eq("project_id", projectId).order("sort_order", { ascending: true })
  ]);

  if (!project) return null;

  const pTasks = tasks.filter((t) => t.project_id === projectId);
  const taskIds = pTasks.map((t) => t.id);

  const { data: entries } =
    taskIds.length > 0
      ? await supabase
          .from("entry")
          .select("*, task:task_id(title)")
          .in("task_id", taskIds)
          .order("occurred_at", { ascending: false })
      : { data: [] };

  const open = pTasks.filter((t) => t.isOpen);
  const done = pTasks.filter((t) => t.status === "done");
  const health = computeHealth(open, milestones || []);
  const pct = pTasks.length ? Math.round((done.length / pTasks.length) * 100) : 0;

  const journey = (entries || []).filter((e) => e.kind !== "status");
  const decisions = journey.filter((e) => e.kind === "decision");
  const lastEntry = journey[0];

  const cols = [
    { key: "done", label: "Done", color: "var(--green)", items: done, emptyMsg: "Nothing finished yet." },
    {
      key: "happening",
      label: "Happening",
      color: "var(--accent)",
      items: open.filter((t) => t.status === "active" || t.status === "review"),
      emptyMsg: "Nothing in motion."
    },
    {
      key: "next",
      label: "Blocked, waiting and next",
      color: "var(--red)",
      items: open.filter((t) => t.status === "blocked" || t.status === "waiting" || t.status === "planned"),
      emptyMsg: "Nothing stuck. Nothing queued."
    }
  ];

  return {
    project,
    health,
    pct,
    doneCount: done.length,
    taskCount: pTasks.length,
    milestones: milestones || [],
    cols,
    journey: journey.slice(0, 10),
    decisions,
    lastEntry,
    categories
  };
}
