import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import TaskRow, { RowTask } from "@/components/TaskRow";
import { STATUS_META, STATUS_ORDER } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function WorkPage({
  searchParams
}: {
  searchParams: { scope?: string; person?: string; q?: string; view?: string };
}) {
  const supabase = createClient();
  const scope = searchParams.scope || "all";
  const personFilter = searchParams.person;
  const q = (searchParams.q || "").trim().toLowerCase();
  const view = searchParams.view === "board" ? "board" : "list";

  const [{ data: tasks }, { data: people }, { data: projects }, { data: assigneeRows }] = await Promise.all([
    supabase
      .from("task")
      .select("id,title,status,priority,due_date,next_action,doer_id,project_id,description")
      .neq("status", "cancelled")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("person").select("id,name,is_me,hue,active"),
    supabase.from("project").select("id,name"),
    supabase.from("task_assignee").select("task_id,person_id")
  ]);

  const peopleById = new Map((people || []).map((p) => [p.id, p]));
  const projectsById = new Map((projects || []).map((p) => [p.id, p]));
  const me = (people || []).find((p) => p.is_me);

  const assigneeIdsByTask = new Map<string, string[]>();
  (assigneeRows || []).forEach((r) => {
    const list = assigneeIdsByTask.get(r.task_id) || [];
    list.push(r.person_id);
    assigneeIdsByTask.set(r.task_id, list);
  });

  let rows: RowTask[] = (tasks || []).map((t) => {
    const assignedIds = assigneeIdsByTask.get(t.id) || (t.doer_id ? [t.doer_id] : []);
    const assignedPeople = assignedIds.map((id) => peopleById.get(id)).filter((p): p is NonNullable<typeof p> => !!p);
    const pr = t.project_id ? projectsById.get(t.project_id) : null;
    const first = assignedPeople[0];
    return {
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      next_action: t.next_action || "",
      doerName: first?.name || "Unassigned",
      doerIsMe: !!first?.is_me,
      doerHue: first?.hue ?? 200,
      projectName: pr?.name || null,
      assignees: assignedPeople.map((p) => ({ id: p.id, name: p.name, is_me: p.is_me, hue: p.hue })),
      doerId: t.doer_id,
      assigneeIds: assignedIds
    } as RowTask & { doerId: string | null; assigneeIds: string[] };
  });

  if (scope === "me") rows = rows.filter((r: any) => r.assignees.some((a: any) => a.is_me));
  if (scope === "team") rows = rows.filter((r: any) => !r.assignees.some((a: any) => a.is_me));
  if (personFilter) rows = rows.filter((r: any) => r.assigneeIds.includes(personFilter));
  if (q) rows = rows.filter((r: any) => r.title.toLowerCase().includes(q) || r.next_action.toLowerCase().includes(q));

  const groups = STATUS_ORDER.map((key) => ({
    key,
    meta: STATUS_META[key],
    items: rows.filter((r) => r.status === key)
  })).filter((g) => g.items.length > 0);

  function scopeHref(s: string) {
    const params = new URLSearchParams();
    if (s !== "all") params.set("scope", s);
    if (q) params.set("q", q);
    if (view === "board") params.set("view", "board");
    return `/work${params.toString() ? `?${params.toString()}` : ""}`;
  }

  function viewHref(v: string) {
    const params = new URLSearchParams();
    if (scope !== "all") params.set("scope", scope);
    if (personFilter) params.set("person", personFilter);
    if (q) params.set("q", q);
    if (v === "board") params.set("view", "board");
    return `/work${params.toString() ? `?${params.toString()}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <h1 className="font-serif text-[34px] font-medium tracking-tight">Work</h1>
        <span className="text-ink3">{rows.length} item{rows.length === 1 ? "" : "s"}</span>
        <form action="/work" className="ml-auto flex items-center gap-2">
          {scope !== "all" && <input type="hidden" name="scope" value={scope} />}
          {view === "board" && <input type="hidden" name="view" value="board" />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search title or next action..."
            className="field field-sm h-8 w-[220px] text-[13.5px]"
          />
        </form>
        <div className="inline-flex gap-0.5 rounded-[10px] bg-sunk p-[3px]">
          <Link href={viewHref("list")} className={`h-7 rounded-[7px] px-3 text-[13px] font-medium leading-7 ${view === "list" ? "bg-surface text-ink shadow-sm" : "text-ink2"}`}>
            List
          </Link>
          <Link href={viewHref("board")} className={`h-7 rounded-[7px] px-3 text-[13px] font-medium leading-7 ${view === "board" ? "bg-surface text-ink shadow-sm" : "text-ink2"}`}>
            Board
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(["all", "me", "team"] as const).map((s) => (
          <Link
            key={s}
            href={scopeHref(s)}
            className={`h-7 rounded-full border px-3 text-[13px] font-medium ${
              scope === s && !personFilter
                ? "border-transparent bg-ink text-bg"
                : "border-line2 text-ink2 hover:bg-hover"
            }`}
          >
            {s === "all" ? "All" : s === "me" ? "Me" : "Team"}
          </Link>
        ))}
        <span className="mx-1 h-5 w-px bg-line2" />
        {(people || [])
          .filter((p) => !p.is_me && p.active)
          .map((p) => (
            <Link
              key={p.id}
              href={`/work?person=${p.id}`}
              className={`h-7 rounded-full border px-3 text-[13px] font-medium ${
                personFilter === p.id ? "border-transparent bg-ink text-bg" : "border-line2 text-ink2 hover:bg-hover"
              }`}
            >
              {p.name}
            </Link>
          ))}
      </div>

      {view === "list" ? (
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <section key={g.key} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{g.meta.label}</span>
                <span className="text-ink3">{g.items.length}</span>
              </div>
              <div className="card overflow-hidden">
                {g.items.map((t) => (
                  <TaskRow key={t.id} t={t} />
                ))}
              </div>
            </section>
          ))}
          {rows.length === 0 && (
            <div className="card p-10 text-center text-ink2">Nothing matches these filters.</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-6 items-start gap-3">
          {STATUS_ORDER.map((key) => {
            const meta = STATUS_META[key];
            const items = rows.filter((r) => r.status === key);
            return (
              <div key={key} className="flex min-w-0 flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <span className={`chip ${meta.className}`}>{meta.label}</span>
                  <span className="text-xs text-ink3">{items.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((t) => (
                    <Link key={t.id} href={`/task/${t.id}`} className="card lift flex flex-col gap-1.5 p-3 hover:border-line2">
                      <span className="line-clamp-2 text-[13.5px] font-medium leading-snug">{t.title}</span>
                      <div className="flex items-center justify-between text-xs text-ink3">
                        <span className="truncate">
                          {(t as any).projectName || (t.assignees.length ? t.assignees.map((a) => a.name).join(", ") : "Unassigned")}
                        </span>
                        {t.priority === "high" && <span className="chip chip-red flex-none">High</span>}
                      </div>
                    </Link>
                  ))}
                  {items.length === 0 && <div className="card p-3 text-center text-xs text-ink3">Empty</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
