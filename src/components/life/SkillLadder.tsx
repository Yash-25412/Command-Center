"use client";

import { useState, useTransition } from "react";
import { setSkillStage } from "@/app/actions/life";

export default function SkillLadder({
  skillId,
  stages,
  currentStage,
  accentClass = "bg-plum",
  compact = false
}: {
  skillId: string;
  stages: string[];
  currentStage: number;
  accentClass?: string;
  compact?: boolean;
}) {
  const [current, setCurrent] = useState(currentStage);
  const [, startTransition] = useTransition();

  function select(idx: number) {
    const locked = idx > current + 1;
    if (locked) return;
    setCurrent(idx);
    const fd = new FormData();
    fd.set("skillId", skillId);
    fd.set("stage", String(idx));
    startTransition(() => {
      setSkillStage(fd);
    });
  }

  return (
    <div>
      <div className={`flex items-start ${compact ? "gap-0 p-4" : "gap-0 p-6"} card`}>
        {stages.map((label, i) => {
          const idx = i + 1;
          const done = idx < current;
          const active = idx === current;
          const locked = idx > current + 1;
          return (
            <div key={idx} className="relative flex flex-1 flex-col items-center">
              {i > 0 && (
                <div
                  className="absolute top-[17px] left-[-50%] h-0.5 w-full"
                  style={{ background: idx <= current ? "var(--green)" : "var(--line)" }}
                />
              )}
              <button
                type="button"
                onClick={() => select(idx)}
                disabled={locked}
                className={`relative z-[1] flex items-center justify-center rounded-full text-white ${
                  compact ? "h-6 w-6 text-[11px]" : "h-[34px] w-[34px] text-[13px]"
                } font-bold ${locked ? "cursor-default opacity-45" : "cursor-pointer"} ${
                  done ? "bg-green" : active ? accentClass : "bg-line2"
                }`}
              >
                {done ? "✓" : idx}
              </button>
              <span
                className={`mt-2 max-w-[140px] text-center text-[12.5px] font-semibold leading-snug ${
                  active ? "text-ink" : done ? "text-green" : "text-ink3"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2.5 text-xs text-ink3">Click any unlocked circle to set it as your current stage.</p>
    </div>
  );
}
