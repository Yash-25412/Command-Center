import { createClient } from "@/lib/supabase/server";
import { daysBetween, dueLabel } from "@/lib/format";
import type { Person, Project, Category, Task } from "@/lib/types";

export interface DecoratedTask extends Task {
  doer: Person | null;
  project: Project | null;
  category: Category | null;
  due: ReturnType<typeof dueLabel>;
  isOpen: boolean;
  overdue: boolean;
  stale: boolean;
  noNextFlag: boolean;
  lastActivityDays: number;
  reasons: { label: string; cls: string }[];
  rank: number;
}

export async function loadWorkspace() {
  const supabase = createClient();
  const [{ data: tasks }, { data: people }, { data: projects }, { data: categories }] =
    await Promise.all([
      supabase.from("task").select("*").neq("status", "cancelled"),
      supabase.from("person").select("*").order("is_me", { ascending: false }),
      supabase.from("project").select("*"),
      supabase.from("category").select("*")
    ]);

  const peopleById = new Map((people || []).map((p) => [p.id, p]));
  const projectsById = new Map((projects || []).map((p) => [p.id, p]));
  const categoriesById = new Map((categories || []).map((c) => [c.id, c]));

  const today = new Date();

  const decorated: DecoratedTask[] = (tasks || []).map((t) => {
    const isOpen = t.status !== "done" && t.status !== "cancelled";
    const due = dueLabel(t.due_date);
    const lastActivityDays = Math.max(0, daysBetween(today, new Date(t.last_activity_at)));
    const overdue = isOpen && due.overdue;
    const priorityThreshold = t.priority === "high" ? 3 : 7;
    const stale = isOpen && t.status !== "planned" && lastActivityDays >= priorityThreshold;
    const noNextFlag = isOpen && t.status === "active" && !t.next_action;

    const reasons: { label: string; cls: string }[] = [];
    if (isOpen) {
      if (t.status === "blocked") reasons.push({ label: "Blocked, needs you", cls: "chip-red" });
      if (overdue) reasons.push({ label: due.label, cls: "chip-red" });
      if (
        t.status === "waiting" &&
        t.follow_up_on &&
        daysBetween(new Date(t.follow_up_on), today) <= 0
      )
        reasons.push({ label: "Follow up now", cls: "chip-amber" });
      if (stale) reasons.push({ label: `Stale ${lastActivityDays}d`, cls: "chip-amber" });
      if (noNextFlag) reasons.push({ label: "No next action", cls: "chip-amber" });
    }

    const rank =
      (t.status === "blocked" ? 0 : 10) +
      (overdue ? 0 : 3) +
      (reasons.length ? 0 : 50) +
      (t.status === "waiting" ? 1 : 0) +
      (stale ? 1 : 0);

    return {
      ...t,
      doer: t.doer_id ? peopleById.get(t.doer_id) || null : null,
      project: t.project_id ? projectsById.get(t.project_id) || null : null,
      category: t.category_id ? categoriesById.get(t.category_id) || null : null,
      due,
      isOpen,
      overdue,
      stale,
      noNextFlag,
      lastActivityDays,
      reasons,
      rank
    };
  });

  return {
    tasks: decorated,
    people: people || [],
    projects: projects || [],
    categories: categories || []
  };
}
