"use client";

import { useState } from "react";
import { addEntry } from "@/app/actions/tasks";

export default function JourneyComposer({ taskId }: { taskId: string }) {
  const [kind, setKind] = useState<"update" | "meeting" | "decision">("update");

  return (
    <form action={addEntry} className="card flex flex-col gap-2.5 p-3.5">
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="kind" value={kind} />
      <textarea
        name="body"
        rows={3}
        placeholder="What happened? e.g. Waiting for Ankit to send the final data. Follow up Friday."
        className="resize-none border-0 bg-transparent px-1 py-1.5 outline-none"
      />
      {kind === "decision" && (
        <input name="reason" placeholder="Why did we decide this?" className="field h-9" />
      )}
      <div className="flex items-center gap-2.5">
        <div className="inline-flex gap-0.5 rounded-[10px] bg-sunk p-[3px]">
          {(["update", "meeting", "decision"] as const).map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => setKind(k)}
              className={`h-7 rounded-[7px] px-3 text-[13px] font-medium ${
                kind === k ? "bg-surface text-ink shadow-sm" : "text-ink2"
              }`}
            >
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>
        <span className="flex-1 text-xs text-ink3">Timestamped automatically.</span>
        <button type="submit" className="btn btn-pri">
          Add update
        </button>
      </div>
    </form>
  );
}
