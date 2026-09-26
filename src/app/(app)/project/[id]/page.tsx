import Link from "next/link";
import { notFound } from "next/navigation";
import { loadProjectDetail } from "@/lib/projects";
import { addMilestone, toggleMilestone } from "@/app/actions/projects";
import { fmtDate, fmtDateWeekday, initials } from "@/lib/format";

export const dynamic = "force-dynamic";

const HEALTH_CLS: Record<string, string> = { green: "chip-green", amber: "chip-amber", red: "chip-red" };

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const data = await loadProjectDetail(params.id);
  if (!data) notFound();
  const { project, health, pct, doneCount, taskCount, milestones, cols, journey, decisions, lastEntry } = data;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/projects" className="inline-flex w-fit items-center gap-1.5 font-medium text-ink2">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7}>
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Projects
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-[36px] font-medium tracking-tight">{project.name}</h1>
          <span className={`chip ${HEALTH_CLS[health.color]}`}>{health.label}</span>
        </div>
        {project.objective && <p className="max-w-[760px] text-[15px] leading-relaxed text-ink2">{project.objective}</p>}
      </div>

      <div className="card grid grid-cols-[1.6fr_1fr] gap-8 p-5">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink3">Where we are</span>
          <span className="font-serif text-[20px] leading-snug tracking-tight">
            {lastEntry ? lastEntry.body : "No updates logged yet — add one from any of this project's tasks."}
          </span>
        </div>
        <div className="flex flex-col justify-center gap-2.5">
          <div className="flex justify-between text-[13px] text-ink2">
            <span>
              {doneCount} of {taskCount} tasks done
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-sunk">
            <div className="h-full rounded-full bg-green" style={{ width: `${pct}%` }} />
          </div>
          {project.target_date && <span className="text-[13px] text-ink2">Target {fmtDate(project.target_date)}</span>}
        </div>
      </div>

      <div className="grid grid-cols-3 items-start gap-4">
        {cols.map((col) => (
          <div key={col.key} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: col.color }} />
              <span className="font-semibold">{col.label}</span>
              <span className="text-ink3">{col.items.length}</span>
            </div>
            <div className="card overflow-hidden">
              {col.items.map((t) => (
                <Link key={t.id} href={`/task/${t.id}`} className="row-hover flex items-center gap-2.5 border-t border-line px-3.5 py-2.5 first:border-t-0">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium">{t.title}</div>
                    <div className="truncate text-xs text-ink3">{t.next_action || t.doer?.name || "Unassigned"}</div>
                  </div>
                </Link>
              ))}
              {col.items.length === 0 && <div className="p-3.5 text-[13px] text-ink3">{col.emptyMsg}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_1.5fr] items-start gap-6">
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink3">Milestones</h2>
            <div className="card overflow-hidden">
              {milestones.map((m) => {
                const overdue = !m.done_at && m.date && m.date < new Date().toISOString().slice(0, 10);
                return (
                  <div key={m.id} className="row-hover flex items-center gap-2.5 border-t border-line px-3.5 py-2.5 first:border-t-0">
                    <form action={toggleMilestone}>
                      <input type="hidden" name="milestoneId" value={m.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="done" value={String(!!m.done_at)} />
                      <button
                        type="submit"
                        className="flex h-5 w-5 items-center justify-center rounded-full"
                        style={{ background: m.done_at ? "var(--green-bg)" : "var(--sunk)", color: m.done_at ? "var(--green)" : "var(--ink3)" }}
                        title={m.done_at ? "Mark not done" : "Mark done"}
                      >
                        {m.done_at ? "✓" : ""}
                      </button>
                    </form>
                    <span className="min-w-0 flex-1 truncate">{m.name}</span>
                    <span className={`text-[13px] ${overdue ? "text-red" : "text-ink2"}`}>{m.date ? fmtDate(m.date) : ""}</span>
                  </div>
                );
              })}
              {milestones.length === 0 && <div className="p-3.5 text-[13px] text-ink3">No milestones yet.</div>}
              <form action={addMilestone} className="flex items-center gap-2 border-t border-line px-3.5 py-2.5">
                <input type="hidden" name="projectId" value={project.id} />
                <input name="name" placeholder="Add a milestone" className="field field-sm h-8 flex-1 text-[13.5px]" />
                <input name="date" type="date" className="field field-sm h-8 w-[150px] text-[13.5px]" />
                <button className="btn btn-sm">Add</button>
              </form>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink3">Decisions</h2>
            <div className="card overflow-hidden">
              {decisions.map((e: any) => (
                <div key={e.id} className="flex flex-col gap-1 border-t border-line px-3.5 py-3 first:border-t-0">
                  <span className="text-xs text-ink3">
                    {fmtDate(e.occurred_at.slice(0, 10))}, {e.task?.title}
                  </span>
                  <span className="font-medium leading-snug">{e.body}</span>
                  {e.reason && <span className="text-[13px] leading-relaxed text-ink2">Why: {e.reason}</span>}
                </div>
              ))}
              {decisions.length === 0 && (
                <div className="p-3.5 text-[13px] text-ink3">No decisions logged yet — use the Decision type on a task's Journey.</div>
              )}
            </div>
          </section>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink3">Journey, all tasks merged</h2>
          <div className="card overflow-hidden">
            {journey.map((e: any) => (
              <Link
                key={e.id}
                href={`/task/${e.task_id}`}
                className="row-hover flex gap-3.5 border-t border-line px-4 py-3 first:border-t-0"
              >
                <span className="w-16 flex-none pt-0.5 text-[13px] text-ink3">{fmtDateWeekday(e.occurred_at.slice(0, 10))}</span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="leading-relaxed">{e.body}</span>
                  <span className="truncate text-xs text-ink3">
                    {e.kind}, {e.task?.title}
                  </span>
                </div>
              </Link>
            ))}
            {journey.length === 0 && <div className="p-5 text-ink2">No journey entries yet.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
