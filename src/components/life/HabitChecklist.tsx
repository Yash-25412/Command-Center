"use client";

import { useState, useTransition } from "react";
import { toggleHabitDay } from "@/app/actions/life";

type Row = { id: string; title: string; done: boolean };

export default function HabitChecklist({ habits, date }: { habits: Row[]; date: string }) {
  const [shown, setShown] = useState(habits);
  const [, startTransition] = useTransition();

  function toggle(id: string) {
    setShown((rows) => rows.map((r) => (r.id === id ? { ...r, done: !r.done } : r)));
    const fd = new FormData();
    fd.set("habitId", id);
    fd.set("date", date);
    startTransition(() => {
      toggleHabitDay(fd);
    });
  }

  if (shown.length === 0) {
    return <p className="py-2 text-[13.5px] text-ink3">No habits yet — add one from the Habits page.</p>;
  }

  return (
    <div className="mt-1 flex flex-col gap-0.5">
      {shown.map((h) => (
        <button
          key={h.id}
          type="button"
          onClick={() => toggle(h.id)}
          className="flex items-center gap-3 rounded-lg px-1 py-2 text-left hover:bg-hover"
        >
          <span
            className={`flex h-5 w-5 flex-none items-center justify-center rounded-[6px] border-[1.5px] text-xs text-white ${
              h.done ? "border-green bg-green" : "border-line2 bg-transparent"
            }`}
          >
            {h.done ? "✓" : ""}
          </span>
          <span className="flex-1 text-[14.5px]">{h.title}</span>
        </button>
      ))}
    </div>
  );
}
