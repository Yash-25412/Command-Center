"use client";

import { useState } from "react";
import { quickAddTask, quickAddStructured } from "@/app/actions/tasks";

type Person = { id: string; name: string; is_me: boolean };
type Category = { id: string; name: string };

export default function QuickAdd({
  open,
  onClose,
  people,
  categories
}: {
  open: boolean;
  onClose: () => void;
  people: Person[];
  categories: Category[];
}) {
  const [mode, setMode] = useState<"text" | "form">("text");
  const [text, setText] = useState("");

  if (!open) return null;

  const peopleNames = people.map((p) => (p.is_me ? "Me" : p.name));

  return (
    <div className="fixed inset-0 z-20" onClick={onClose}>
      <div className="card absolute left-[248px] top-[104px] w-[560px] p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3.5 flex items-center">
          <span className="font-serif text-[20px] font-medium flex-1">Quick add</span>
          <button className="btn btn-sm" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="mb-3.5 inline-flex gap-0.5 rounded-[10px] bg-sunk p-[3px]">
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`h-7 rounded-[7px] px-3 text-[13px] font-medium ${mode === "text" ? "bg-surface text-ink shadow-sm" : "text-ink2"}`}
          >
            Type it
          </button>
          <button
            type="button"
            onClick={() => setMode("form")}
            className={`h-7 rounded-[7px] px-3 text-[13px] font-medium ${mode === "form" ? "bg-surface text-ink shadow-sm" : "text-ink2"}`}
          >
            Fill in a form
          </button>
        </div>

        {mode === "text" ? (
          <form action={quickAddTask}>
            <input
              autoFocus
              name="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Rahul: reconcile March revenue by fri #revenue !high"
              className="field h-[46px] text-[15px]"
            />
            <div className="mt-3 rounded-[10px] bg-sunk p-3 text-[13px] leading-relaxed text-ink2">
              <span className="font-medium text-ink">Format, always: </span>
              <code className="rounded bg-surface px-1.5 py-0.5 text-[12.5px]">Name: task text by day #category !priority</code>
              <br />
              Doers: {peopleNames.join(", ") || "none yet"}. Day: <code className="text-[12.5px]">by fri</code>,{" "}
              <code className="text-[12.5px]">by tomorrow</code>. Priority: <code className="text-[12.5px]">!high</code> or{" "}
              <code className="text-[12.5px]">!low</code>. Every part is optional except the task text.
            </div>
            <div className="mt-3 flex justify-end">
              <button type="submit" className="btn btn-pri">
                Add task
              </button>
            </div>
          </form>
        ) : (
          <form action={quickAddStructured} className="flex flex-col gap-2.5">
            <input autoFocus name="title" placeholder="What needs to happen?" required className="field h-11 text-[15px]" />
            <div className="flex flex-col gap-1">
              <span className="text-[12.5px] text-ink3">Assign to (pick one or more)</span>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 rounded-[10px] border border-line2 p-2.5">
                {people.length === 0 && <span className="text-[13px] text-ink3">No one to assign yet.</span>}
                {people.map((p) => (
                  <label key={p.id} className="flex items-center gap-1.5 text-[13.5px] font-medium">
                    <input type="checkbox" name="personIds" value={p.id} className="h-3.5 w-3.5 accent-[var(--accent)]" />
                    {p.is_me ? "Me" : p.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <select name="categoryId" defaultValue="" className="field h-10 text-[13.5px]">
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select name="priority" defaultValue="med" className="field h-10 text-[13.5px]">
                <option value="high">High priority</option>
                <option value="med">Medium priority</option>
                <option value="low">Low priority</option>
              </select>
              <input type="date" name="dueDate" className="field h-10 text-[13.5px]" />
            </div>
            <div className="mt-1 flex justify-end">
              <button type="submit" className="btn btn-pri">
                Add task
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
