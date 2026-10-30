"use client";

import { useState, useTransition } from "react";
import { quickUpdate } from "@/app/actions/tasks";
import { FLAG_META } from "@/lib/format";

export interface QuickEditTask {
  id: string;
  due_date: string | null;
  flag_type: "follow_up" | "update" | null;
  flag_date: string | null;
}

// A small "quick update" popover that rides along on a task row or Kanban
// card so the three fields people change most often — due date, the
// follow-up/update flag (+ its date), and a quick note — never require
// opening the full task page. Lives inside a <Link> on every page that uses
// it, so every handler stops propagation/prevents default to keep the click
// from also triggering the row's navigation.
export default function QuickEdit({ t }: { t: QuickEditTask }) {
  const [open, setOpen] = useState(false);
  const [dueDate, setDueDate] = useState(t.due_date || "");
  const [flagType, setFlagType] = useState<"" | "follow_up" | "update">(t.flag_type || "");
  const [flagDate, setFlagDate] = useState(t.flag_date || "");
  const [note, setNote] = useState("");
  const [saving, startTransition] = useTransition();

  function stop(e: React.SyntheticEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function save(e: React.SyntheticEvent) {
    stop(e);
    const fd = new FormData();
    fd.set("taskId", t.id);
    fd.set("due_date", dueDate);
    fd.set("flag_type", flagType);
    fd.set("flag_date", flagType ? flagDate : "");
    if (note.trim()) fd.set("note", note.trim());
    startTransition(() => {
      quickUpdate(fd);
    });
    setNote("");
    setOpen(false);
  }

  return (
    <span className="relative inline-flex flex-none" onClick={stop} onMouseDown={stop}>
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          setOpen((o) => !o);
        }}
        title="Quick update"
        aria-label="Quick update"
        className="btn btn-sm !h-7 !w-7 flex-none items-center justify-center !px-0"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>

      {open && (
        <>
          <span
            className="fixed inset-0 z-40 cursor-default"
            onClick={(e) => {
              stop(e);
              setOpen(false);
            }}
          />
          <div
            onClick={stop}
            className="card absolute right-0 top-9 z-50 flex w-72 flex-col gap-3 p-3.5 text-sm shadow-lg"
          >
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="field field-sm"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Flag</label>
              <div className="flex gap-1.5">
                {(["", "follow_up", "update"] as const).map((v) => (
                  <button
                    key={v || "none"}
                    type="button"
                    onClick={(e) => {
                      stop(e);
                      setFlagType(v);
                    }}
                    className={`h-7 flex-1 rounded-lg border text-[12px] font-medium ${
                      flagType === v ? "border-transparent bg-ink text-bg" : "border-line2 text-ink2 hover:bg-hover"
                    }`}
                  >
                    {v === "" ? "None" : FLAG_META[v].label}
                  </button>
                ))}
              </div>
              {flagType && (
                <input
                  type="date"
                  value={flagDate}
                  onChange={(e) => setFlagDate(e.target.value)}
                  className="field field-sm mt-1"
                />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Log an update</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's the latest? Saved as next action + logged."
                rows={2}
                className="field field-sm resize-none"
              />
            </div>

            <button type="button" onClick={save} disabled={saving} className="btn btn-pri btn-sm justify-center">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </>
      )}
    </span>
  );
}
