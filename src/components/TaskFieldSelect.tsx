"use client";

import { updateTaskField } from "@/app/actions/tasks";

export default function TaskFieldSelect({
  taskId,
  field,
  value,
  none,
  options
}: {
  taskId: string;
  field: string;
  value: string | null;
  none?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <form action={updateTaskField}>
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="field" value={field} />
      <select
        name="value"
        defaultValue={value || ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="field field-sm h-7 max-w-[150px] text-[13px] font-medium"
      >
        {none !== undefined && <option value="">{none}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}
