"use client";

import { useState, useTransition } from "react";
import { toggleSkillPractice } from "@/app/actions/life";

export default function PracticeStrip({
  skillId,
  days
}: {
  skillId: string;
  days: { date: string; label: string; done: boolean }[];
}) {
  const [shown, setShown] = useState(days);
  const [, startTransition] = useTransition();

  function toggle(i: number) {
    setShown((rows) => rows.map((r, idx) => (idx === i ? { ...r, done: !r.done } : r)));
    const fd = new FormData();
    fd.set("skillId", skillId);
    fd.set("date", shown[i].date);
    startTransition(() => {
      toggleSkillPractice(fd);
    });
  }

  let streak = 0;
  for (let i = shown.length - 1; i >= 0; i--) {
    if (shown[i].done) streak++;
    else break;
  }

  return (
    <div className="card flex max-w-[520px] flex-col gap-2.5 p-5">
      <div className="flex items-baseline justify-between">
        <span className="font-serif text-lg font-medium">This week&apos;s practice</span>
        <span className="text-xs text-ink3">{streak} day streak</span>
      </div>
      <div className="mt-1 flex gap-2">
        {shown.map((d, i) => (
          <button
            key={d.date}
            type="button"
            onClick={() => toggle(i)}
            className={`flex h-10 w-10 items-center justify-center rounded-[10px] border-[1.5px] text-[11px] font-semibold ${
              d.done ? "border-green bg-green text-white" : "border-line bg-surface text-ink3"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}
