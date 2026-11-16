import Link from "next/link";
import { loadCockpit, CTask } from "@/lib/cockpit";
import { fmtDateWeekday } from "@/lib/format";
import { clearTaskFlag, convertCapture, dismissCapture, followUp, resumeFromWaiting } from "@/app/actions/tasks";
import { Dock, ReminderComposer, ReminderItem, TaskCard } from "@/components/cockpit/CockpitItems";

export const dynamic = "force-dynamic";

const DOW = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const C = 2 * Math.PI * 34;
const ring = (p: number) => `${(C * Math.max(0, Math.min(1, p))).toFixed(1)} ${C.toFixed(1)}`;

function dayParts(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return { dow: DOW[d.getUTCDay()], date: d.getUTCDate() };
}

function Label({ children, tone = "ink3" }: { children: React.ReactNode; tone?: "ink3" | "red" | "accent" | "amber" }) {
  const c = tone === "red" ? "text-red" : tone === "accent" ? "text-accent" : tone === "amber" ? "text-amber" : "text-ink3";
  return <span className={`font-mono text-[10.5px] tracking-[0.16em] ${c}`}>{children}</span>;
}

function FollowUpCard({ t, today }: { t: CTask; today: string }) {
  const isFlag = !!(t.flagType && t.flagDate && t.flagDate <= today);
  const label = isFlag ? (t.flagType === "update" ? "Update due" : "Follow-up due") : "Follow up now";
  const note = isFlag ? t.flagNote || t.projectName : `Waiting on ${t.waitingOn || "someone"}`;
  return (
    <div className="flex flex-col gap-2 rounded-[14px] border border-[var(--glass-line)] p-3 shadow-[inset_2px_0_0_var(--amber)]">
      <Link href={`/task/${t.id}`} className="flex flex-col gap-0.5 hover:text-white">
        <span className="font-medium leading-snug">{t.title}</span>
        <span className="text-[12px] text-ink3">
          <span className="text-amber">{label}</span> · {note}
        </span>
      </Link>
      <div className="flex flex-wrap gap-1.5">
        {isFlag ? (
          <form action={clearTaskFlag}>
            <input type="hidden" name="taskId" value={t.id} />
            <button className="btn btn-sm">Done · clear flag</button>
          </form>
        ) : (
          <>
            <form action={followUp}>
              <input type="hidden" name="taskId" value={t.id} />
              <input type="hidden" name="who" value={t.waitingOn || "them"} />
              <button className="btn btn-sm">Followed up · +2d</button>
            </form>
            <form action={resumeFromWaiting}>
              <input type="hidden" name="taskId" value={t.id} />
              <input type="hidden" name="who" value={t.waitingOn || "them"} />
              <button className="btn btn-sm">Got it · resume</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default async function CockpitPage() {
  const c = await loadCockpit();
  const total = c.openDue + c.doneDue;
  const hour = new Date(Date.now() + 5.5 * 3600000).getUTCHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const heading = c.backlog
    ? `${greet}, Yash. ${c.backlog} carried — clear them first.`
    : c.cleared
    ? "Day cleared. The streak lives."
    : `${greet}, Yash. ${c.openDue} left today.`;
  const t = dayParts(c.today);
  const vaultOpen = c.carried.filter((x) => !x.done).length;
  const remOpen = c.remCarried.filter((r) => !r.done).length + c.remToday.filter((r) => !r.done).length;
  const linkProjects = c.projects.filter((p: any) => !p.archived_at && p.status !== "cancelled").map((p: any) => ({ id: p.id, name: p.name }));

  return (
    <div className="rise flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="eyebrow">The runway · scroll through time →</span>
          <h1 className="text-[clamp(30px,3.8vw,52px)] font-light leading-[1.02] tracking-[-0.03em]">{heading}</h1>
        </div>
        <div className="glass flex items-center gap-3.5 rounded-full px-4 py-2.5">
          <span className="text-[12px] text-ink3">Backlog</span>
          <div className="h-1 w-36 rounded bg-white/10">
            <div
              className="h-full rounded transition-[width] duration-700"
              style={{
                width: `${c.backlogTotal ? (c.backlog / c.backlogTotal) * 100 : 0}%`,
                background: "linear-gradient(90deg,#ff5a5f,#ff8c7a)",
                boxShadow: "0 0 10px rgba(255,90,95,0.6)"
              }}
            />
          </div>
          <span className={`font-mono text-[12px] ${c.backlog ? "text-red" : "text-accent"}`}>
            {c.backlog ? `${c.backlog} / ${c.backlogTotal}` : "clear"}
          </span>
        </div>
      </div>

      <div className="runway -mx-[clamp(18px,4vw,56px)] flex items-stretch gap-4 overflow-x-auto px-[clamp(18px,4vw,56px)] pb-4 pt-1">
        {/* The vault: everything carried forward */}
        <section
          aria-label="The vault — carried forward"
          className="glass flex min-h-[520px] w-[320px] flex-none flex-col gap-3 rounded-[26px] p-5"
          style={{
            borderColor: vaultOpen ? "rgba(255,90,95,0.32)" : undefined,
            background: vaultOpen ? "linear-gradient(170deg, rgba(60,14,18,0.55), rgba(18,20,24,0.55))" : undefined
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <Label tone={vaultOpen ? "red" : "accent"}>THE VAULT</Label>
              <span className="text-[34px] font-light leading-none tracking-[-0.03em]">{vaultOpen ? "Carried" : "Sealed"}</span>
            </div>
            <span className={`font-mono text-[28px] ${vaultOpen ? "text-red" : "text-accent"}`}>{vaultOpen}</span>
          </div>
          <span className="text-[12.5px] text-ink3">
            {c.carried.length ? "Tasks rolled forward from earlier days. They pulse until cleared." : "No carried tasks. Keep it that way."}
          </span>
          {c.carried.map((x) => (
            <TaskCard key={x.id} t={x} />
          ))}
        </section>

        {/* Today */}
        <section
          aria-label="Today"
          className="glass flex min-h-[520px] w-[420px] flex-none flex-col gap-3 rounded-[26px] p-5"
          style={{ borderColor: "rgba(220,232,239,0.28)", background: "linear-gradient(170deg, rgba(207,224,234,0.09), rgba(18,20,24,0.6))" }}
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <Label tone="accent">TODAY · {fmtDateWeekday(c.today).toUpperCase()}</Label>
              <span className="text-[46px] font-light leading-none tracking-[-0.03em]">{t.dow.charAt(0) + t.dow.slice(1).toLowerCase()}</span>
            </div>
            <svg role="img" aria-label={`${c.doneDue} of ${total} due items cleared`} width="60" height="60" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="#dce8ef" strokeWidth="5" strokeLinecap="round" strokeDasharray={ring(total ? c.doneDue / total : 1)} transform="rotate(-90 40 40)" style={{ filter: "drop-shadow(0 0 6px rgba(207,224,234,0.6))" }} />
              <text x="40" y="46" textAnchor="middle" fill="#e9ecef" fontFamily="var(--font-mono)" fontSize="15">
                {c.doneDue}/{total}
              </text>
            </svg>
          </div>
          {c.cleared && (
            <div className="rise rounded-[14px] px-3.5 py-3 font-semibold text-[#07080a]" style={{ background: "linear-gradient(135deg,#F4F7F9,#C9DAE4)" }}>
              Day cleared — streak {c.streak} {c.streak === 1 ? "day" : "days"}.
            </div>
          )}
          <Label>TASKS</Label>
          {c.todayList.length === 0 && <span className="text-[13px] text-ink3">Nothing dated today.</span>}
          {c.todayList.map((x) => (
            <TaskCard key={x.id} t={x} />
          ))}
          {c.followUps.length > 0 && (
            <>
              <Label tone="amber">FOLLOW-UPS · {c.followUps.length} TO HANDLE</Label>
              {c.followUps.map((x) => (
                <FollowUpCard key={x.id} t={x} today={c.today} />
              ))}
            </>
          )}
        </section>

        {/* The next five days */}
        {c.days.map((d) => {
          const p = dayParts(d.date);
          const empty = !d.tasks.length;
          return (
            <section key={d.date} className="glass flex min-h-[520px] w-[260px] flex-none flex-col gap-3 rounded-[26px] p-5" style={{ background: "rgba(18,20,24,0.45)" }}>
              <div className="flex flex-col">
                <Label>{p.dow}</Label>
                <span className="text-[46px] font-light leading-none tracking-[-0.03em]">{p.date}</span>
              </div>
              <span className="min-h-[17px] text-[12px] text-ink3">
                {empty ? "" : `${d.tasks.length} task${d.tasks.length === 1 ? "" : "s"}`}
              </span>
              {d.tasks.map((x) => (
                <TaskCard key={x.id} t={x} compact />
              ))}
              {empty && (
                <div className="flex flex-1 items-center justify-center rounded-[14px] border border-dashed border-[var(--glass-line)] text-[12.5px] text-ink3">
                  Open runway
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
        <section className="glass flex flex-col gap-1 rounded-[26px] p-5">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="eyebrow">Needs attention</span>
            <span className="font-mono text-[11.5px] text-ink3">ranked by urgency</span>
          </div>
          {c.attention.length === 0 && <span className="text-[13px] text-ink3">Nothing stuck, stale or missing a next action.</span>}
          {c.attention.map((x) => (
            <Link key={x.id} href={`/task/${x.id}`} className="row-hover flex items-center gap-3 rounded-[12px] px-2 py-2.5">
              <span className={`h-2 w-2 flex-none rounded-full ${x.status === "blocked" ? "bg-red" : "bg-amber"}`} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{x.title}</span>
                <span className="text-[12px] text-ink3">
                  {x.code} · {x.who}
                </span>
              </span>
              <span className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] ${x.status === "blocked" ? "border-red text-red" : "border-amber text-amber"}`}>
                {x.reason}
              </span>
            </Link>
          ))}
        </section>

        <section className="glass flex flex-col gap-3 rounded-[26px] p-5">
          <div className="flex items-baseline justify-between">
            <span className="eyebrow">Reminders</span>
            <span className="font-mono text-[11.5px] text-ink3">
              {remOpen ? `${remOpen} open` : "all clear"}
            </span>
          </div>
          <ReminderComposer projects={linkProjects} people={c.people} />
          {c.remCarried.length > 0 && (
            <div className="flex flex-col gap-1">
              <Label tone="red">CARRIED · {c.remCarried.filter((r) => !r.done).length} TO CLEAR</Label>
              {c.remCarried.map((r) => (
                <ReminderItem key={r.id} r={r} />
              ))}
            </div>
          )}
          <div className="flex flex-col gap-1">
            <Label tone="accent">TODAY</Label>
            {c.remToday.length === 0 && <span className="px-2.5 text-[13px] text-ink3">Nothing for today.</span>}
            {c.remToday.map((r) => (
              <ReminderItem key={r.id} r={r} />
            ))}
          </div>
          {c.remUpcoming.length > 0 && (
            <div className="flex flex-col gap-1">
              <Label>UPCOMING · 7 DAYS</Label>
              {c.remUpcoming.map((r) => (
                <ReminderItem key={r.id} r={r} />
              ))}
            </div>
          )}
        </section>

        <section className="glass flex flex-col gap-5 rounded-[26px] p-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Inbox</span>
              <span className="font-mono text-[11.5px] text-ink3">{c.captures.length} captured</span>
            </div>
            {c.captures.length === 0 && <span className="text-[13px] text-ink3">Inbox zero. Everything has a home.</span>}
            {c.captures.slice(0, 5).map((cap: any) => (
              <div key={cap.id} className="flex flex-col gap-2 rounded-[14px] border border-dashed border-[var(--glass-line2)] p-3">
                <span className="text-[13px] leading-snug">{cap.text}</span>
                <div className="flex gap-1.5">
                  <form action={convertCapture}>
                    <input type="hidden" name="captureId" value={cap.id} />
                    <input type="hidden" name="text" value={cap.text} />
                    <button className="btn btn-sm">Make task</button>
                  </form>
                  <form action={dismissCapture}>
                    <input type="hidden" name="captureId" value={cap.id} />
                    <button className="btn btn-sm text-ink3">Dismiss</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <span className="eyebrow mb-1">Team pulse</span>
            {c.team.map((m) => (
              <Link key={m.id} href={`/work?person=${m.id}`} className="row-hover flex items-center gap-2.5 rounded-[12px] px-2 py-2">
                <span
                  className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[10.5px] font-semibold"
                  style={{ background: `hsl(${m.hue} 22% 26%)`, color: `hsl(${m.hue} 45% 82%)` }}
                >
                  {m.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="flex-1 text-[13.5px] font-medium">{m.name}</span>
                {m.overdue > 0 && <span className="text-[11px] text-red">{m.overdue} late</span>}
                {m.blocked > 0 && <span className="text-[11px] text-red">{m.blocked} blocked</span>}
                {m.waiting > 0 && <span className="text-[11px] text-amber">{m.waiting} waiting</span>}
                <span className="w-14 text-right font-mono text-[12px] text-ink3">{m.open} open</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <Dock dash={ring(total ? c.doneDue / total : 1)} frac={`${c.doneDue}/${total}`} streak={c.streak} best={c.best} />
    </div>
  );
}
