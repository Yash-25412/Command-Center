import Link from "next/link";
import { loadProjects } from "@/lib/projects";
import { createProject } from "@/app/actions/projects";

export const dynamic = "force-dynamic";

const HEALTH_CLS: Record<string, string> = { green: "chip-green", amber: "chip-amber", red: "chip-red" };

export default async function ProjectsPage() {
  const rows = await loadProjects();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-serif text-[34px] font-medium tracking-tight">Projects</h1>
          <p className="text-ink2">Each project answers one question first: where are we?</p>
        </div>
        <details className="relative">
          <summary className="btn btn-pri cursor-pointer list-none">+ New project</summary>
          <form action={createProject} className="card absolute right-0 top-11 z-10 flex w-[340px] flex-col gap-2.5 p-4 shadow-lg">
            <input name="name" required placeholder="Project name" className="field h-10" />
            <textarea name="objective" placeholder="Objective (optional)" rows={2} className="field resize-none" />
            <button type="submit" className="btn btn-pri justify-center">
              Create
            </button>
          </form>
        </details>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {rows.map((r) => (
          <Link key={r.project.id} href={`/project/${r.project.id}`} className="card lift flex flex-col gap-3.5 p-5 hover:border-line2">
            <div className="flex items-center gap-2.5">
              <span className="font-serif flex-1 text-[22px] font-medium tracking-tight">{r.project.name}</span>
              <span className={`chip ${HEALTH_CLS[r.health.color]}`}>{r.health.label}</span>
            </div>
            {r.project.objective && <p className="text-ink2">{r.project.objective}</p>}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[13px] text-ink2">
                <span>
                  {r.doneCount} of {r.taskCount} tasks done
                </span>
                <span>{r.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-sunk">
                <div className="h-full rounded-full bg-green" style={{ width: `${r.pct}%` }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="chip">{r.openCount} open</span>
              {r.blocked > 0 && <span className="chip chip-red">{r.blocked} blocked</span>}
              {r.overdue > 0 && <span className="chip chip-red">{r.overdue} overdue</span>}
              {r.stale > 0 && <span className="chip chip-amber">{r.stale} stale</span>}
            </div>
            <div className="flex flex-col gap-0.5 border-t border-line pt-3 text-[13px]">
              <span className="text-ink2">
                Next milestone: <span className="font-medium text-ink">{r.nextMsLabel}</span>
              </span>
              <span className="text-ink3">Last update: {r.lastActivityLabel}</span>
            </div>
          </Link>
        ))}
        {rows.length === 0 && <div className="card col-span-2 p-10 text-center text-ink2">No projects yet. Create one to get started.</div>}
      </div>
    </div>
  );
}
