"use client";

import { useState, useTransition } from "react";
import { setTaskAssignees } from "@/app/actions/tasks";

export default function TaskAssignees({
  taskId,
  selected,
  options
}: {
  taskId: string;
  selected: string[];
  options: { id: string; label: string }[];
}) {
  const [shown, setShown] = useState<string[]>(selected);
  const [, startTransition] = useTransition();

  function toggle(id: string, checked: boolean) {
    const next = checked ? [...shown, id] : shown.filter((x) => x !== id);
    setShown(next); // reflect the tick immediately
    const fd = new FormData();
    fd.set("taskId", taskId);
    next.forEach((personId) => fd.append("personIds", personId));
    startTransition(() => {
      setTaskAssignees(fd);
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      {options.map((o) => (
        <label key={o.id} className="flex items-center gap-2 text-[13.5px] font-medium">
          <input
            type="checkbox"
            checked={shown.includes(o.id)}
            onChange={(e) => toggle(o.id, e.target.checked)}
            className="h-3.5 w-3.5 accent-[var(--accent)]"
          />
          {o.label}
        </label>
      ))}
      {options.length === 0 && <span className="text-[13px] text-ink3">No one to assign yet.</span>}
    </div>
  );
}
