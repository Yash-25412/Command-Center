"use client";

import { useState, useTransition } from "react";
import { changeStatus } from "@/app/actions/tasks";

const STATUS_PICKS = ["planned", "active", "waiting", "blocked", "review", "done"];

export default function StatusPicker({
  taskId,
  status,
  meta
}: {
  taskId: string;
  status: string;
  meta: Record<string, { label: string }>;
}) {
  const [shown, setShown] = useState(status);
  const [, startTransition] = useTransition();

  function pick(to: string) {
    if (to === shown) return;
    const from = shown;
    setShown(to); // highlight the new status immediately
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("from", from);
    fd.set("to", to);
    startTransition(() => {
      changeStatus(fd);
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {STATUS_PICKS.map((s) => {
        const on = shown === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => pick(s)}
            className={`h-7 rounded-full border px-3 text-[13px] font-medium ${
              on ? "border-transparent bg-ink text-bg" : "border-line2 text-ink2 hover:bg-hover"
            }`}
          >
            {meta[s].label}
          </button>
        );
      })}
    </div>
  );
}
