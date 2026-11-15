import Link from "next/link";
import { loadMetrics } from "@/lib/cockpit";
import ReviewView from "@/components/views/ReviewView";
import JournalView from "@/components/views/JournalView";
import TeamView from "@/components/views/TeamView";
import { fmtDateWeekday } from "@/lib/format";

export const dynamic = "force-dynamic";

const TABS = [
  ["overview", "Overview"],
  ["review", "Weekly review"],
  ["journal", "Journal"],
  ["team", "Team"]
] as const;
const C = 2 * Math.PI * 34;

function Tile({ k, v, unit, note, tone }: { k: string; v: string | number; unit?: string; note: string; tone?: "red" | "accent" }) {
  return (
    <div className="glass flex flex-col gap-2 rounded-[24px] p-5">
      <span className="eyebrow">{k}</span>
      <div className="flex items-baseline gap-2">
        <span className={`text-[42px] font-light leading-none tracking-[-0.03em] ${tone === "red" ? "text-red" : tone === "accent" ? "text-accent" : ""}`}>{v}</span>
        {unit && <span className="text-[13px] text-ink3">{unit}</span>}
      </div>
      <span className="font-mono text-[11.5px] text-ink3">{note}</span>
    </div>
  );
}

async function Overview() {
  const m = await loadMetrics();
  const maxV = Math.max(4, ...m.velocity.map((v) => Math.max(v.closed, v.created)));
  const od = m.overdueRate.map((w) => w.pct);
  const maxOd = Math.max(20, ...od);
  const pts = od.map((v, i) => `${((i * 300) / 11).toFixed(1)},${(110 - (v / maxOd) * 100).toFixed(1)}`).join(" ");
  const weekDelta = m.closedThisWeek - m.closedLastWeek;
  const heat = m.history.slice(-84);
  const maxAge = Math.max(1, ...m.aging.map((a) => a.n));
  const ageColor = ["var(--accent)", "var(--amber)", "var(--red)", "var(--red)"];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
        <Tile k="Streak · days cleared" v={m.streak} unit="days" note={`Best ${m.best} · last 120 days`} tone="accent" />
        <Tile
          k="Closed this week"
          v={m.closedThisWeek}
          unit="tasks"
          note={`${weekDelta >= 0 ? "▲" : "▼"} ${Math.abs(weekDelta)} vs last week (${m.closedLastWeek})`}
        />
        <Tile k="On-time rate · 30d" v={m.onTimeRate === null ? "—" : m.onTimeRate} unit={m.onTimeRate === null ? "" : "%"} note="done on or before the due date" />
        <Tile k="Carried now" v={m.carriedNow} unit="items" note={m.carriedNow ? "tasks + reminders past their date" : "backlog is zero"} tone={m.carriedNow ? "red" : "accent"} />
        <Tile k="Avg cycle time · 30d" v={m.cycleTime === null ? "—" : m.cycleTime} unit={m.cycleTime === null ? "" : "days"} note="created → done" />
      </div>

      <div className="flex flex-wrap gap-4">
        <section className="glass flex min-w-0 flex-[999_1_460px] flex-col gap-3.5 rounded-[24px] p-5">
          <div className="flex flex-wrap justify-between gap-2">
            <span className="eyebrow">Task velocity · 14 days</span>
            <span className="flex gap-3.5 text-[11.5px] text-ink3">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-accent" />Closed</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-white/20" />Created</span>
            </span>
          </div>
          <div className="grid h-[170px] grid-cols-[repeat(14,minmax(0,1fr))] items-end gap-1.5 border-b border-[var(--glass-line)]">
            {m.velocity.map((v) => (
              <div key={v.date} title={`${fmtDateWeekday(v.date)}: ${v.closed} closed, ${v.created} created`} className="flex h-full items-end justify-center gap-0.5">
                <div className="w-[42%] rounded-t bg-accent" style={{ height: `${Math.max(2, (v.closed / maxV) * 100)}%` }} />
                <div className="w-[30%] rounded-t bg-white/20" style={{ height: `${Math.max(2, (v.created / maxV) * 100)}%` }} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1.5 text-center font-mono text-[10px] text-ink3">
            {m.velocity.map((v) => (
              <span key={v.date}>{Number(v.date.slice(8))}</span>
            ))}
          </div>
        </section>
        <section className="glass flex min-w-0 flex-[1_1_280px] flex-col gap-3 rounded-[24px] p-5">
          <span className="eyebrow">Overdue rate · 12 weeks</span>
          <span className="text-[40px] font-light leading-none text-red">{od[od.length - 1]}%</span>
          <svg role="img" aria-label="Share of open dated tasks past due, week by week" viewBox="0 0 300 110" className="h-[120px] w-full">
            <polygon points={`0,110 ${pts} 300,110`} fill="rgba(255,90,95,0.12)" />
            <polyline points={pts} fill="none" stroke="var(--red)" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          <span className="text-[12px] text-ink3">Share of open, dated tasks that were past due at each week’s end.</span>
        </section>
      </div>

      <div className="flex flex-wrap gap-4">
        <section className="glass flex min-w-0 flex-[999_1_460px] flex-col gap-3 rounded-[24px] p-5">
          <div className="flex flex-wrap justify-between gap-2">
            <span className="eyebrow">Days cleared · 12 weeks</span>
            <span className="flex gap-3 text-[11.5px] text-ink3">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-accent" />Cleared</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[rgba(220,232,239,0.3)]" />Partly</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[rgba(255,90,95,0.4)]" />Missed</span>
            </span>
          </div>
          <div className="overflow-x-auto">
            <div className="grid min-w-[320px] grid-flow-col grid-rows-[repeat(7,15px)] gap-1" style={{ gridAutoColumns: "15px" }}>
              {heat.map((h) => (
                <div
                  key={h.date}
                  title={`${fmtDateWeekday(h.date)} · ${h.state}${h.open ? ` (${h.open} left open)` : ""}`}
                  className={`rounded-[3px] ${h.state === "cleared" ? "bg-accent" : h.state === "partial" ? "bg-[rgba(220,232,239,0.3)]" : "bg-[rgba(255,90,95,0.4)]"}`}
                />
              ))}
            </div>
          </div>
        </section>
        <section className="glass flex min-w-0 flex-[1_1_280px] flex-col gap-3 rounded-[24px] p-5">
          <span className="eyebrow">Carried items by age</span>
          {m.aging.map((a, i) => (
            <div key={a.label} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[12.5px]">
                <span className="text-ink2">{a.label}</span>
                <span className="font-mono">{a.n}</span>
              </div>
              <div className="h-1.5 rounded bg-white/10">
                <div className="h-full rounded" style={{ width: `${(a.n / maxAge) * 100}%`, background: ageColor[i] }} />
              </div>
            </div>
          ))}
        </section>
      </div>

      <section className="glass flex flex-col gap-3.5 rounded-[24px] p-5">
        <span className="eyebrow">Project completion</span>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
          {m.projects.map((p) => (
            <Link key={p.id} href={`/project/${p.id}`} className="flex min-h-[56px] items-center gap-3">
              <svg aria-hidden="true" width="54" height="54" viewBox="0 0 80 80" className="flex-none">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(C * p.pct) / 100} ${C}`} transform="rotate(-90 40 40)" />
              </svg>
              <span className="flex min-w-0 flex-col">
                <span className="font-mono text-[17px]">{p.pct}%</span>
                <span className="truncate text-[12px] text-ink3">{p.name}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: { tab?: string; kind?: string } }) {
  const tab = TABS.some(([k]) => k === searchParams.tab) ? searchParams.tab! : "overview";
  return (
    <div className="rise flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="eyebrow">Observatory · live</span>
        <h1 className="text-[clamp(30px,3.8vw,52px)] font-light leading-none tracking-[-0.03em]">How you are moving.</h1>
      </div>
      <nav aria-label="Dashboard sections" className="inline-flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-full border border-[var(--glass-line)] bg-white/[0.03] p-[3px]">
        {TABS.map(([k, l]) => (
          <Link key={k} href={k === "overview" ? "/dashboard" : `/dashboard?tab=${k}`} className={`seg inline-flex items-center ${tab === k ? "seg-on" : ""}`}>
            {l}
          </Link>
        ))}
      </nav>
      {tab === "overview" && <Overview />}
      {tab === "review" && <ReviewView />}
      {tab === "journal" && <JournalView kind={searchParams.kind} />}
      {tab === "team" && <TeamView />}
    </div>
  );
}
