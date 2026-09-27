"use client";

import { useState } from "react";
import { updateProjectField } from "@/app/actions/projects";

export default function ProjectFieldText({
  projectId,
  field,
  value,
  multiline,
  placeholder,
  className
}: {
  projectId: string;
  field: string;
  value: string;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [text, setText] = useState(value);
  const dirty = text !== value;

  return (
    <form action={updateProjectField} className="flex items-start gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="field" value={field} />
      {multiline ? (
        <textarea
          name="value"
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          className={`field ${className || ""}`}
        />
      ) : (
        <input
          name="value"
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          className={`field ${className || ""}`}
        />
      )}
      {dirty && (
        <button type="submit" className="btn btn-sm flex-none">
          Save
        </button>
      )}
    </form>
  );
}
