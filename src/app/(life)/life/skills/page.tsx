import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addSkill } from "@/app/actions/life";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const supabase = createClient();
  const { data: skills } = await supabase.from("skill").select("*").eq("kind", "skill").order("created_at");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-green">New skills</span>
        <h1 className="font-serif text-[32px] font-medium tracking-tight">Skills</h1>
        <p className="mt-2 max-w-[640px] text-ink2">
          Anything you&apos;re learning — piano, a language, chess — gets the same 5-stage ladder shape as Trading.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(skills || []).map((s) => (
          <Link key={s.id} href={`/life/skills/${s.id}`} className="card lift flex flex-col p-5">
            <span className="font-serif text-lg font-medium">{s.title}</span>
            <span className="mt-1 text-[13.5px] text-ink2">
              Stage {s.current_stage} of {s.stages.length}: {s.stages[s.current_stage - 1]}
            </span>
            <div className="mt-3.5 h-[7px] overflow-hidden rounded-full bg-line">
              <div className="h-full bg-green" style={{ width: `${(s.current_stage / s.stages.length) * 100}%` }} />
            </div>
          </Link>
        ))}
        {(skills || []).length === 0 && (
          <div className="card col-span-3 p-10 text-center text-ink2">No skills yet — add your first one below.</div>
        )}
      </div>

      <form action={addSkill} className="card flex flex-col gap-2.5 p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink3">Add a skill</span>
        <input name="title" placeholder="Skill name, e.g. Piano" required className="field h-10 text-[13.5px]" />
        <textarea
          name="stages"
          placeholder={"One milestone per line, e.g.\nReading notes & basic chords\nFirst full song\nComfortable sight-reading\nA real piece, performance-ready\nPlaying from memory"}
          rows={5}
          className="field text-[13.5px]"
        />
        <button type="submit" className="btn btn-pri self-end">
          Add skill
        </button>
      </form>
    </div>
  );
}
