"use client";

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
  return (
    <form action={setTaskProject}>
      <input type="hidden" name="taskId" value={taskId} />
      <select
        name="projectId"
        defaultValue={projectId || ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="field field-sm h-7 max-w-[150px] text-[13px] font-medium"
      >
        <option value="">None</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </form>
  );
}
