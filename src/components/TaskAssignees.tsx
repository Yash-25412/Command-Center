"use client";

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
  return (
    <form action={setTaskAssignees} className="flex flex-col gap-1.5">
      <input type="hidden" name="taskId" value={taskId} />
      {options.map((o) => (
        <label key={o.id} className="flex items-center gap-2 text-[13.5px] font-medium">
          <input
            type="checkbox"
            name="personIds"
            value={o.id}
            defaultChecked={selected.includes(o.id)}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="h-3.5 w-3.5 accent-[var(--accent)]"
          />
          {o.label}
        </label>
      ))}
      {options.length === 0 && <span className="text-[13px] text-ink3">No one to assign yet.</span>}
    </form>
  );
}
