"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { setTaskDone } from "@/app/actions/tasks";
import { addReminder, deleteReminder, setReminderDone, snoozeReminder } from "@/app/actions/reminders";
import { openCapture } from "@/components/RunwayNav";
import type { CTask, CReminder } from "@/lib/cockpit";
import { fmtDateWeekday } from "@/lib/format";

// Local state that flips instantly on click, then re-syncs with the server value
// once the action has revalidated the page.
function useLocal(server: boolean): [boolean, (v: boolean) => void] {
  const [v, setV] = useState(server);
  useEffect(() => setV(server), [server]);
  return [v, setV];
}

function Check({ on, late, label, onToggle }: { on: boolean; late: boolean; label: string; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-label={label} aria-pressed={on} className={`chk ${on ? "chk-on" : late ? "chk-late" : ""}`}>
      {on && (
        <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      )}
    </button>
  );
}

function dueText(t: CTask, done: boolean) {
  if (t.late === null) return "No date";
  if (t.late > 0) return done ? "Cleared" : `Rolled ${t.late}d`;
  if (t.late === 0) return "Today";
  if (t.late === -1) return "Tomorrow";
  return fmtDateWeekday(t.due);
}

export function TaskCard({ t, compact }: { t: CTask; compact?: boolean }) {
  const [done, setDone] = useLocal(t.done);
  const [, start] = useTransition();
  const late = t.late !== null && t.late > 0;
  function toggle() {
    const next = !done;
    setDone(next);
    start(() => {
      setTaskDone(t.id, next, t.status);
    });
  }
  return (
    <div className={`col-card flex items-start gap-2.5 rounded-[14px] border border-[var(--glass-line)] p-3 ${late ? "carried" : ""} ${done ? "is-done" : ""}`}>
      <Check on={done} late={late && !done} label={(done ? "Mark not done: " : "Mark done: ") + t.title} onToggle={toggle} />
      <Link href={`/task/${t.id}`} className="group flex min-w-0 flex-1 flex-col gap-2">
        <span className="ttl font-medium leading-snug group-hover:text-white">{t.title}</span>
        {!compact && t.next && !done && <span className="truncate text-[12px] text-ink3">Next: {t.next}</span>}
        <span className="flex items-center justify-between gap-2">
          <span className="rounded-full border border-[var(--glass-line2)] px-2 py-0.5 font-mono text-[10.5px] tracking-[0.1em] text-ink2">{t.code}</span>
          <span className={`font-mono text-[11px] ${late && !done ? "text-red" : "text-ink3"}`}>{dueText(t, done)}</span>
        </span>
      </Link>
    </div>
  );
}

export function ReminderItem({ r }: { r: CReminder }) {
  const [done, setDone] = useLocal(r.done);
  const [, start] = useTransition();
  const late = r.late > 0;
  const when = late ? (done ? "cleared" : `from ${fmtDateWeekday(r.on)}`) : r.late === 0 ? "today" : r.late === -1 ? "tomorrow" : fmtDateWeekday(r.on);
  return (
    <div className={`group flex items-center gap-3 rounded-[14px] border border-transparent px-2.5 py-2 ${late ? "carried" : ""} ${done ? "is-done" : ""}`}>
      <Check
        on={done}
        late={late && !done}
        label={(done ? "Uncheck: " : "Check: ") + r.title}
        onToggle={() => {
          const next = !done;
          setDone(next);
          start(() => {
            setReminderDone(r.id, next);
          });
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="ttl text-[13.5px] leading-snug">{r.title}</span>
        <span className={`font-mono text-[11px] ${r.linkKind === "project" ? "text-accent" : "text-ink3"}`}>{r.link}</span>
      </div>
      <span className={`font-mono text-[11px] ${late && !done ? "text-red" : "text-ink3"}`}>{when}</span>
      {!done && (
        <span className="flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          <button type="button" onClick={() => start(() => { snoozeReminder(r.id); })} className="pill h-7 px-2 text-[11px]" aria-label={`Move to tomorrow: ${r.title}`}>
            +1d
          </button>
          <button type="button" onClick={() => start(() => { deleteReminder(r.id); })} className="pill h-7 px-2 text-[11px]" aria-label={`Delete: ${r.title}`}>
            ✕
          </button>
        </span>
      )}
    </div>
  );
}

export function ReminderComposer({
  projects,
  people
}: {
  projects: { id: string; name: string }[];
  people: { id: string; name: string; is_me: boolean }[];
}) {
  const [when, setWhen] = useState("today");
  const [title, setTitle] = useState("");
  const [pending] = useTransition();
  return (
    <form
      action={async (fd: FormData) => {
        await addReminder(fd);
        setTitle("");
      }}
      className="flex flex-col gap-2 rounded-[16px] border border-[var(--glass-line)] bg-white/[0.03] p-3"
    >
      <input
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Remind me to…  e.g. follow up with Suyash on xyz"
        aria-label="New reminder"
        className="h-10 bg-transparent px-1 outline-none placeholder:text-ink3"
      />
      <input type="hidden" name="when" value={when} />
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          ["today", "Today"],
          ["tomorrow", "Tomorrow"],
          ["nextweek", "Next Mon"]
        ].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setWhen(k)} className={`pill ${when === k ? "pill-on" : ""}`}>
            {l}
          </button>
        ))}
        <select name="link" defaultValue="" aria-label="Link reminder to" className="field h-8 min-w-[120px] flex-1 py-0 text-[12.5px]">
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
        <button type="submit" disabled={pending || !title.trim()} className="btn btn-pri btn-sm">
          Add
        </button>
      </div>
    </form>
  );
}

export function Dock({ dash, frac, streak, best }: { dash: string; frac: string; streak: number; best: number }) {
  return (
    <div className="pointer-events-none sticky bottom-4 z-30 mt-10 flex justify-center px-3">
      <div className="glass pointer-events-auto flex flex-wrap items-center justify-center gap-3 rounded-[26px] px-3.5 py-2.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]" style={{ background: "rgba(16,18,22,0.8)" }}>
        <svg role="img" aria-label={`${frac} due items cleared`} width="40" height="40" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
          <circle cx="40" cy="40" r="34" fill="none" stroke="#dce8ef" strokeWidth="7" strokeLinecap="round" strokeDasharray={dash} transform="rotate(-90 40 40)" style={{ transition: "stroke-dasharray .6s" }} />
        </svg>
        <span className="font-mono text-[13px]">{frac} due</span>
        <button type="button" className="btn btn-pri btn-sm" onClick={() => openCapture("reminder")}>
          + Reminder
        </button>
        <button type="button" className="btn btn-sm" onClick={() => openCapture("task")}>
          + Task
        </button>
        <button type="button" className="btn btn-sm" onClick={() => openCapture("inbox")}>
          + Inbox
        </button>
        <span className="flex items-center gap-1.5 border-l border-[var(--glass-line)] pl-3 font-mono text-[13px] text-[#e9d9c3]" title={`Best: ${best} days`}>
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3c2 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z" />
          </svg>
          {streak}d
        </span>
      </div>
    </div>
  );
}
