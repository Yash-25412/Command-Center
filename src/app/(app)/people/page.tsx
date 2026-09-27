import Link from "next/link";
import { loadWorkspace } from "@/lib/workspace";
import { addPerson, renamePerson, setPersonActive } from "@/app/actions/people";
import { fmtDate, initials } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const { tasks, people } = await loadWorkspace();
  const team = people.filter((p) => !p.is_me && p.active);
  const everyone = people.filter((p) => !p.is_me);
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

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink3">Manage team</h2>
        <div className="card overflow-hidden">
          {everyone.map((p) => (
            <div key={p.id} className="flex items-center gap-2.5 border-t border-line px-4 py-2.5 first:border-t-0">
              <span
                className="avatar h-8 w-8 flex-none text-xs"
                style={{ background: `hsl(${p.hue} 30% 88%)`, color: `hsl(${p.hue} 35% 32%)`, opacity: p.active ? 1 : 0.5 }}
              >
                {initials(p.name)}
              </span>
              <form action={renamePerson} className="flex flex-1 items-center gap-2">
                <input type="hidden" name="personId" value={p.id} />
                <input
                  name="name"
                  defaultValue={p.name}
                  className="field field-sm h-8 flex-1 text-[13.5px]"
                  style={p.active ? undefined : { opacity: 0.6 }}
                />
                <input
                  name="role"
                  defaultValue={p.role || ""}
                  placeholder="Role (optional)"
                  className="field field-sm h-8 w-[160px] text-[13.5px]"
                />
                <button type="submit" className="btn btn-sm">
                  Save
                </button>
              </form>
              <form action={setPersonActive}>
                <input type="hidden" name="personId" value={p.id} />
                <input type="hidden" name="active" value={String(!p.active)} />
                <button type="submit" className={`btn btn-sm ${p.active ? "" : "btn-pri"}`}>
                  {p.active ? "Remove" : "Restore"}
                </button>
              </form>
            </div>
          ))}
          {everyone.length === 0 && <div className="p-3.5 text-[13px] text-ink3">Nobody added yet.</div>}
        </div>
        <form action={addPerson} className="card flex items-center gap-2 p-2.5">
          <input name="name" placeholder="Name" className="field field-sm h-8 flex-1 text-[13.5px]" />
          <input name="role" placeholder="Role (optional)" className="field field-sm h-8 w-[160px] text-[13.5px]" />
          <button type="submit" className="btn btn-pri btn-sm">
            Add person
          </button>
        </form>
        <p className="text-[13px] text-ink3">
          Removing someone doesn't delete their history — their past tasks and updates stay exactly as they are. They
          just drop out of new assignment pickers, and you can restore them any time.
        </p>
      </section>
    </div>
  );
}
