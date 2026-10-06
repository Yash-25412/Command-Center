import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SkillLadder from "@/components/life/SkillLadder";
import PracticeStrip from "@/components/life/PracticeStrip";

export const dynamic = "force-dynamic";

function lastNDays(n: number): { date: string; label: string }[] {
  const out: { date: string; label: string }[] = [];
  const d = new Date();
  const labels = ["S", "M", "T", "W", "T", "F", "S"];
  for (let i = n - 1; i >= 0; i--) {
    const day = new Date(d);
    day.setDate(d.getDate() - i);
    out.push({ date: day.toISOString().slice(0, 10), label: labels[day.getDay()] });
  }
  return out;
}

export default async function SkillDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const days = lastNDays(7);

  const [{ data: skill }, { data: logs }] = await Promise.all([
    supabase.from("skill").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("skill_practice_log").select("date,done").eq("skill_id", params.id).gte("date", days[0].date)
  ]);

  if (!skill) notFound();

  const doneSet = new Set((logs || []).filter((l) => l.done).map((l) => l.date));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-green">New skill</span>
        <h1 className="font-serif text-[32px] font-medium tracking-tight">{skill.title}</h1>
        <p className="mt-2 max-w-[640px] text-ink2">
          Same ladder shape as Trading — any skill you pick up reuses this exact screen.
        </p>
      </div>

      <SkillLadder skillId={skill.id} stages={skill.stages} currentStage={skill.current_stage} accentClass="bg-green" />

      <PracticeStrip
        skillId={skill.id}
        days={days.map((d) => ({ ...d, done: doneSet.has(d.date) }))}
      />
    </div>
  );
}
