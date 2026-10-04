"use client";

import { useState, useTransition } from "react";
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
  const [shown, setShown] = useState(value || "");
  const [, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setShown(next); // paint the new value immediately, don't wait on the server
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("field", field);
    fd.set("value", next);
    startTransition(() => {
      updateTaskField(fd);
    });
  }

  return (
    <select
      value={shown}
      onChange={handleChange}
      className="field field-sm h-7 max-w-[150px] text-[13px] font-medium"
    >
      {none !== undefined && <option value="">{none}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
