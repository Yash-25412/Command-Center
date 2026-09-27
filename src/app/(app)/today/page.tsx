import Link from "next/link";
import { loadWorkspace, DecoratedTask } from "@/lib/workspace";
import { fmtDate, fmtDateWeekday, initials } from "@/lib/format";

export const dynamic = "force-dynamic";

function Avatar({ t }: { t: DecoratedTask }) {
  const isMe = !!t.doer?.is_me;
  return (
    <span
      className={`avatar h-[24px] w-[24px] text-[11px] ${isMe ? "avatar-me" : ""}`}
      style={isMe ? undefined : { background: `hsl(${t.doer?.hue ?? 200} 30% 88%)`, color: `hsl(${t.doer?.hue ?? 200} 35% 32%)` }}
      title={t.doer?.name || "Unassigned"}
    >
      {initials(t.doer?.name || "?")}
    </span>
  );
}

export default async function TodayPage() {
  const { tasks, people } = await loadWorkspace();
  const today = new Date().toISOString().slice(0, 10);
  const openTasks = tasks.filter((t) => t.isOpen);

  const focus = openTasks
    .filter((t) => t.focus_on === today || (t.doer?.is_me && t.due_date === today))
    .sort((a, b) => a.rank - b.rank);
  const focusIds = new Set(focus.map((t) => t.id));

  const attention = openTasks
    .filter((t) => t.reasons.length > 0 && !focusIds.has(t.id))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 6);

  const waiting = openTasks
    .filter((t) => t.status === "waiting")
    .sort((a, b) => (a.follow_up_on || "9999").localeCompare(b.follow_up_on || "9999"));

  const comingUp = openTasks
    .filter((t) => {
      if (!t.due_date) return false;
      const days = Math.round((new Date(t.due_date).getTime() - new Date(today).getTime()) / 86400000);
      return days >= 1 && days <= 7;
    })
    .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""))
    .slice(0, 6);

  const recentDone = tasks
    .filter((t) => t.status === "done" && t.completed_at)
    .sort((a, b) => (b.completed_at || "").localeCompare(a.completed_at || ""))
    .slice(0, 4);

  const team = people.filter((p) => !p.is_me && p.active);
  const teamPulse = team.map((p) => {
    const mine = openTasks.filter((t) => t.doer_id === p.id);
    return {
      person: p,
      open: mine.length,
      overdue: mine.filter((t) => t.overdue).length,
      blocked: mine.filter((t) => t.status === "blocked").length,
      waiting: mine.filter((t) => t.status === "waiting").length
    };
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const overdueCount = openTasks.filter((t) => t.overdue).length;
  const staleCount = openTasks.filter((t) => t.stale).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-serif text-[36px] font-medium tracking-tight leading-tight">{greeting}, Yash.</h1>
        <p className="text-[15px] text-ink2">
          {focus.length} on your plate today, {overdueCount} overdue, {waiting.length} waiting on others
          {staleCount > 0 ? `, ${staleCount} stale` : ""}.
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] items-start gap-7">
        <div className="flex min-w-0 flex-col gap-6">
          <Section title="Focus today">
            {focus.length === 0 && (
              <Empty>Nothing pinned for today. Set a task's Focus date, or it lands here automatically when it's yours and due today.</Empty>
            )}
            {focus.map((t) => (
              <Link key={t.id} href={`/task/${t.id}`} className="row-hover flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{t.title}</div>
                  <div className="truncate text-[13px] text-ink2">{t.next_action ? `Next: ${t.next_action}` : "No next action yet"}</div>
                </div>
                <span className={`chip ${t.due.cls}`}>{t.due.label}</span>
                <Avatar t={t} />
              </Link>
            ))}
          </Section>

          <Section title="Needs attention" hint={`Top ${attention.length} by urgency`}>
            {attention.length === 0 && <Empty>Nothing urgent right now.</Empty>}
            {attention.map((t) => (
              <Link key={t.id} href={`/task/${t.id}`} className="row-hover flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
                <span
                  className="h-2 w-2 flex-none rounded-full"
                  style={{ background: t.status === "blocked" ? "var(--red)" : "var(--amber)" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{t.title}</div>
                  <div className="truncate text-[13px] text-ink3">{t.project?.name || "No project"}</div>
                </div>
                {t.reasons.slice(0, 1).map((r, i) => (
                  <span key={i} className={`chip ${r.cls}`}>
                    {r.label}
                  </span>
                ))}
                <Avatar t={t} />
              </Link>
            ))}
          </Section>

          <Section title="Waiting on others" hint="By follow-up date">
            {waiting.length === 0 && <Empty>You're not waiting on anyone.</Empty>}
            {waiting.slice(0, 3).map((t) => (
              <Link key={t.id} href={`/task/${t.id}`} className="row-hover flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{t.title}</div>
                  <div className="truncate text-[13px] text-ink2">{t.waiting_on}</div>
                </div>
                <span className="chip chip-amber">
                  {t.follow_up_on ? `Follow up ${fmtDateWeekday(t.follow_up_on)}` : "No follow-up set"}
                </span>
              </Link>
            ))}
          </Section>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Section title="Team pulse">
            {teamPulse.length === 0 && <Empty>No team members yet.</Empty>}
            {teamPulse.map((row) => (
              <Link
                key={row.person.id}
                href={`/work?person=${row.person.id}`}
                className="row-hover flex items-center gap-3 border-t border-line px-4 py-2.5 first:border-t-0"
              >
                <span
                  className="avatar h-7 w-7 text-xs"
                  style={{ background: `hsl(${row.person.hue} 30% 88%)`, color: `hsl(${row.person.hue} 35% 32%)` }}
                >
                  {initials(row.person.name)}
                </span>
                <span className="flex-1 font-medium">{row.person.name}</span>
                {row.overdue > 0 && <span className="chip chip-red">{row.overdue} late</span>}
                {row.blocked > 0 && <span className="chip chip-red">{row.blocked} blocked</span>}
                {row.waiting > 0 && <span className="chip chip-amber">{row.waiting} waiting</span>}
                <span className="w-14 text-right text-[13px] text-ink2">{row.open} open</span>
              </Link>
            ))}
          </Section>

          <Section title="Coming up, 7 days">
            {comingUp.length === 0 && <Empty>Nothing due this week.</Empty>}
            {comingUp.map((t) => (
              <Link key={t.id} href={`/task/${t.id}`} className="row-hover flex items-center gap-3 border-t border-line px-4 py-2.5 first:border-t-0">
                <span className="w-16 flex-none text-[13px] text-ink2">{fmtDate(t.due_date)}</span>
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                <Avatar t={t} />
              </Link>
            ))}
          </Section>
        </div>
      </div>

      <Section title="Recently done">
        <div className="grid grid-cols-4 gap-3 p-3">
          {recentDone.length === 0 && <div className="col-span-4 py-4 text-center text-ink2">Nothing finished yet.</div>}
          {recentDone.map((t) => (
            <Link key={t.id} href={`/task/${t.id}`} className="card lift flex flex-col gap-1.5 p-3.5 hover:border-line2">
              <span className="truncate font-medium">{t.title}</span>
              <span className="flex items-center gap-2 text-[13px] text-ink2">
                <Avatar t={t} />
                Done {fmtDate(t.completed_at?.slice(0, 10))}
              </span>
            </Link>
          ))}
        </div>
      </Section>
    </div>
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
