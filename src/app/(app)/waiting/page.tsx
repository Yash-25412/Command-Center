import Link from "next/link";
import { loadWorkspace } from "@/lib/workspace";
import { fmtDateWeekday } from "@/lib/format";
import { followUp, resumeFromWaiting } from "@/app/actions/tasks";

export const dynamic = "force-dynamic";

export default async function WaitingPage() {
  const { tasks } = await loadWorkspace();
  const openTasks = tasks.filter((t) => t.isOpen);

  const waiting = openTasks
    .filter((t) => t.status === "waiting")
    .sort((a, b) => (a.follow_up_on || "9999").localeCompare(b.follow_up_on || "9999"));
  const blocked = openTasks.filter((t) => t.status === "blocked");

  return (
    <div className="flex max-w-[960px] flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-serif text-[34px] font-medium tracking-tight">Waiting</h1>
        <p className="text-ink2">
          Where the ball is with someone else. Waiting means it's expected and you just need to
          nudge; blocked means you may need to step in.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink3">Waiting, {waiting.length}</h2>
        <div className="card overflow-hidden">
          {waiting.length === 0 && <div className="p-6 text-center text-ink2">You're not waiting on anyone. Nice.</div>}
          {waiting.map((t) => (
            <div key={t.id} className="row-hover flex items-center gap-3.5 border-t border-line px-4 py-3.5 first:border-t-0">
              <Link href={`/task/${t.id}`} className="min-w-0 flex-1">
                <div className="truncate font-medium">{t.title}</div>
                <div className="truncate text-[13px] text-ink2">
                  {t.waiting_on}
                  {t.waiting_since ? `, since ${fmtDateWeekday(t.waiting_since)}` : ""}
                </div>
              </Link>
              <span className="chip chip-amber">
                {t.follow_up_on ? `Follow up ${fmtDateWeekday(t.follow_up_on)}` : "No follow-up set"}
              </span>
              <form action={followUp}>
                <input type="hidden" name="taskId" value={t.id} />
                <input type="hidden" name="who" value={t.waiting_on || "them"} />
                <button className="btn btn-sm">Followed up, +2 days</button>
              </form>
              <form action={resumeFromWaiting}>
                <input type="hidden" name="taskId" value={t.id} />
                <input type="hidden" name="who" value={t.waiting_on || "them"} />
                <button className="btn btn-sm">Got it, resume</button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink3">Blocked, {blocked.length}</h2>
        <div className="card overflow-hidden">
          {blocked.length === 0 && <div className="p-6 text-center text-ink2">Nothing blocked.</div>}
          {blocked.map((t) => (
            <Link key={t.id} href={`/task/${t.id}`} className="row-hover flex items-center gap-3.5 border-t border-line px-4 py-3.5 first:border-t-0">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{t.title}</div>
                <div className="truncate text-[13px] text-ink2">{t.waiting_on}</div>
              </div>
              <span className="chip chip-red">Blocked</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
