"use client";

import { useState, useTransition } from "react";
import { setTaskFlag, clearTaskFlag } from "@/app/actions/tasks";
import { FLAG_META } from "@/lib/format";

const TYPE_OPTIONS: { value: "follow_up" | "update"; label: string }[] = [
  { value: "follow_up", label: "Follow-up required" },
  { value: "update", label: "Update required" }
];

export default function TaskFlagPanel({
  taskId,
  flagType,
  flagDate,
  flagNote
}: {
  taskId: string;
  flagType: string | null;
  flagDate: string | null;
  flagNote: string | null;
}) {
  const [type, setType] = useState(flagType || "");
  const [date, setDate] = useState(flagDate || "");
  const [note, setNote] = useState(flagNote || "");
  const [, startTransition] = useTransition();
  const [saved, setSaved] = useState(true);

  const active = Boolean(flagType);
  const meta = flagType ? FLAG_META[flagType] : null;

  function save() {
    if (!type) return;
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("flagType", type);
    fd.set("flagDate", date);
    fd.set("flagNote", note);
    setSaved(true);
    startTransition(() => {
      setTaskFlag(fd);
    });
  }

  function clear() {
    setType("");
    setDate("");
    setNote("");
    setSaved(true);
    const fd = new FormData();
    fd.set("taskId", taskId);
    startTransition(() => {
      clearTaskFlag(fd);
    });
  }

  const dirty =
    !saved || type !== (flagType || "") || date !== (flagDate || "") || note !== (flagNote || "");

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink3">Flag</span>
        {active && meta && <span className={`chip ${meta.cls}`}>{meta.label}</span>}
      </div>

      <select
        value={type}
        onChange={(e) => {
          setType(e.target.value);
          setSaved(false);
        }}
        className="field field-sm h-8 text-[13px]"
      >
        <option value="">No flag</option>
        {TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {type && (
        <>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSaved(false);
            }}
            className="field field-sm h-8 text-[13px]"
          />
          <input
            type="text"
            value={note}
            placeholder="What needs checking? (optional)"
            onChange={(e) => {
              setNote(e.target.value);
              setSaved(false);
            }}
            className="field field-sm h-8 text-[13px]"
          />
          <div className="flex gap-2">
            {dirty && (
              <button type="button" onClick={save} className="btn btn-pri btn-sm flex-1">
                Save flag
              </button>
            )}
            {active && (
              <button type="button" onClick={clear} className="btn btn-sm flex-1">
                Clear flag
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
