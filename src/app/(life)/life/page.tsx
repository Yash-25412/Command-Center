import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/format";
import HabitChecklist from "@/components/life/HabitChecklist";

export const dynamic = "force-dynamic";

export default async function LifeDashboard() {
  const supabase = createClient();
  const today = todayISO();

  const [{ data: skills }, { data: trades }, { data: ideas }, { data: habits }, { data: todayLogs }] =
    await Promise.all([
      supabase.from("skill").select("*").order("kind", { ascending: false }),
      supabase.from("trade").select("pnl"),
      supabase.from("side_hustle_idea").select("id,stage"),
      supabase.from("habit").select("*").eq("active", true).order("created_at"),
      supabase.from("habit_log").select("habit_id,done").eq("date", today)
    ]);

  const trading = (skills || []).find((s) => s.kind === "trading");
  const otherSkills = (skills || []).filter((s) => s.kind === "skill");
  const netPnl = (trades || []).reduce((s, t) => s + Number(t.pnl), 0);

  const activeIdeas = (ideas || []).filter((i) => i.stage !== "parked");
  const inTalks = activeIdeas.filter((i) => i.stage !== "idea").length;

  const doneByHabit = new Map((todayLogs || []).map((l) => [l.habit_id, l.done]));

  return (
    <div className="flex flex-col gap-7">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-accent">Focus today</span>
        <h1 className="font-serif text-[34px] font-medium tracking-tight">Good to see you, Yash.</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {trading && (
          <Link href="/life/trading" className="card lift flex flex-col p-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-plum">Trading</span>
            <span className="font-serif mt-1.5 text-xl font-medium">
              Stage {trading.current_stage} of {trading.stages.length}
            </span>
            <span className="mt-0.5 text-[13.5px] text-ink2">{trading.stages[trading.current_stage - 1]}</span>
            <div className="mt-3.5 h-[7px] overflow-hidden rounded-full bg-line">
              <div
                className="h-full bg-plum"
                style={{ width: `${(trading.current_stage / trading.stages.length) * 100}%` }}
              />
            </div>
            <span className="mt-2.5 text-xs text-ink3">
              {netPnl >= 0 ? `+${netPnl.toFixed(1)}` : `-${Math.abs(netPnl).toFixed(1)}`} pts net so far →
            </span>
          </Link>
        )}

        <Link href="/life/side-hustle" className="card lift flex flex-col p-5">
          <span className="text-xs font-semibold uppercase tracking-wide text-accent">Side hustle</span>
          <span className="font-serif mt-1.5 text-xl font-medium">{activeIdeas.length} ideas in motion</span>
          <span className="mt-0.5 text-[13.5px] text-ink2">
            {inTalks} moving · {activeIdeas.length - inTalks} still just ideas
          </span>
          <div className="mt-3.5 flex gap-1.5">
            <span className="h-[7px] flex-1 rounded-full bg-amber" />
            <span className="h-[7px] flex-[2] rounded-full bg-line" />
          </div>
          <span className="mt-2.5 text-xs text-ink3">Nothing committed yet →</span>
        </Link>

        {otherSkills.map((skill) => (
          <Link key={skill.id} href={`/life/skills/${skill.id}`} className="card lift flex flex-col p-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-green">{skill.title}</span>
            <span className="font-serif mt-1.5 text-xl font-medium">
              Stage {skill.current_stage} of {skill.stages.length}
            </span>
            <span className="mt-0.5 text-[13.5px] text-ink2">{skill.stages[skill.current_stage - 1]}</span>
            <div className="mt-3.5 h-[7px] overflow-hidden rounded-full bg-line">
              <div
                className="h-full bg-green"
                style={{ width: `${(skill.current_stage / skill.stages.length) * 100}%` }}
              />
            </div>
            <span className="mt-2.5 text-xs text-ink3">Keep going →</span>
          </Link>
        ))}
      </div>

      <div className="card flex flex-col gap-1 p-5">
        <div className="flex items-baseline justify-between">
          <span className="font-serif text-lg font-medium">Today's habits</span>
          <Link href="/life/habits" className="text-[13px] font-semibold text-accent">
            See all streaks →
          </Link>
        </div>
        <HabitChecklist
          habits={(habits || []).map((h) => ({ id: h.id, title: h.title, done: doneByHabit.get(h.id) || false }))}
          date={today}
        />
      </div>
    </div>
  );
}
