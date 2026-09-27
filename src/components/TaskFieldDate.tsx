"use client";

import { updateTaskField } from "@/app/actions/tasks";

export default function TaskFieldDate({ taskId, field, value }: { taskId: string; field: string; value: string | null }) {
  return (
    <form action={updateTaskField}>
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="field" value={field} />
      <input
        type="date"
        name="value"
        defaultValue={value || ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="field field-sm h-7 max-w-[150px] text-[13px] font-medium"
      />
    </form>
  );
}
