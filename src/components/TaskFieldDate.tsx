"use client";

import { useState, useTransition } from "react";
import { updateTaskField } from "@/app/actions/tasks";

export default function TaskFieldDate({ taskId, field, value }: { taskId: string; field: string; value: string | null }) {
  const [shown, setShown] = useState(value || "");
  const [, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setShown(next);
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("field", field);
    fd.set("value", next);
    startTransition(() => {
      updateTaskField(fd);
    });
  }

  return (
    <input
      type="date"
      value={shown}
      onChange={handleChange}
      className="field field-sm h-7 max-w-[150px] text-[13px] font-medium"
    />
  );
}
