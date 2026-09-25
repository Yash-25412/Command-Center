import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import JourneyComposer from "@/components/JourneyComposer";
import { changeStatus, followUp, resumeFromWaiting } from "@/app/actions/tasks";
import { STATUS_META, dueLabel, fmtDateWeekday, initials } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_PICKS = ["planned", "active", "waiting", "blocked", "review", "done"];

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: task }, { data: entries }, { data: links }, { data: people }, { data: projects }, { data: categories }] =
    await Promise.all([
      supabase.from("task").select("*").eq("id", params.id).maybeSingle(),
      supabase.from("entry").select("*").eq("task_id", params.id).order("occurred_at", { ascending: false }),
      supabase.from("link").select("*").eq("task_id", params.id),
      supabase.from("person").select("id,name,is_me,hue"),
      supabase.from("project").select("id,name"),
      supabase.from("category").select("id,name")
    ]);

  if (!task) notFound();

  const doer = people?.find((p) => p.id === task.doer_id);
  const project = projects?.find((p) => p.id === task.project_id);
  const category = categories?.find((c) => c.id === task.category_id);
  const due = dueLabel(task.due_date);
  const status = STATUS_META[task.status];

  return (
    <div className="flex flex-col gap-5">
      <Link href="/work" className="inline-flex items-center gap-1.5 font-medium text-ink2">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7}>
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Work
      </Link>

      <div className="grid grid-cols-[minmax(0,1fr)_260px] items-start gap-10">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-col gap-3">
            <h1 className="font-serif text-[32px] font-medium leading-tight tracking-tight">{task.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`chip ${status.className}`}>{status.label}</span>
              {task.priority === "high" && <span className="chip chip-red">High priority</span>}
              <span className="chip">{doer ? (doer.is_me ? "Me (doer)" : doer.name) : "Unassigned"}</span>
              <span className={`chip ${due.cls}`}>{due.label}</span>
              {category && <span className="chip">{category.name}</span>}
            </div>
          </div>

          <div className="card flex flex-col gap-1.5 border-accent p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-accent">Next action</span>
            {task.next_action ? (
              <span className="text-[16px] font-medium leading-snug">{task.next_action}</span>
            ) : (
              <span className="text-amber">No next action yet. What is the very next concrete step?</span>
            )}
          </div>

          {task.status === "waiting" && (
            <div className="card flex flex-col gap-2.5 border-transparent bg-amberbg p-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-amber">Waiting for</span>
              <span className="font-medium">
                {task.waiting_on}
                {task.waiting_since ? `, since ${fmtDateWeekday(task.waiting_since)}` : ""}
                {task.expected_by ? `, expected ${fmtDateWeekday(task.expected_by)}` : ""}
              </span>
              <div className="flex gap-2">
                <form action={followUp}>
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="who" value={task.waiting_on || "them"} />
                  <button className="btn btn-sm">Followed up, +2 days</button>
                </form>
                <form action={resumeFromWaiting}>
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="who" value={task.waiting_on || "them"} />
                  <button className="btn btn-sm">Got it, resume</button>
                </form>
              </div>
            </div>
          )}

          {task.status === "blocked" && (
            <div className="card flex flex-col gap-1.5 border-transparent bg-redbg p-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-red">Blocked by</span>
              <span className="font-medium">{task.waiting_on}</span>
            </div>
          )}

          {task.description && (
            <section className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink3">Context</h2>
              <p className="max-w-[680px] leading-relaxed">{task.description}</p>
            </section>
          )}

          {links && links.length > 0 && (
            <section className="flex flex-col gap-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink3">Links</h2>
              <div className="grid grid-cols-3 gap-2.5">
                {links.map((l) => (
                  <a
                    key={l.id}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="card flex items-center gap-2.5 p-3 hover:border-line2"
                  >
                    <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[9px] bg-sunk text-xs font-semibold text-ink2">
                      {l.type?.slice(0, 2) || "Lk"}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-medium">{l.title}</span>
                      <span className="block truncate text-xs text-ink3">{l.type}</span>
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-3.5">
            <div className="flex items-baseline gap-2.5">
              <h2 className="font-serif text-[22px] font-medium tracking-tight">Journey</h2>
              <span className="text-xs text-ink3">{entries?.length || 0} entries, newest first</span>
            </div>

            <JourneyComposer taskId={task.id} />

            <div className="ml-1.5 flex flex-col gap-5 border-l border-line2 pl-5">
              {(entries || []).map((e) => (
                <div key={e.id} className="relative flex flex-col gap-1">
                  <span className="absolute -left-[26px] top-[5px] h-[11px] w-[11px] rounded-full border-2 border-bg bg-line2" />
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold">{fmtDateWeekday(e.occurred_at.slice(0, 10))}</span>
                    <span className="chip">
                      {e.kind === "status"
                        ? "Status"
                        : e.kind === "system"
                        ? "Created"
                        : e.kind.charAt(0).toUpperCase() + e.kind.slice(1)}
                    </span>
                  </div>
                  <p className="max-w-[680px] leading-relaxed">
                    {e.kind === "status" ? `Status changed from ${e.status_from} to ${e.status_to}` : e.body}
                  </p>
                  {e.reason && (
                    <p className="max-w-[680px] rounded-[9px] bg-sunk px-3 py-2 text-[13.5px] text-ink2">
                      Why: {e.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-5">
          <div className="card px-4 py-1">
            <Row label="Doer" value={doer ? (doer.is_me ? "Me" : doer.name) : "Unassigned"} />
            <Row label="Project" value={project?.name || "None"} />
            <Row label="Category" value={category?.name || "None"} />
            <Row label="Priority" value={task.priority === "high" ? "High" : task.priority === "low" ? "Low" : "Medium"} />
            <Row label="Due" value={due.label} last />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink3">Change status</span>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_PICKS.map((s) => {
                const meta = STATUS_META[s];
                const on = task.status === s;
                return (
                  <form action={changeStatus} key={s}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <input type="hidden" name="from" value={task.status} />
                    <input type="hidden" name="to" value={s} />
                    <button
                      className={`h-7 rounded-full border px-3 text-[13px] font-medium ${
                        on ? "border-transparent bg-ink text-bg" : "border-line2 text-ink2 hover:bg-hover"
                      }`}
                    >
                      {meta.label}
                    </button>
                  </form>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${last ? "" : "border-b border-line"}`}>
      <span className="text-[13px] text-ink3">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
