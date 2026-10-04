"use client";

import { useState, useTransition } from "react";
import { setTaskProject } from "@/app/actions/projects";

export default function ProjectPicker({
  taskId,
  projectId,
  projects
}: {
  taskId: string;
  projectId: string | null;
  projects: { id: string; name: string }[];
}) {
  const [shown, setShown] = useState(projectId || "");
  const [, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setShown(next);
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("projectId", next);
    startTransition(() => {
      setTaskProject(fd);
    });
  }

  return (
    <select
      value={shown}
      onChange={handleChange}
      className="field field-sm h-7 max-w-[150px] text-[13px] font-medium"
    >
      <option value="">None</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
