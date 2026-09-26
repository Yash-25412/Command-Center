"use client";

import { useState } from "react";
import { quickAddTask } from "@/app/actions/tasks";

export default function QuickAdd({
  open,
  onClose,
  peopleNames
}: {
  open: boolean;
  onClose: () => void;
  peopleNames: string[];
}) {
  const [text, setText] = useState("");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-20 flex items-start justify-center bg-black/40 pt-[150px]"
      onClick={onClose}
    >
      <div
        className="card w-[560px] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3.5 flex items-center">
          <span className="font-serif text-[20px] font-medium flex-1">Quick add</span>
          <button className="btn btn-sm" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <form action={quickAddTask}>
          <input
            autoFocus
            name="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Rahul: reconcile March revenue by fri #revenue !high"
            className="field h-[46px] text-[15px]"
          />
          <p className="mt-3 text-xs text-ink3">
            Name: to set the doer ({peopleNames.join(", ")}), #category, !high or !low, then by
            fri, by tomorrow. Everything else can wait.
          </p>
          <div className="mt-3 flex justify-end">
            <button type="submit" className="btn btn-pri">
              Add task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
