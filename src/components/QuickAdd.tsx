"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { quickAddTask, quickAddStructured, addCapture } from "@/app/actions/tasks";
import { addReminder } from "@/app/actions/reminders";
import { parseQuickAdd, fmtDateWeekday } from "@/lib/format";

type Person = { id: string; name: string; is_me: boolean };
type Category = { id: string; name: string };
type Project = { id: string; name: string };
export type CaptureTab = "task" | "reminder" | "inbox";

// Capture (⌘K): one door for everything that enters the system.
//   Task     — natural language ("Rahul: reconcile March revenue by fri #revenue !high") or a form.
//   Reminder — a dated nudge for yourself, ad hoc or tied to a project / person.
//   Inbox    — half-formed thoughts to sort later.
// Tasks created without a project land in Ad Hoc.
export default function QuickAdd({
  open,
  tab: initialTab,
  onClose,
  people,
  categories,
  projects
}: {
  open: boolean;
  tab: CaptureTab;
  onClose: () => void;
  people: Person[];
  categories: Category[];
  projects: Project[];
}) {
  const [tab, setTab] = useState<CaptureTab>(initialTab);
  const [mode, setMode] = useState<"text" | "form">("text");
  const [text, setText] = useState("");
  const [when, setWhen] = useState("today");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setText("");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const parsed = useMemo(
    () => (tab === "task" && mode === "text" && text.trim() ? parseQuickAdd(text, people.map((p) => p.name)) : null),
    [tab, mode, text, people]
  );

  if (!open) return null;

  function submit(action: (fd: FormData) => Promise<void>) {
    return async (fd: FormData) => {
      await action(fd);
      setText("");
      onClose();
    };
  }

  const tabs: [CaptureTab, string][] = [
    ["task", "Task"],
    ["reminder", "Reminder"],
    ["inbox", "Inbox"]
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-md" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Capture"
        className="rise glass w-full max-w-[640px] rounded-[24px] p-5 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.85)]"
        style={{ background: "rgba(14,16,19,0.92)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="inline-flex gap-0.5 rounded-full border border-[var(--glass-line)] p-[3px]">
            {tabs.map(([k, l]) => (
              <button key={k} type="button" onClick={() => setTab(k)} className={`seg ${tab === k ? "seg-on" : ""}`}>
                {l}
              </button>
            ))}
          </div>
          {tab === "task" && (
            <button type="button" onClick={() => setMode(mode === "text" ? "form" : "text")} className="pill ml-1">
              {mode === "text" ? "Use a form" : "Type it"}
            </button>
          )}
          <span className="ml-auto font-mono text-[11px] text-ink3">esc</span>
        </div>

        {tab === "task" && mode === "text" && (
          <form action={submit(quickAddTask)} className="flex flex-col gap-3">
            <input
              ref={inputRef}
              name="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Rahul: share demand model deck by tue #analysis !high"
              aria-label="Task"
              className="field h-[54px] text-[16px]"
            />
            {parsed && (
              <div className="rise flex flex-wrap gap-2">
                {[
                  ["Who", parsed.doerName || "Me"],
                  ["Due", parsed.dueDate ? fmtDateWeekday(parsed.dueDate) : "No date"],
                  ["Category", parsed.categoryName || "—"],
                  ["Priority", parsed.priority],
                  ["Project", "Ad Hoc"]
                ].map(([k, v]) => (
                  <span key={k} className="flex flex-col rounded-[12px] border border-[rgba(220,232,239,0.3)] bg-[var(--accent-bg)] px-3 py-1.5">
                    <span className="text-[10px] tracking-[0.14em] text-ink3">{k.toUpperCase()}</span>
                    <span className="text-[13px] text-white">{v}</span>
                  </span>
                ))}
              </div>
            )}
            <p className="rounded-[12px] bg-white/[0.03] px-3 py-2.5 text-[12.5px] leading-relaxed text-ink3">
              Format: <span className="font-mono text-ink2">Name: task by fri #category !priority</span> — every part optional.
              People: {people.map((p) => (p.is_me ? "Me" : p.name)).join(", ") || "none yet"}. No project means it lands in{" "}
              <span className="text-accent">Ad Hoc</span>.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-pri" disabled={pending}>
                {pending ? "Adding…" : "Add task"}
              </button>
            </div>
          </form>
        )}

        {tab === "task" && mode === "form" && (
          <form action={submit(quickAddStructured)} className="flex flex-col gap-3">
            <input ref={inputRef} name="title" required placeholder="What needs to happen?" aria-label="Title" className="field h-12 text-[15px]" />
            <div className="flex flex-col gap-1.5">
              <span className="eyebrow">Assign to</span>
              <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-[12px] border border-[var(--glass-line)] p-3">
                {people.map((p) => (
                  <label key={p.id} className="flex items-center gap-1.5 text-[13.5px] font-medium">
                    <input type="checkbox" name="personIds" value={p.id} className="h-3.5 w-3.5 accent-[#dce8ef]" />
                    {p.is_me ? "Me" : p.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <select name="projectId" defaultValue="" aria-label="Project" className="field h-11 text-[13.5px]">
                <option value="">Ad Hoc</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select name="categoryId" defaultValue="" aria-label="Category" className="field h-11 text-[13.5px]">
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select name="priority" defaultValue="med" aria-label="Priority" className="field h-11 text-[13.5px]">
                <option value="high">High</option>
                <option value="med">Medium</option>
                <option value="low">Low</option>
              </select>
              <input type="date" name="dueDate" aria-label="Due date" className="field h-11 text-[13.5px]" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-pri" disabled={pending}>
                {pending ? "Adding…" : "Add task"}
              </button>
            </div>
          </form>
        )}

        {tab === "reminder" && (
          <form action={submit(addReminder)} className="flex flex-col gap-3">
            <input
              ref={inputRef}
              name="title"
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Follow up with Suyash on the GRN data"
              aria-label="Reminder"
              className="field h-[54px] text-[16px]"
            />
            <input type="hidden" name="when" value={when} />
            <div className="flex flex-wrap items-center gap-2">
              {[
                ["today", "Today"],
                ["tomorrow", "Tomorrow"],
                ["nextweek", "Next Mon"]
              ].map(([k, l]) => (
                <button key={k} type="button" onClick={() => setWhen(k)} className={`pill ${when === k ? "pill-on" : ""}`}>
                  {l}
                </button>
              ))}
              <input
                type="date"
                aria-label="Pick a date"
                onChange={(e) => e.target.value && setWhen(e.target.value)}
                className="field h-8 w-[150px] py-0 text-[12.5px]"
              />
              <select name="link" defaultValue="" aria-label="Link to" className="field h-8 min-w-[160px] flex-1 py-0 text-[12.5px]">
                <option value="">Ad hoc</option>
                <optgroup label="Project">
                  {projects.map((p) => (
                    <option key={p.id} value={`p:${p.id}`}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Person">
                  {people
                    .filter((p) => !p.is_me)
                    .map((p) => (
                      <option key={p.id} value={`u:${p.id}`}>
                        {p.name}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>
            <p className="rounded-[12px] bg-white/[0.03] px-3 py-2.5 text-[12.5px] leading-relaxed text-ink3">
              A reminder shows on its date and rolls forward, glowing red, until you tick it.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-pri" disabled={pending}>
                {pending ? "Saving…" : "Set reminder"}
              </button>
            </div>
          </form>
        )}

        {tab === "inbox" && (
          <form action={submit(addCapture)} className="flex flex-col gap-3">
            <input
              ref={inputRef}
              name="text"
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Anything — sort it out later"
              aria-label="Capture"
              className="field h-[54px] text-[16px]"
            />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-pri" disabled={pending}>
                Capture
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
