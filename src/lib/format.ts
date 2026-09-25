export const STATUS_META: Record<string, { label: string; className: string }> = {
  planned: { label: "Planned", className: "chip-gray" },
  active: { label: "Active", className: "chip-accent" },
  waiting: { label: "Waiting", className: "chip-amber" },
  blocked: { label: "Blocked", className: "chip-red" },
  review: { label: "Review", className: "chip-teal" },
  done: { label: "Done", className: "chip-green" },
  cancelled: { label: "Cancelled", className: "chip-gray" }
};

export const STATUS_ORDER = ["blocked", "active", "waiting", "review", "planned", "done"];

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d + (d.length === 10 ? "T00:00:00" : ""));
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export function fmtDateWeekday(d: string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d + (d.length === 10 ? "T00:00:00" : ""));
  return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
}

export function daysBetween(a: Date, b: Date): number {
  const ms = new Date(a.toDateString()).getTime() - new Date(b.toDateString()).getTime();
  return Math.round(ms / 86400000);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dueLabel(due: string | null): { label: string; overdue: boolean; cls: string } {
  if (!due) return { label: "No date", overdue: false, cls: "chip-gray" };
  const today = new Date();
  const d = new Date(due + "T00:00:00");
  const diff = daysBetween(d, today);
  if (diff < 0) return { label: `${-diff}d late`, overdue: true, cls: "chip-red" };
  if (diff === 0) return { label: "Today", overdue: false, cls: "chip-amber" };
  if (diff === 1) return { label: "Tomorrow", overdue: false, cls: "chip-amber" };
  return { label: fmtDateWeekday(due), overdue: false, cls: "chip-gray" };
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Very small natural-language parser for Quick Add.
// "Rahul: reconcile March revenue by fri #revenue !high"
export function parseQuickAdd(raw: string, peopleNames: string[]) {
  let s = raw;
  let doerName: string | null = null;
  let priority: "high" | "med" | "low" = "med";
  let dueDate: string | null = null;
  let categoryName: string | null = null;

  const doerMatch = s.match(/^\s*([A-Za-z]+)\s*:\s*/);
  if (doerMatch) {
    const name = doerMatch[1];
    if (peopleNames.some((n) => n.toLowerCase() === name.toLowerCase())) {
      doerName = name;
      s = s.slice(doerMatch[0].length);
    }
  }

  const catMatch = s.match(/#(\w+)/);
  if (catMatch) {
    categoryName = catMatch[1];
    s = s.replace(catMatch[0], "");
  }

  const prMatch = s.match(/!(high|med|low)/i);
  if (prMatch) {
    priority = prMatch[1].toLowerCase() as "high" | "med" | "low";
    s = s.replace(prMatch[0], "");
  }

  const dueMatch = s.match(
    /\bby\s+(today|tomorrow|next week|mon\w*|tue\w*|wed\w*|thu\w*|fri\w*|sat\w*|sun\w*)/i
  );
  if (dueMatch) {
    dueDate = resolveDay(dueMatch[1]);
    s = s.replace(dueMatch[0], "");
  }

  return {
    title: s.replace(/\s+/g, " ").trim(),
    doerName,
    priority,
    dueDate,
    categoryName
  };
}

function resolveDay(word: string): string {
  const w = word.toLowerCase();
  const today = new Date();
  const wd = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  let offset = 0;
  if (w === "today") offset = 0;
  else if (w === "tomorrow") offset = 1;
  else if (w.startsWith("next")) offset = 7;
  else {
    const i = wd.indexOf(w.slice(0, 3));
    if (i >= 0) {
      offset = (i - today.getDay() + 7) % 7;
      if (offset === 0) offset = 7;
    }
  }
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
