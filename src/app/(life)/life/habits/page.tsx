import { createClient } from "@/lib/supabase/server";
import { addHabit } from "@/app/actions/life";
import HabitStreakGrid from "@/components/life/HabitStreakGrid";

export const dynamic = "force-dynamic";

function lastNDays(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const day = new Date(d);
    day.setDate(d.getDate() - i);
    out.push(day.toISOString().slice(0, 10));
  }
  return out;
}

export default async function HabitsPage() {
  const supabase = createClient();
  const days = lastNDays(14);

  const [{ data: habits }, { data: logs }] = await Promise.all([
    supabase.from("habit").select("*").eq("active", true).order("created_at"),
    supabase.from("habit_log").select("habit_id,date,done").gte("date", days[0])
  ]);

  const doneSet = new Set((logs || []).filter((l) => l.done).map((l) => `${l.habit_id}:${l.date}`));

  const rows = (habits || []).map((h) => ({
    id: h.id,
    title: h.title,
    days: days.map((d) => doneSet.has(`${h.id}:${d}`))
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-accent">Habits</span>
        <h1 className="font-serif text-[32px] font-medium tracking-tight">Daily streaks</h1>
        <p className="mt-2 max-w-[640px] text-ink2">
          Click any square to mark that day done or not. These aren&apos;t tied only to Trading or a skill — anything
          daily belongs here.
        </p>
      </div>

      <HabitStreakGrid rows={rows} days={days} />

      <form action={addHabit} className="card flex items-center gap-2 p-3">
        <input name="title" placeholder="New habit, e.g. Read 20 min" className="field h-10 flex-1 text-[13.5px]" />
        <button type="submit" className="btn btn-pri">
          Add habit
        </button>
      </form>
    </div>
  );
}
