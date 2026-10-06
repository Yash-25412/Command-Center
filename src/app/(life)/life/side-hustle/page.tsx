import { createClient } from "@/lib/supabase/server";
import { addIdea } from "@/app/actions/life";
import IdeaBoard from "@/components/life/IdeaBoard";

export const dynamic = "force-dynamic";

export default async function SideHustlePage() {
  const supabase = createClient();
  const { data: ideas } = await supabase.from("side_hustle_idea").select("*").order("created_at");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-accent">Side Hustle</span>
          <h1 className="font-serif text-[32px] font-medium tracking-tight">Idea pipeline</h1>
          <p className="mt-2 max-w-[640px] text-ink2">
            You don&apos;t know which one yet — that&apos;s fine. This is for comparing options, not committing
            early.
          </p>
        </div>
        <form action={addIdea} className="card flex w-[340px] flex-none flex-col gap-2 p-3">
          <input name="title" placeholder="New idea" required className="field field-sm h-9 text-[13.5px]" />
          <input name="note" placeholder="One line about it (optional)" className="field field-sm h-9 text-[13.5px]" />
          <button type="submit" className="btn btn-pri btn-sm self-end">
            Add idea
          </button>
        </form>
      </div>

      <IdeaBoard ideas={ideas || []} />
    </div>
  );
}
