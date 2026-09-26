import Link from "next/link";
import { loadWorkspace, DecoratedTask } from "@/lib/workspace";
import { fmtDate, fmtDateWeekday, initials } from "@/lib/format";

export const dynamic = "force-dynamic";

function weekAgoISO() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

function Row({ t }: { t: DecoratedTask }) {
  return (
    <Link href={`/task/${t.id}`} className="row-hover flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{t.title}</div>
        <div className="truncate text-[13px] text-ink3">
          {t.project?.name || "No project"}
          {t.doer ? `, ${t.doer.is_me ? "Me" : t.doer.name}` : ""}
        </div>
      </div>
      {t.reasons.slice(0, 1).map((r, i) => (
        <span key={i} className={`chip ${r.cls}`}>
          {r.label}
        </span>
      ))}
    </Link>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink3">{title}</h2>
        {hint && <span className="text-xs text-ink3">{hint}</span>}
      </div>
      <div className="card overflow-hidden">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="p-5 text-ink2">{children}</div>;
}

export default async function ReviewPage() {
  const { tasks } = await loadWorkspace();
  const weekAgo = weekAgoISO();
  const today = new Date().toISOString().slice(0, 10);
  const openTasks = tasks.filter((t) => t.isOpen);

  const completed = tasks
    .filter((t) => t.status === "done" && t.completed_at && t.completed_at.slice(0, 10) >= weekAgo)
    .sort((a, b) => (b.completed_at || "").localeCompare(a.completed_at || ""));

  const blocked = openTasks.filter((t) => t.status === "blocked").sort((a, b) => a.rank - b.rank);
  const waiting = openTasks
    .filter((t) => t.status === "waiting")
    .sort((a, b) => (a.follow_up_on || "9999").localeCompare(b.follow_up_on || "9999"));
  const overdue = openTasks.filter((t) => t.overdue).sort((a, b) => a.rank - b.rank);
  const stale = openTasks.filter((t) => t.stale).sort((a, b) => b.lastActivityDays - a.lastActivityDays);

  const nextWeek = openTasks
    .filter((t) => {
      if (!t.due_date) return false;
      const days = Math.round((new Date(t.due_date).getTime() - new Date(today).getTime()) / 86400000);
      return days >= 0 && days <= 7;
    })
    .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));

  const stats = [
    { label: "Completed", value: completed.length },
    { label: "Blocked", value: blocked.length },
    { label: "Waiting on others", value: waiting.length },
    { label: "Overdue", value: overdue.length },
    { label: "Stale", value: stale.length }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-serif text-[34px] font-medium tracking-tight">Weekly review</h1>
        <p className="text-ink2">
          {fmtDate(weekAgo)} to {fmtDate(today)}. A honest look at what moved, what's stuck, and what's next.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card flex flex-col gap-1 p-4">
            <span className="font-serif text-[28px] font-medium tracking-tight">{s.value}</span>
            <span className="text-[13px] text-ink2">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 items-start gap-5">
        <Section title="Completed this week">
          {completed.length === 0 && <Empty>Nothing marked done in the last 7 days.</Empty>}
          {completed.map((t) => (
            <Link key={t.id} href={`/task/${t.id}`} className="row-hover flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{t.title}</div>
                <div className="truncate text-[13px] text-ink3">{t.project?.name || "No project"}</div>
              </div>
              <span className="text-[13px] text-ink2">{fmtDate(t.completed_at?.slice(0, 10))}</span>
            </Link>
          ))}
        </Section>

        <Section title="Blocked" hint="Needs you">
          {blocked.length === 0 && <Empty>Nothing blocked right now.</Empty>}
          {blocked.map((t) => (
            <Row key={t.id} t={t} />
          ))}
        </Section>

        <Section title="Waiting on others" hint="By follow-up date">
          {waiting.length === 0 && <Empty>You're not waiting on anyone.</Empty>}
          {waiting.map((t) => (
            <Link key={t.id} href={`/task/${t.id}`} className="row-hover flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{t.title}</div>
                <div className="truncate text-[13px] text-ink2">{t.waiting_on}</div>
              </div>
              <span className="chip chip-amber">{t.follow_up_on ? `Follow up ${fmtDateWeekday(t.follow_up_on)}` : "No follow-up set"}</span>
            </Link>
          ))}
        </Section>

        <Section title="Overdue">
          {overdue.length === 0 && <Empty>Nothing overdue. Good week.</Empty>}
          {overdue.map((t) => (
            <Row key={t.id} t={t} />
          ))}
        </Section>

        <Section title="Stale" hint="No activity in a while">
          {stale.length === 0 && <Empty>Everything open has had recent activity.</Empty>}
          {stale.map((t) => (
            <Row key={t.id} t={t} />
          ))}
        </Section>

        <Section title="Next week" hint="Due in the next 7 days">
          {nextWeek.length === 0 && <Empty>Nothing due next week yet.</Empty>}
          {nextWeek.map((t) => (
            <Link key={t.id} href={`/task/${t.id}`} className="row-hover flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
              <span className="w-16 flex-none text-[13px] text-ink2">{fmtDate(t.due_date)}</span>
              <span className="min-w-0 flex-1 truncate">{t.title}</span>
            </Link>
          ))}
        </Section>
      </div>
    </div>
  );
}
