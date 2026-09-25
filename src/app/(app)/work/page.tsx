import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import TaskRow, { RowTask } from "@/components/TaskRow";
import { STATUS_META, STATUS_ORDER } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function WorkPage({
  searchParams
}: {
  searchParams: { scope?: string; person?: string };
}) {
  const supabase = createClient();
  const scope = searchParams.scope || "all";
  const personFilter = searchParams.person;

  const [{ data: tasks }, { data: people }, { data: projects }] = await Promise.all([
    supabase
      .from("task")
      .select("id,title,status,priority,due_date,next_action,doer_id,project_id")
      .neq("status", "cancelled")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("person").select("id,name,is_me,hue"),
    supabase.from("project").select("id,name")
  ]);

  const peopleById = new Map((people || []).map((p) => [p.id, p]));
  const projectsById = new Map((projects || []).map((p) => [p.id, p]));
  const me = (people || []).find((p) => p.is_me);

  let rows: RowTask[] = (tasks || []).map((t) => {
    const p = t.doer_id ? peopleById.get(t.doer_id) : null;
    const pr = t.project_id ? projectsById.get(t.project_id) : null;
    return {
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      next_action: t.next_action || "",
      doerName: p?.name || "Unassigned",
      doerIsMe: !!p?.is_me,
      doerHue: p?.hue ?? 200,
      projectName: pr?.name || null,
      doerId: t.doer_id
    } as RowTask & { doerId: string | null };
  });

  if (scope === "me") rows = rows.filter((r: any) => r.doerIsMe);
  if (scope === "team") rows = rows.filter((r: any) => !r.doerIsMe);
  if (personFilter) rows = rows.filter((r: any) => r.doerId === personFilter);

  const groups = STATUS_ORDER.map((key) => ({
    key,
    meta: STATUS_META[key],
    items: rows.filter((r) => r.status === key)
  })).filter((g) => g.items.length > 0);

  function scopeHref(s: string) {
    const params = new URLSearchParams();
    if (s !== "all") params.set("scope", s);
    return `/work${params.toString() ? `?${params.toString()}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <h1 className="font-serif text-[34px] font-medium tracking-tight">Work</h1>
        <span className="text-ink3">{rows.length} item{rows.length === 1 ? "" : "s"}</span>
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
          .filter((p) => !p.is_me)
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
    </div>
  );
}
