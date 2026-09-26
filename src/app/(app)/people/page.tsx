import Link from "next/link";
import { loadWorkspace } from "@/lib/workspace";
import { fmtDate, initials } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const { tasks, people } = await loadWorkspace();
  const team = people.filter((p) => !p.is_me);
  const openTasks = tasks.filter((t) => t.isOpen);

  const rows = team.map((p) => {
    const mine = openTasks.filter((t) => t.doer_id === p.id);
    const done = tasks.filter((t) => t.doer_id === p.id && t.status === "done");
    const overdue = mine.filter((t) => t.overdue).length;
    const blocked = mine.filter((t) => t.status === "blocked").length;
    const waiting = mine.filter((t) => t.status === "waiting").length;
    const top = mine.slice().sort((a, b) => a.rank - b.rank).slice(0, 4);
    return { person: p, mine, done, overdue, blocked, waiting, top };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-serif text-[34px] font-medium tracking-tight">People</h1>
        <p className="text-ink2">
          Visibility, not assignment. Nobody here gets notified — this is just your view of who's
          carrying what.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {rows.map((row) => (
          <div key={row.person.id} className="card flex flex-col gap-3.5 p-5">
            <div className="flex items-center gap-3">
              <span
                className="avatar h-10 w-10 text-sm"
                style={{ background: `hsl(${row.person.hue} 30% 88%)`, color: `hsl(${row.person.hue} 35% 32%)` }}
              >
                {initials(row.person.name)}
              </span>
              <div>
                <div className="font-semibold">{row.person.name}</div>
                <div className="text-[13px] text-ink3">
                  {row.mine.length} open, {row.done.length} done total
                </div>
              </div>
            </div>

            <div className="flex min-h-[22px] flex-wrap gap-1.5">
              {row.overdue > 0 && <span className="chip chip-red">{row.overdue} overdue</span>}
              {row.blocked > 0 && <span className="chip chip-red">{row.blocked} blocked</span>}
              {row.waiting > 0 && <span className="chip chip-amber">{row.waiting} waiting</span>}
              {row.overdue + row.blocked + row.waiting === 0 && <span className="chip chip-green">Clear</span>}
            </div>

            <div className="flex flex-col border-t border-line">
              {row.top.length === 0 && <div className="py-2.5 text-[13px] text-ink3">Nothing open right now.</div>}
              {row.top.map((t) => (
                <Link key={t.id} href={`/task/${t.id}`} className="row-hover flex items-center gap-2.5 py-2 text-[13.5px]">
                  <span
                    className="h-[7px] w-[7px] flex-none rounded-full"
                    style={{ background: t.status === "blocked" ? "var(--red)" : t.status === "waiting" ? "var(--amber)" : "var(--accent)" }}
                  />
                  <span className="min-w-0 flex-1 truncate">{t.title}</span>
                  <span className="text-xs text-ink3">{fmtDate(t.due_date)}</span>
                </Link>
              ))}
            </div>

            <Link href={`/work?person=${row.person.id}`} className="btn btn-sm w-fit">
              View all work
            </Link>
          </div>
        ))}
        {rows.length === 0 && <div className="card col-span-3 p-10 text-center text-ink2">No team members yet.</div>}
      </div>
    </div>
  );
}
