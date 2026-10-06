"use client";

import { useState, useTransition } from "react";
import { toggleHabitDay } from "@/app/actions/life";

type Row = { id: string; title: string; days: boolean[] };

export default function HabitStreakGrid({ rows, days }: { rows: Row[]; days: string[] }) {
  const [shown, setShown] = useState(rows);
  const [, startTransition] = useTransition();

  function toggle(habitId: string, dayIdx: number) {
    setShown((rs) =>
      rs.map((r) => (r.id !== habitId ? r : { ...r, days: r.days.map((d, i) => (i === dayIdx ? !d : d)) }))
    );
    const fd = new FormData();
    fd.set("habitId", habitId);
    fd.set("date", days[dayIdx]);
    startTransition(() => {
      toggleHabitDay(fd);
    });
  }

  function streak(dayFlags: boolean[]) {
    let s = 0;
    for (let i = dayFlags.length - 1; i >= 0; i--) {
      if (dayFlags[i]) s++;
      else break;
    }
    return s;
  }

  if (shown.length === 0) {
    return <div className="card p-10 text-center text-ink2">No habits yet — add your first one below.</div>;
  }

  return (
    <div className="card flex flex-col gap-4 p-5">
      {shown.map((row) => (
        <div key={row.id} className="flex items-center gap-4">
          <div className="flex w-[190px] flex-none flex-col">
            <span className="text-[13.5px] font-semibold">{row.title}</span>
            <span className="mt-0.5 text-xs text-ink3">{streak(row.days)} day streak</span>
          </div>
          <div className="flex flex-1 gap-1">
            {row.days.map((done, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${row.title} — ${days[i]}, ${done ? "done" : "not done"}`}
                onClick={() => toggle(row.id, i)}
                className={`h-[26px] w-[26px] rounded-[6px] border-[1.5px] ${
                  done ? "border-green bg-green" : "border-line bg-transparent hover:bg-hover"
                }`}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4 text-xs text-ink3">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3.5 w-3.5 rounded border border-line" /> Not done
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3.5 w-3.5 rounded bg-green" /> Done
        </span>
      </div>
    </div>
  );
}
