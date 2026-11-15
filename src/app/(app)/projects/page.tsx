import Link from "next/link";
import { loadAdhoc, loadProjects } from "@/lib/projects";
import { createProject } from "@/app/actions/projects";

export const dynamic = "force-dynamic";

const HEALTH: Record<string, { cls: string; stroke: string }> = {
  green: { cls: "border-green text-green", stroke: "var(--green)" },
  amber: { cls: "border-amber text-amber", stroke: "var(--amber)" },
  red: { cls: "border-red text-red", stroke: "var(--red)" }
};
const C = 2 * Math.PI * 34;

function Ring({ pct, stroke, text }: { pct: number; stroke: string; text: string }) {
  return (
    <svg aria-hidden="true" width="62" height="62" viewBox="0 0 80 80" className="flex-none">
      <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
      <circle cx="40" cy="40" r="34" fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(C * pct) / 100} ${C}`} transform="rotate(-90 40 40)" />
      <text x="40" y="45" textAnchor="middle" fill="#e9ecef" fontFamily="var(--font-mono)" fontSize="15">
        {text}
      </text>
    </svg>
  );
}

export default async function ProjectsPage() {
  const [rows, adhoc] = await Promise.all([loadProjects(), loadAdhoc()]);
  const adhocPct = adhoc.tasks.length ? Math.round((adhoc.done.length / adhoc.tasks.length) * 100) : 0;

  return (
    <div className="rise flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="eyebrow">Constellation</span>
          <h1 className="text-[clamp(30px,3.8vw,52px)] font-light leading-none tracking-[-0.03em]">Where the work lives.</h1>
          <p className="text-ink2">
            Every task belongs somewhere. Anything without a project falls into <span className="text-accent">Ad Hoc</span>.
          </p>
        </div>
        <details className="relative">
          <summary className="btn btn-pri cursor-pointer list-none">+ New project</summary>
          <form action={createProject} className="glass absolute right-0 top-12 z-10 flex w-[340px] flex-col gap-2.5 rounded-[20px] p-4" style={{ background: "rgba(14,16,19,0.94)" }}>
            <input name="name" required placeholder="Project name" aria-label="Project name" className="field h-10" />
            <textarea name="objective" placeholder="Objective (optional)" aria-label="Objective" rows={2} className="field resize-none" />
            <button type="submit" className="btn btn-pri justify-center">
              Create
            </button>
          </form>
        </details>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
        <Link
          href="/project/adhoc"
          className="glass col-card flex flex-col gap-4 rounded-[24px] p-[22px]"
          style={{ borderStyle: "dashed", borderColor: "rgba(220,232,239,0.35)" }}
        >
          <div className="flex items-center gap-4">
            <Ring pct={adhocPct} stroke="var(--accent)" text={String(adhoc.open.length)} />
            <div className="flex min-w-0 flex-col gap-1">
              <span className="font-mono text-[10.5px] tracking-[0.16em] text-ink3">AD HOC · ROLLING</span>
              <span className="text-[20px] leading-tight">Ad Hoc</span>
            </div>
          </div>
          <span className="text-[13px] leading-relaxed text-ink2">
            Default home for tasks without a project — from Capture, the inbox, or anything you haven’t mapped yet.
          </span>
          <div className="flex flex-wrap gap-2 text-[11.5px]">
            <span className="text-ink3">{adhoc.open.length} open</span>
            {adhoc.overdue > 0 && <span className="text-red">· {adhoc.overdue} overdue</span>}
            {adhoc.blocked > 0 && <span className="text-red">· {adhoc.blocked} blocked</span>}
            {adhoc.stale > 0 && <span className="text-amber">· {adhoc.stale} stale</span>}
          </div>
        </Link>

        {rows.map((r) => {
          const h = HEALTH[r.health.color];
          return (
            <Link key={r.project.id} href={`/project/${r.project.id}`} className="glass col-card flex flex-col gap-4 rounded-[24px] p-[22px]">
              <div className="flex items-center gap-4">
                <Ring pct={r.pct} stroke={h.stroke} text={`${r.pct}%`} />
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="font-mono text-[10.5px] tracking-[0.16em] text-ink3">
                    {r.project.name.split(/\s+/)[0].slice(0, 6).toUpperCase()}
                    {r.project.target_date ? ` · ${r.project.target_date}` : ""}
                  </span>
                  <span className="text-[20px] leading-tight">{r.project.name}</span>
                </div>
              </div>
              {r.project.objective && <span className="text-[13px] leading-relaxed text-ink2">{r.project.objective}</span>}
              <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
                <span className={`rounded-full border px-2.5 py-0.5 ${h.cls}`} title={r.health.why}>
                  {r.health.label}
                </span>
                <span className="text-ink3">
                  {r.doneCount} of {r.taskCount} closed
                </span>
                {r.overdue > 0 && <span className="text-red">· {r.overdue} overdue</span>}
                {r.blocked > 0 && <span className="text-red">· {r.blocked} blocked</span>}
                {r.stale > 0 && <span className="text-amber">· {r.stale} stale</span>}
              </div>
              <div className="flex flex-col gap-0.5 border-t border-[var(--glass-line)] pt-3 text-[12.5px]">
                <span className="text-ink2">
                  Next milestone · <span className="text-ink">{r.nextMsLabel}</span>
                </span>
                <span className="text-ink3">Last update {r.lastActivityLabel}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
