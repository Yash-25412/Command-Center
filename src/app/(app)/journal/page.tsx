import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, fmtDateWeekday } from "@/lib/format";

export const dynamic = "force-dynamic";

const KIND_META: Record<string, { label: string; cls: string }> = {
  update: { label: "Update", cls: "chip-gray" },
  meeting: { label: "Meeting", cls: "chip-accent" },
  decision: { label: "Decision", cls: "chip-teal" },
  status: { label: "Status", cls: "chip-gray" },
  system: { label: "Created", cls: "chip-gray" }
};

export default async function JournalPage({ searchParams }: { searchParams: { kind?: string } }) {
  const supabase = createClient();
  const activeKind = searchParams?.kind || "all";

  let query = supabase
    .from("entry")
    .select("*, task:task_id(id,title,project_id)")
    .order("occurred_at", { ascending: false })
    .limit(150);

  if (activeKind !== "all") query = query.eq("kind", activeKind);

  const [{ data: entries }, { data: projects }] = await Promise.all([
    query,
    supabase.from("project").select("id,name")
  ]);

  const projectsById = new Map((projects || []).map((p) => [p.id, p]));

  const filters = [
    { key: "all", label: "Everything" },
    { key: "decision", label: "Decisions" },
    { key: "meeting", label: "Meetings" },
    { key: "update", label: "Updates" }
  ];

  const grouped = new Map<string, typeof entries>();
  for (const e of entries || []) {
    const day = e.occurred_at.slice(0, 10);
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day)!.push(e);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-serif text-[34px] font-medium tracking-tight">Journal</h1>
        <p className="text-ink2">Every update, meeting note and decision, across every task, in one feed.</p>
      </div>

      <div className="flex gap-1.5">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/journal" : `/journal?kind=${f.key}`}
            className={`h-8 rounded-full border px-3.5 text-[13px] font-medium leading-8 ${
              activeKind === f.key ? "border-transparent bg-ink text-bg" : "border-line2 text-ink2 hover:bg-hover"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-5">
        {[...grouped.entries()].map(([day, dayEntries]) => (
          <section key={day} className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink3">{fmtDateWeekday(day)}</h2>
            <div className="card overflow-hidden">
              {(dayEntries || []).map((e: any) => {
                const meta = KIND_META[e.kind] || KIND_META.update;
                const project = e.task?.project_id ? projectsById.get(e.task.project_id) : null;
                return (
                  <Link
                    key={e.id}
                    href={e.task ? `/task/${e.task.id}` : "#"}
                    className="row-hover flex gap-3.5 border-t border-line px-4 py-3 first:border-t-0"
                  >
                    <span className={`chip ${meta.cls} mt-0.5 flex-none`}>{meta.label}</span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="leading-relaxed">
                        {e.kind === "status" ? `Status changed from ${e.status_from} to ${e.status_to}` : e.body || "Task created."}
                      </span>
                      <span className="truncate text-xs text-ink3">
                        {e.task?.title}
                        {project ? `, ${project.name}` : ""}
                      </span>
                      {e.reason && <span className="text-[13px] text-ink2">Why: {e.reason}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
        {(entries || []).length === 0 && <div className="card p-10 text-center text-ink2">Nothing here yet.</div>}
      </div>
    </div>
  );
}
