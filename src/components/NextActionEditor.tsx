"use client";

import { useState, useTransition } from "react";
import { updateTaskField } from "@/app/actions/tasks";

export default function NextActionEditor({ taskId, value }: { taskId: string; value: string }) {
  const [editing, setEditing] = useState(false);
  const [shown, setShown] = useState(value);
  const [, startTransition] = useTransition();

  function save(text: string) {
    setShown(text); // show it right away
    setEditing(false);
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("field", "next_action");
    fd.set("value", text);
    startTransition(() => {
      updateTaskField(fd);
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="card flex w-full flex-col gap-1.5 border-accent p-4 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-accent">Next action</span>
        {shown ? (
          <span className="text-[16px] font-medium leading-snug">{shown}</span>
        ) : (
          <span className="text-amber">No next action yet. Click to set the very next concrete step.</span>
        )}
      </button>
    );
  }

  return (
    <form
      className="card flex flex-col gap-2.5 border-accent p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const text = new FormData(e.currentTarget).get("value");
        save(String(text ?? ""));
      }}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-accent">Next action</span>
      <textarea
        name="value"
        autoFocus
        defaultValue={shown}
        placeholder="What's the very next concrete step?"
        rows={2}
        className="field text-[15px]"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
          if (e.key === "Escape") setEditing(false);
        }}
      />
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-sm" onClick={() => setEditing(false)}>
          Cancel
        </button>
        <button type="submit" className="btn btn-pri btn-sm">
          Save
        </button>
      </div>
    </form>
  );
}
