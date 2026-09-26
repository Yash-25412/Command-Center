import { createClient } from "@/lib/supabase/server";
import { convertCapture, dismissCapture } from "@/app/actions/tasks";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const supabase = createClient();
  const { data: captures } = await supabase
    .from("capture")
    .select("id,text,created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="flex max-w-[820px] flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-serif text-[34px] font-medium tracking-tight">Inbox</h1>
        <p className="text-ink2">
          Half-formed captures. Turn each into a task, or dismiss it. Nothing here counts as work
          until you decide.
        </p>
      </div>

      <div className="card overflow-hidden">
        {(captures || []).map((c) => (
          <div key={c.id} className="row-hover flex items-center gap-3.5 border-t border-line px-4 py-3.5 first:border-t-0">
            <span className="flex-1">{c.text}</span>
            <form action={convertCapture}>
              <input type="hidden" name="captureId" value={c.id} />
              <input type="hidden" name="text" value={c.text} />
              <button type="submit" className="btn btn-sm btn-pri">
                Make task
              </button>
            </form>
            <form action={dismissCapture}>
              <input type="hidden" name="captureId" value={c.id} />
              <button type="submit" className="btn btn-sm">
                Dismiss
              </button>
            </form>
          </div>
        ))}
        {(!captures || captures.length === 0) && (
          <div className="p-8 text-center text-ink2">Inbox zero. Everything you captured has a home.</div>
        )}
      </div>
      <p className="text-[13px] text-ink3">
        Capture anything with Quick add. Try typing &ldquo;Rahul: reconcile March revenue by fri
        #revenue !high&rdquo; and the fields fill themselves.
      </p>
    </div>
  );
}
