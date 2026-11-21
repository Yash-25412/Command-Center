"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PIANO_DATA from "./data/piano.json";
import PHYSICAL_DATA from "./data/physical.json";
import { saveMasteryState } from "@/app/actions/mastery";

/*
  Life // Mastery, Runway edition.

  Same store, same Supabase row (mastery_state), same phase/gate/log data as
  before — only the surface changed. The old "telemetry" panels are reduced
  to one compact tool strip per skill (metronome + drone, hold timer, tempo
  counter, cadence beat). Gimmicks that recorded nothing (the on-screen
  keyboard, the lever/torque slider, the distance/HR dials) are gone; actual
  numbers belong in the session log notes.
*/

/* ------------------------------------------------------------------ data */
type SkillId = "piano" | "handstand" | "dragonflag" | "marathon";
const SKILLS: { id: SkillId; n: string; name: string; tint: string; body?: string }[] = [
  { id: "piano", n: "01", name: "Piano", tint: "#e9d9c3" },
  { id: "handstand", n: "02", name: "Handstand", tint: "#9dd3c8", body: "Wrists" },
  { id: "dragonflag", n: "03", name: "Dragon Flag", tint: "#f2b8a0", body: "Lower back / neck" },
  { id: "marathon", n: "04", name: "Marathon", tint: "#b8c7e8", body: "Shins / calves" }
];
const META = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<SkillId, (typeof SKILLS)[number]>;

function physicalProgram(id: string): any {
  return (PHYSICAL_DATA as any).programs.find((p: any) => p.program.id === id);
}
const PROGRAMS: Record<string, any> = {
  handstand: physicalProgram("handstand-zero-to-mastery"),
  dragonflag: physicalProgram("dragon-flag-zero-to-mastery"),
  marathon: physicalProgram("running-zero-to-marathon")
};
function getPhases(skill: string): any[] {
  return skill === "piano" ? (PIANO_DATA as any).phases : PROGRAMS[skill]?.phases || [];
}
function getPhase(skill: string, id: string): any {
  return getPhases(skill).find((p: any) => p.id === id) || getPhases(skill)[0];
}
function gateCriteriaOf(skill: string, phase: any): string[] {
  if (skill === "piano") return phase.gateCriteria || [];
  const g = (phase.milestones || []).find((m: any) => m.type === "gate");
  return g ? g.criteria : [];
}
// The gate milestone carries optional "passFeel" (what passing feels like) and
// "notYet" (signs you're not there) lists — physical programmes v1.1+.
function gateMilestoneOf(skill: string, phase: any): any {
  if (skill === "piano") return null;
  return (phase.milestones || []).find((m: any) => m.type === "gate") || null;
}
function checkpointsOf(skill: string, phase: any): any[] {
  if (skill === "piano") return phase.drills || [];
  return (phase.milestones || []).filter((m: any) => m.type === "checkpoint");
}
// Local calendar day (not UTC) so a 1am session counts for the right day.
function today(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SCHED = (PHYSICAL_DATA as any).weeklySchedule;
function todayLoad(): string {
  const d = SCHED.days.find((x: any) => x.day === DOW[new Date().getDay()]);
  return d ? d.load : "low";
}

function defaultStore(): any {
  return {
    activeSkill: "piano",
    activeTab: "workspace",
    activePhase: { piano: "phase-1", handstand: "hs-p1", dragonflag: "df-p1", marathon: "run-p1" },
    gateChecks: {},
    drillChecks: {},
    habitChecks: {},
    fieldNotes: {},
    preflightChecks: {},
    tissueStatus: {},
    calendarLog: {},
    logs: { piano: [], handstand: [], dragonflag: [], marathon: [] },
    recoveryBuff: {},
    gateClearedDates: {}
  };
}

function computeStreak(calendarLog: any): number {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const ds = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const e = calendarLog[ds];
    const ok = e && (e.piano || e.handstand || e.dragonflag || e.marathon || e.recoveryBuff);
    if (ok) streak++;
    else if (d.getDay() === 0 && !e) {
      if (ds !== today()) break;
    } else if (ds !== today()) break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/* ----------------------------------------------------------------- audio */
let _ctx: AudioContext | null = null;
function ctx(): AudioContext | null {
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {}
  }
  return _ctx;
}
function click(freq = 880, dur = 0.045, vol = 0.09) {
  const c = ctx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + dur);
}
function useMetronome(bpm: number, on: boolean, freq = 880) {
  useEffect(() => {
    if (!on || !bpm) return;
    click(freq);
    const id = setInterval(() => click(freq), 60000 / bpm);
    return () => clearInterval(id);
  }, [bpm, on, freq]);
}
function useDrone(on: boolean, freq = 261.63) {
  const ref = useRef<any>(null);
  useEffect(() => {
    const c = ctx();
    if (!c || !on) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
    o.frequency.value = freq;
    g.gain.value = 0.045;
    o.connect(g);
    g.connect(c.destination);
    o.start();
    ref.current = o;
    return () => {
      try {
        ref.current?.stop();
      } catch (e) {}
      ref.current = null;
    };
  }, [on, freq]);
}

/* -------------------------------------------------------------- atoms */
const C = 2 * Math.PI * 34;
function Ring({ p, size = 52, stroke = "#dce8ef", text }: { p: number; size?: number; stroke?: string; text?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 80 80" className="flex-none">
      <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
      <circle cx="40" cy="40" r="34" fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${C * Math.max(0, Math.min(1, p))} ${C}`} transform="rotate(-90 40 40)" style={{ transition: "stroke-dasharray .6s" }} />
      {text && (
        <text x="40" y="46" textAnchor="middle" fill="#e9ecef" fontFamily="var(--font-mono)" fontSize="17">
          {text}
        </text>
      )}
    </svg>
  );
}
function Tick({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-pressed={on} className={`chk ${on ? "chk-on" : ""}`}>
      {on && (
        <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      )}
    </button>
  );
}
function Stepper({ value, set, min, max, step = 1, unit, label }: { value: number; set: (v: number) => void; min: number; max: number; step?: number; unit: string; label: string }) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--glass-line2)] px-1" aria-label={label}>
      <button type="button" aria-label={`Decrease ${label}`} onClick={() => set(clamp(value - step))} className="h-8 w-8 rounded-full text-ink2 hover:text-white">
        −
      </button>
      <span className="min-w-[64px] text-center font-mono text-[13px]">
        {value} <span className="text-ink3">{unit}</span>
      </span>
      <button type="button" aria-label={`Increase ${label}`} onClick={() => set(clamp(value + step))} className="h-8 w-8 rounded-full text-ink2 hover:text-white">
        +
      </button>
    </span>
  );
}

/* -------------------------------------------------------- compact tools */
function PianoTools() {
  const [bpm, setBpm] = useState(80);
  const [metro, setMetro] = useState(false);
  const [drone, setDrone] = useState(false);
  useMetronome(bpm, metro);
  useDrone(drone);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Stepper value={bpm} set={setBpm} min={40} max={200} step={4} unit="bpm" label="tempo" />
      <button type="button" className={`pill ${metro ? "pill-on" : ""}`} onClick={() => setMetro(!metro)}>
        {metro ? "Metronome on" : "Metronome"}
      </button>
      <button type="button" className={`pill ${drone ? "pill-on" : ""}`} onClick={() => setDrone(!drone)}>
        {drone ? "Sa drone on" : "Sa drone"}
      </button>
    </div>
  );
}
function HoldTools() {
  const [running, setRunning] = useState(false);
  const [ms, setMs] = useState(0);
  const [best, setBest] = useState(0);
  const start = useRef(0);
  useEffect(() => {
    if (!running) return;
    start.current = Date.now() - ms;
    const id = setInterval(() => setMs(Date.now() - start.current), 100);
    return () => clearInterval(id);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps
  function toggle() {
    if (running) {
      setRunning(false);
      setBest((b) => Math.max(b, ms));
      click(660, 0.12);
    } else {
      setMs(0);
      setRunning(true);
      click(990, 0.08);
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-mono text-[26px] font-light tabular-nums">{(ms / 1000).toFixed(1)}s</span>
      <button type="button" className={`btn btn-sm ${running ? "" : "btn-pri"}`} onClick={toggle}>
        {running ? "Stop hold" : "Start hold"}
      </button>
      {best > 0 && <span className="font-mono text-[12px] text-ink3">best today {(best / 1000).toFixed(1)}s</span>}
    </div>
  );
}
function TempoTools() {
  const [tempo, setTempo] = useState(5);
  const [left, setLeft] = useState<number | null>(null);
  const [reps, setReps] = useState(0);
  useEffect(() => {
    if (left === null) return;
    if (left === 0) {
      click(520, 0.18);
      setReps((r) => r + 1);
      setLeft(null);
      return;
    }
    click(left === 1 ? 990 : 780, 0.05);
    const id = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Stepper value={tempo} set={setTempo} min={2} max={12} unit="s down" label="descent tempo" />
      <button type="button" className="btn btn-pri btn-sm" onClick={() => setLeft(tempo)} disabled={left !== null}>
        {left !== null ? `Lowering… ${left}` : "Start rep"}
      </button>
      <span className="font-mono text-[12px] text-ink3">{reps} reps</span>
    </div>
  );
}
function CadenceTools() {
  const [spm, setSpm] = useState(170);
  const [on, setOn] = useState(false);
  useMetronome(spm, on, 1100);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Stepper value={spm} set={setSpm} min={150} max={190} step={2} unit="spm" label="cadence" />
      <button type="button" className={`pill ${on ? "pill-on" : ""}`} onClick={() => setOn(!on)}>
        {on ? "Cadence beat on" : "Cadence beat"}
      </button>
    </div>
  );
}
const TOOLS: Record<SkillId, { label: string; El: () => JSX.Element }> = {
  piano: { label: "Metronome & drone", El: PianoTools },
  handstand: { label: "Hold timer", El: HoldTools },
  dragonflag: { label: "Tempo counter", El: TempoTools },
  marathon: { label: "Cadence beat", El: CadenceTools }
};

/* ------------------------------------------------------------- dossier */
function Dossier({ skill, phase, store, setStore }: { skill: SkillId; phase: any; store: any; setStore: any }) {
  const [tab, setTab] = useState("focus");
  useEffect(() => setTab("focus"), [skill, phase.id]);
  const isPiano = skill === "piano";
  const gate = gateCriteriaOf(skill, phase);
  const gk = (i: number) => `${skill}-${phase.id}-gate-${i}`;
  const gateDone = gate.filter((_, i) => store.gateChecks[gk(i)]).length;
  const checkpoints = checkpointsOf(skill, phase);
  const gateMs = gateMilestoneOf(skill, phase);
  const noteKey = `${skill}-${phase.id}`;
  const habitKey = `${skill}-${phase.id}-habit-${today()}`;
  const logs: any[] = store.logs[skill] || [];
  const phaseLogs = logs.map((entry, idx) => ({ entry, idx })).filter((x) => x.entry.phaseId === phase.id).reverse();

  function toggleGate(i: number) {
    setStore((s: any) => {
      const checks = { ...s.gateChecks, [gk(i)]: !s.gateChecks[gk(i)] };
      const all = gate.length > 0 && gate.every((_, j) => checks[gk(j)]);
      const cleared = { ...(s.gateClearedDates || {}) };
      if (all && !cleared[noteKey]) cleared[noteKey] = today();
      return { ...s, gateChecks: checks, gateClearedDates: cleared };
    });
  }
  const cpKey = (i: number) => `${skill}-${phase.id}-cp-${i}`;
  const toggleCp = (i: number) => setStore((s: any) => ({ ...s, drillChecks: { ...s.drillChecks, [cpKey(i)]: !s.drillChecks[cpKey(i)] } }));
  function deleteLog(idx: number) {
    if (!window.confirm("Delete this logged session? This can't be undone.")) return;
    setStore((s: any) => {
      const arr = [...(s.logs[skill] || [])];
      const removed = arr.splice(idx, 1)[0];
      const cal = { ...s.calendarLog };
      if (removed && !arr.some((l: any) => l.date === removed.date) && cal[removed.date]) {
        const day = { ...cal[removed.date] };
        delete day[skill];
        cal[removed.date] = day;
      }
      return { ...s, logs: { ...s.logs, [skill]: arr }, calendarLog: cal };
    });
  }

  const tabs: [string, string][] = isPiano
    ? [["focus", "Focus"], ["theory", "Theory"], ["practice", "Drills & practice"], ["gate", `Gate ${gateDone}/${gate.length}`], ["notes", "Notes"], ["log", `Log ${phaseLogs.length}`]]
    : [["focus", "Focus"], ["theory", "Form cues"], ["practice", "Protocol"], ["guard", "Guardrails"], ["gate", `Gate ${gateDone}/${gate.length}`], ["notes", "Notes"], ["log", `Log ${phaseLogs.length}`]];

  const Block = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
      <span className="eyebrow">{k}</span>
      <div className="text-[14px] leading-relaxed text-ink2">{children}</div>
    </div>
  );

  return (
    <section className="glass flex flex-col gap-5 rounded-[26px] p-6">
      <div className="flex flex-wrap gap-1.5">
        {tabs.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`pill ${tab === k ? "pill-on" : ""}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === "focus" && (
        <div className="rise flex flex-col gap-4">
          <Block k="What you unlock">{phase.mechanicalSkill || phase.coreFocus?.mechanicalSkill}</Block>
          <Block k="Mental model">{phase.mentalModel || phase.coreFocus?.mentalModel}</Block>
          {phase.biomechanicalUnlock && <Block k="Bottleneck">{phase.biomechanicalUnlock}</Block>}
          {phase.frequency && <Block k="Frequency">{phase.frequency}</Block>}
          {phase.offKeyboardHabit && (
            <div className="flex items-center gap-3 rounded-[16px] border border-dashed border-[var(--glass-line2)] p-3.5">
              <Tick on={!!store.habitChecks[habitKey]} onClick={() => setStore((s: any) => ({ ...s, habitChecks: { ...s.habitChecks, [habitKey]: !s.habitChecks[habitKey] } }))} label="Micro-habit done today" />
              <span className="flex flex-col">
                <span className="text-[13.5px] font-medium">{phase.offKeyboardHabit.title}</span>
                <span className="text-[12.5px] text-ink3">{phase.offKeyboardHabit.task}</span>
              </span>
            </div>
          )}
        </div>
      )}

      {tab === "theory" && (
        <div className="rise flex flex-col gap-3">
          {isPiano
            ? (phase.theoryConcepts || []).map((t: any, i: number) => (
                <div key={i} className="flex flex-col gap-1.5 rounded-[16px] border border-[var(--glass-line)] p-4">
                  <span className="font-medium">{t.title}</span>
                  <span className="text-[13.5px] leading-relaxed text-ink2">{t.explanation}</span>
                  {t.bridge && <span className="rounded-[12px] bg-white/[0.03] px-3 py-2 text-[12.5px] text-teal">Sargam bridge · {t.bridge}</span>}
                </div>
              ))
            : (phase.formCues || []).map((f: any, i: number) => (
                <div key={i} className="flex flex-col gap-1 rounded-[16px] border border-[var(--glass-line)] p-4">
                  <span className="font-medium">{f.cue}</span>
                  <span className="text-[13.5px] leading-relaxed text-ink2">{f.why}</span>
                </div>
              ))}
          {!isPiano && (phase.theoryConcepts || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {phase.theoryConcepts.map((t: string, i: number) => (
                <span key={i} className="rounded-full border border-[var(--glass-line)] px-3 py-1 text-[12px] text-ink2">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "practice" && (
        <div className="rise flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="eyebrow mb-1">{isPiano ? "Daily blueprint" : "Daily protocol"}</span>
            {(phase.dailyPractice || []).map((d: any, i: number) => (
              <div key={i} className="grid grid-cols-[96px_1fr] gap-3 border-b border-[var(--glass-line)] py-2.5 last:border-0">
                <span className="font-mono text-[11.5px] text-ink3">
                  {isPiano ? `${d.time} min` : `Slot ${d.slot} · ${d.minutes}m`}
                  {d.bpm ? <><br />{d.bpm}</> : null}
                </span>
                <span className="flex flex-col">
                  <span className="text-[13.5px] font-medium">{d.label}</span>
                  <span className="text-[12.5px] text-ink3">
                    {d.task}
                    {d.prescription ? ` — ${d.prescription}` : ""}
                  </span>
                  {(d.steps?.length || d.feel) && (
                    <details className="group mt-1.5">
                      <summary className="w-fit cursor-pointer list-none font-mono text-[11px] tracking-[0.08em] text-accent hover:text-white">
                        <span className="group-open:hidden">+ How to · how it should feel</span>
                        <span className="hidden group-open:inline">− Hide</span>
                      </summary>
                      <div className="rise mt-2 flex flex-col gap-2.5 rounded-[14px] border border-[var(--glass-line)] bg-white/[0.02] p-3.5">
                        {d.steps?.length > 0 && (
                          <ol className="flex list-decimal flex-col gap-1.5 pl-4 text-[13px] leading-relaxed text-ink2 marker:font-mono marker:text-[11px] marker:text-ink3">
                            {d.steps.map((st: string, j: number) => (
                              <li key={j}>{st}</li>
                            ))}
                          </ol>
                        )}
                        {d.feel && (
                          <p className="m-0 border-t border-[var(--glass-line)] pt-2.5 text-[13px] leading-relaxed text-ink2">
                            <span className="eyebrow mr-2 text-teal">Should feel</span>
                            {d.feel}
                          </p>
                        )}
                      </div>
                    </details>
                  )}
                </span>
              </div>
            ))}
          </div>
          {checkpoints.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="eyebrow mb-1">{isPiano ? "Drills" : "Checkpoints"}</span>
              {checkpoints.map((c: any, i: number) => (
                <div key={i} className={`flex items-center gap-3 rounded-[12px] px-2 py-2 ${store.drillChecks[cpKey(i)] ? "is-done" : ""}`}>
                  <Tick on={!!store.drillChecks[cpKey(i)]} onClick={() => toggleCp(i)} label={c.title} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="ttl text-[13.5px] font-medium">{c.title}</span>
                    <span className="text-[12.5px] text-ink3">{c.description || (c.criteria || []).join(" ")}</span>
                  </span>
                  {c.target && <span className="rounded-full border border-[var(--glass-line)] px-2.5 py-0.5 font-mono text-[11px] text-ink2">{c.target}</span>}
                </div>
              ))}
            </div>
          )}
          {(phase.resources?.length || phase.youtubeQueries?.length) && (
            <details className="rounded-[16px] border border-[var(--glass-line)] p-3.5">
              <summary className="cursor-pointer text-[13px] font-medium text-ink2">Resources &amp; searches</summary>
              <div className="mt-3 flex flex-col gap-2">
                {(phase.resources || []).map((r: any, i: number) => (
                  <span key={i} className="text-[13px]">
                    <span className="mr-2 font-mono text-[10.5px] text-ink3">{r.kind}</span>
                    <span className="font-medium">{r.name}</span> <span className="text-ink3">— {r.description}</span>
                  </span>
                ))}
                <div className="flex flex-wrap gap-1.5">
                  {(phase.youtubeQueries || []).map((q: string, i: number) => (
                    <a key={i} target="_blank" rel="noopener noreferrer" href={"https://www.youtube.com/results?search_query=" + encodeURIComponent(q)} className="pill inline-flex items-center">
                      {q}
                    </a>
                  ))}
                </div>
              </div>
            </details>
          )}
        </div>
      )}

      {tab === "guard" && phase.guardrails && (
        <div className="rise flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="eyebrow mb-1 text-teal">Pre-flight</span>
              {(phase.guardrails.dos || []).map((d: string, i: number) => {
                const k = `${skill}-${phase.id}-pf-${i}`;
                return (
                  <div key={i} className={`flex items-center gap-3 rounded-[12px] px-1.5 py-1.5 ${store.preflightChecks[k] ? "is-done" : ""}`}>
                    <Tick on={!!store.preflightChecks[k]} onClick={() => setStore((s: any) => ({ ...s, preflightChecks: { ...s.preflightChecks, [k]: !s.preflightChecks[k] } }))} label={d} />
                    <span className="ttl text-[13px]">{d}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="eyebrow mb-1 text-red">Form breakdown</span>
              {(phase.guardrails.donts || []).map((d: string, i: number) => (
                <span key={i} className="text-[13px] text-ink2">
                  <span className="mr-2 text-red">✕</span>
                  {d}
                </span>
              ))}
            </div>
          </div>
          {(phase.formBreakSigns || []).length > 0 && (
            <div className="flex flex-col gap-1.5 rounded-[16px] border border-[var(--glass-line)] p-4">
              <span className="eyebrow text-amber">Form break signs · end the set</span>
              {phase.formBreakSigns.map((f: string, i: number) => (
                <span key={i} className={`text-[13px] leading-relaxed ${/^rule:/i.test(f) ? "mt-1 font-medium text-ink" : "text-ink2"}`}>
                  {!/^rule:/i.test(f) && <span className="mr-2 text-amber">·</span>}
                  {f}
                </span>
              ))}
            </div>
          )}
          {phase.guardrails.stopRule && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[16px] border border-[rgba(233,195,138,0.35)] bg-[rgba(233,195,138,0.06)] p-3.5 text-[13px]">
                <span className="eyebrow text-amber">Amber · downgrade</span>
                <p className="mt-1.5 text-ink2">{phase.guardrails.stopRule.amber}</p>
              </div>
              <div className="rounded-[16px] border border-[rgba(255,90,95,0.35)] bg-[rgba(255,90,95,0.06)] p-3.5 text-[13px]">
                <span className="eyebrow text-red">Red · stop now</span>
                <p className="mt-1.5 text-ink2">{phase.guardrails.stopRule.red}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "gate" && (
        <div className="rise flex flex-col gap-1">
          {gate.map((c, i) => (
            <div key={i} className={`flex items-center gap-3 rounded-[12px] px-2 py-2.5 ${store.gateChecks[gk(i)] ? "is-done" : ""}`}>
              <Tick on={!!store.gateChecks[gk(i)]} onClick={() => toggleGate(i)} label={c} />
              <span className="ttl text-[14px]">{c}</span>
            </div>
          ))}
          {gateMs && (gateMs.passFeel?.length > 0 || gateMs.notYet?.length > 0) && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {gateMs.passFeel?.length > 0 && (
                <div className="flex flex-col gap-1.5 rounded-[16px] border border-[rgba(157,211,200,0.3)] bg-[rgba(157,211,200,0.05)] p-4">
                  <span className="eyebrow text-teal">Passing feels like</span>
                  {gateMs.passFeel.map((f: string, i: number) => (
                    <span key={i} className="text-[13px] leading-relaxed text-ink2">{f}</span>
                  ))}
                </div>
              )}
              {gateMs.notYet?.length > 0 && (
                <div className="flex flex-col gap-1.5 rounded-[16px] border border-[rgba(233,195,138,0.3)] bg-[rgba(233,195,138,0.05)] p-4">
                  <span className="eyebrow text-amber">Not yet if</span>
                  {gateMs.notYet.map((f: string, i: number) => (
                    <span key={i} className="text-[13px] leading-relaxed text-ink2">{f}</span>
                  ))}
                </div>
              )}
            </div>
          )}
          {gate.length > 0 && gateDone === gate.length && (
            <div className="rise mt-2 rounded-[14px] px-4 py-3 font-semibold text-[#07080a]" style={{ background: "linear-gradient(135deg,#F4F7F9,#C9DAE4)" }}>
              Gate cleared{store.gateClearedDates?.[noteKey] ? ` on ${store.gateClearedDates[noteKey]}` : ""} — next phase unlocked.
            </div>
          )}
        </div>
      )}

      {tab === "notes" && (
        <div className="rise flex flex-col gap-2.5">
          {(phase.fieldNotePrompts || phase.phaseLearningsPrompts || []).map((p: string, i: number) => (
            <span key={i} className="text-[13px] text-ink3">· {p}</span>
          ))}
          <textarea
            rows={7}
            aria-label="Field notes"
            className="field resize-y leading-relaxed"
            placeholder="Reflections, numbers, breakthroughs…"
            value={store.fieldNotes[noteKey] || ""}
            onChange={(e) => {
              const v = e.target.value;
              setStore((s: any) => ({ ...s, fieldNotes: { ...s.fieldNotes, [noteKey]: v } }));
            }}
          />
          <span className="font-mono text-[11px] text-ink3">Autosaved</span>
        </div>
      )}

      {tab === "log" && (
        <div className="rise flex flex-col gap-3">
          {phaseLogs.length === 0 && <span className="text-[13px] text-ink3">Nothing logged in this phase yet.</span>}
          {phaseLogs.map(({ entry, idx }) => {
            const items = entry.protocolItems || [];
            return (
              <div key={idx} className="flex flex-col gap-2 rounded-[16px] border border-[var(--glass-line)] p-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[12.5px]" style={{ color: META[skill].tint }}>
                    {entry.date}
                  </span>
                  <span className="flex items-center gap-3">
                    {items.length > 0 && (
                      <span className="font-mono text-[11px] text-ink3">
                        {items.filter((x: any) => x.done).length}/{items.length} done
                      </span>
                    )}
                    <button type="button" onClick={() => deleteLog(idx)} className="font-mono text-[11px] text-red hover:underline">
                      Delete
                    </button>
                  </span>
                </div>
                {items.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((x: any, j: number) => (
                      <span key={j} className={`rounded-full border px-2.5 py-0.5 text-[11.5px] ${x.done ? "border-[var(--glass-line2)] text-ink" : "border-[var(--glass-line)] text-ink3 line-through"}`}>
                        {x.label}
                      </span>
                    ))}
                  </div>
                )}
                {entry.notes && <p className="text-[13px] text-ink2">{entry.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* --------------------------------------------------------------- week */
function WeekView({ store, setStore }: { store: any; setStore: any }) {
  const dowToday = DOW[new Date().getDay()];
  const buffKey = "buff-" + today();
  const buff = store.recoveryBuff[buffKey] || {};
  const allBuff = SCHED.restDayBuff.checklist.every((_: any, i: number) => buff[i]);
  const buffLogged = !!store.calendarLog[today()]?.recoveryBuff;
  const loadTone: Record<string, string> = { high: "text-red border-[rgba(255,90,95,0.4)]", medium: "text-amber border-[rgba(233,195,138,0.4)]", moderate: "text-amber border-[rgba(233,195,138,0.4)]", low: "text-teal border-[rgba(157,211,200,0.4)]", rest: "text-ink2 border-[var(--glass-line2)]" };

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const cells: (number | null)[] = [];
  for (let i = 0; i < new Date(y, m, 1).getDay(); i++) cells.push(null);
  for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) cells.push(d);

  return (
    <div className="rise flex flex-col gap-4">
      <div className="runway -mx-[clamp(18px,4vw,56px)] flex gap-3 overflow-x-auto px-[clamp(18px,4vw,56px)] pb-3">
        {SCHED.days.map((d: any) => {
          const on = d.day === dowToday;
          return (
            <div
              key={d.day}
              className="glass flex w-[220px] flex-none flex-col gap-2.5 rounded-[24px] p-4"
              style={on ? { borderColor: "rgba(220,232,239,0.35)", background: "linear-gradient(170deg, rgba(207,224,234,0.09), rgba(18,20,24,0.6))" } : undefined}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[26px] font-light tracking-[-0.02em]">{d.day}</span>
                <span className={`rounded-full border px-2 py-0.5 font-mono text-[10.5px] uppercase ${loadTone[d.load] || loadTone.rest}`}>
                  {d.load}
                  {d.buff ? " · buff" : ""}
                </span>
              </div>
              {[
                ["Gym", d.gym],
                ["Handstand", d.handstand],
                ["Dragon flag", d.dragonFlag],
                ["Run", d.run]
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col">
                  <span className="font-mono text-[10px] tracking-[0.14em] text-ink3">{String(k).toUpperCase()}</span>
                  <span className="text-[12.5px] leading-snug text-ink2">{v || "—"}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="glass flex flex-col gap-3 rounded-[24px] p-5">
          <div className="flex items-baseline justify-between">
            <span className="eyebrow">Consistency · {now.toLocaleString("en-US", { month: "long" })}</span>
            <span className="flex gap-2.5">
              {SKILLS.map((s) => (
                <span key={s.id} className="flex items-center gap-1 text-[11px] text-ink3">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.tint }} />
                  {s.name}
                </span>
              ))}
            </span>
          </div>
          <div className="grid max-w-[420px] grid-cols-7 gap-1.5">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i} className="text-center font-mono text-[10px] text-ink3">
                {d}
              </span>
            ))}
            {cells.map((d, i) => {
              if (!d) return <span key={i} />;
              const ds = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const e = store.calendarLog[ds] || {};
              const done = SKILLS.filter((s) => e[s.id]);
              const isToday = ds === today();
              return (
                <div
                  key={i}
                  title={[ds, ...done.map((s) => s.name), e.recoveryBuff ? "Recovery" : ""].filter(Boolean).join(" · ")}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[10px] border text-[11px]"
                  style={{
                    borderColor: isToday ? "#dce8ef" : "rgba(255,255,255,0.06)",
                    background: done.length ? `rgba(220,232,239,${0.04 + done.length * 0.06})` : e.recoveryBuff ? "rgba(157,211,200,0.12)" : "transparent"
                  }}
                >
                  <span className={done.length ? "text-ink" : "text-ink3"}>{d}</span>
                  <span className="flex gap-0.5">
                    {done.map((s) => (
                      <span key={s.id} className="h-1 w-1 rounded-full" style={{ background: s.tint }} />
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="glass flex flex-col gap-3 rounded-[24px] p-5">
          <span className="eyebrow text-teal">{SCHED.restDayBuff.name}</span>
          <span className="text-[13px] text-ink3">{SCHED.restDayBuff.rule}</span>
          {SCHED.restDayBuff.checklist.map((c: string, i: number) => (
            <div key={i} className={`flex items-center gap-3 ${buff[i] ? "is-done" : ""}`}>
              <Tick
                on={!!buff[i]}
                onClick={() => setStore((s: any) => ({ ...s, recoveryBuff: { ...s.recoveryBuff, [buffKey]: { ...(s.recoveryBuff[buffKey] || {}), [i]: !(s.recoveryBuff[buffKey] || {})[i] } } }))}
                label={c}
              />
              <span className="ttl text-[13.5px]">{c}</span>
            </div>
          ))}
          <button
            type="button"
            disabled={!allBuff || buffLogged}
            onClick={() => setStore((s: any) => ({ ...s, calendarLog: { ...s.calendarLog, [today()]: { ...(s.calendarLog[today()] || {}), recoveryBuff: true } } }))}
            className="btn btn-pri mt-1 w-fit disabled:opacity-40"
          >
            {buffLogged ? "Recovery day logged" : "Log recovery day"}
          </button>
          <details className="mt-1 border-t border-[var(--glass-line)] pt-3">
            <summary className="cursor-pointer text-[13px] font-medium text-ink2">Collision &amp; load rules</summary>
            <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[13px] text-ink3">
              {SCHED.rules.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </details>
        </section>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- log modal */
function LogModal({ skill, phase, store, setStore, onClose }: { skill: SkillId; phase: any; store: any; setStore: any; onClose: () => void }) {
  const items: any[] = phase.dailyPractice || [];
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [notes, setNotes] = useState("");
  const done = items.filter((_, i) => checked[i]).length;
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  function submit() {
    if ((store.logs[skill] || []).some((l: any) => l.date === today() && l.phaseId === phase.id) && !window.confirm(`You've already logged ${META[skill].name} today in this phase. Log another session?`)) return;
    const protocolItems = items.map((it, i) => ({ label: it.label, detail: it.task || it.prescription || "", done: !!checked[i] }));
    setStore((s: any) => ({
      ...s,
      logs: { ...s.logs, [skill]: [...(s.logs[skill] || []), { date: today(), phaseId: phase.id, protocolItems, notes }] },
      calendarLog: { ...s.calendarLog, [today()]: { ...(s.calendarLog[today()] || {}), [skill]: true } }
    }));
    onClose();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[10vh] backdrop-blur-md" onClick={onClose}>
      <div role="dialog" aria-label="Log today's session" className="rise glass flex max-h-[80vh] w-full max-w-[600px] flex-col gap-4 overflow-y-auto rounded-[24px] p-5" style={{ background: "rgba(14,16,19,0.94)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-1">
          <span className="eyebrow">Log today · {META[skill].name}</span>
          <span className="text-[22px] font-light tracking-[-0.02em]">{phase.title}</span>
        </div>
        {items.length === 0 && <span className="text-[13px] text-ink3">No protocol items for this phase — add a note instead.</span>}
        <div className="flex flex-col">
          {items.map((it, i) => (
            <div key={i} className={`flex items-start gap-3 border-b border-[var(--glass-line)] py-2.5 last:border-0 ${checked[i] ? "is-done" : ""}`}>
              <Tick on={!!checked[i]} onClick={() => setChecked((c) => ({ ...c, [i]: !c[i] }))} label={it.label} />
              <span className="flex flex-col">
                <span className="ttl text-[13.5px] font-medium">{it.label}</span>
                <span className="text-[12.5px] text-ink3">
                  {it.task}
                  {it.prescription ? ` — ${it.prescription}` : ""}
                </span>
              </span>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <span className="font-mono text-[11.5px] text-ink3">
            {done} / {items.length} done
          </span>
        )}
        <textarea rows={3} aria-label="Session notes" className="field resize-none" placeholder="Numbers worth keeping — hold time, reps, pace, how it felt…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-pri" onClick={submit}>
            Log session
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- app */
export default function MasteryOS({ initialStore }: { initialStore?: any }) {
  // Seed once from the server; after that the client store is the source of
  // truth and every change is pushed (debounced) to Supabase.
  const [store, setRaw] = useState<any>(() => ({ ...defaultStore(), ...(initialStore || {}) }));
  const [logOpen, setLogOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const setStore = useCallback((fn: any) => setRaw((p: any) => (typeof fn === "function" ? fn(p) : fn)), []);
  const saveT = useRef<any>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    clearTimeout(saveT.current);
    saveT.current = setTimeout(() => {
      saveMasteryState(store).catch(() => {});
    }, 800);
    return () => clearTimeout(saveT.current);
  }, [store]);

  const isWeek = store.activeTab === "schedule";
  const skill: SkillId = (store.activeSkill as SkillId) || "piano";
  const phases = getPhases(skill);
  const phase = getPhase(skill, store.activePhase[skill]);
  const phaseIdx = Math.max(0, phases.findIndex((p: any) => p.id === phase.id));
  const gate = gateCriteriaOf(skill, phase);
  const gateDone = gate.filter((_, i) => store.gateChecks[`${skill}-${phase.id}-gate-${i}`]).length;
  const streak = computeStreak(store.calendarLog);
  const load = todayLoad();
  const loggedToday = (s: SkillId) => !!store.calendarLog[today()]?.[s];
  const statusKey = `${skill}-${today()}`;
  const status: string = store.tissueStatus[statusKey] || "green";
  const Tool = TOOLS[skill];

  const setStatus = (v: string) => setStore((s: any) => ({ ...s, tissueStatus: { ...s.tissueStatus, [statusKey]: v } }));
  const selectSkill = (id: SkillId) => {
    setToolsOpen(false);
    setStore((p: any) => ({ ...p, activeSkill: id, activeTab: "workspace" }));
  };

  function exportData() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(store, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "life-mastery-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        setStore(JSON.parse(String(r.result)));
      } catch (err) {
        alert("That file isn't a valid backup.");
      }
    };
    r.readAsText(f);
  }

  const statusCopy: Record<string, string> = {
    green: "Clear — train as prescribed.",
    amber: phase.guardrails?.stopRule?.amber || "Something's niggling — downgrade today's load.",
    red: phase.guardrails?.stopRule?.red || "Stop. Recovery only today."
  };

  return (
    <div className="rise flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="eyebrow">Life · Mastery</span>
          <h1 className="text-[clamp(30px,3.8vw,52px)] font-light leading-none tracking-[-0.03em]">Four crafts, one practice.</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="glass rounded-full px-3.5 py-2 font-mono text-[12px] text-[#e9d9c3]">{streak}-day practice streak</span>
          <span className={`glass rounded-full px-3.5 py-2 font-mono text-[12px] uppercase ${load === "high" ? "text-red" : load === "low" || load === "rest" ? "text-teal" : "text-amber"}`}>
            Today · {load} load
          </span>
          <details className="relative">
            <summary className="btn btn-sm list-none" aria-label="Backup">
              Backup
            </summary>
            <div className="glass absolute right-0 top-10 z-20 flex flex-col gap-1.5 rounded-[16px] p-2" style={{ background: "rgba(14,16,19,0.94)" }}>
              <button type="button" className="btn btn-sm justify-start" onClick={exportData}>
                Export JSON
              </button>
              <label className="btn btn-sm cursor-pointer justify-start">
                Import JSON
                <input type="file" accept="application/json" onChange={importData} className="hidden" />
              </label>
            </div>
          </details>
        </div>
      </div>

      {/* Skill rail */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        {SKILLS.map((s) => {
          const ph = getPhases(s.id);
          const cur = getPhase(s.id, store.activePhase[s.id]);
          const i = Math.max(0, ph.findIndex((p: any) => p.id === cur.id));
          const on = !isWeek && skill === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => selectSkill(s.id)}
              className="glass col-card flex items-center gap-3.5 rounded-[22px] p-4 text-left"
              style={on ? { borderColor: s.tint, background: "rgba(220,232,239,0.06)" } : undefined}
              aria-pressed={on}
            >
              <Ring p={(i + 0.5) / Math.max(1, ph.length)} stroke={s.tint} text={s.n} />
              <span className="flex min-w-0 flex-col">
                <span className="text-[15px] font-semibold">{s.name}</span>
                <span className="text-[12px] text-ink3">
                  Phase {i + 1} of {ph.length}
                </span>
                <span className={`font-mono text-[10.5px] ${loggedToday(s.id) ? "text-teal" : "text-ink3"}`}>{loggedToday(s.id) ? "● logged today" : "○ not yet today"}</span>
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setStore((p: any) => ({ ...p, activeTab: "schedule" }))}
          className="glass col-card flex items-center gap-3.5 rounded-[22px] p-4 text-left"
          style={isWeek ? { borderColor: "#dce8ef", background: "rgba(220,232,239,0.06)" } : undefined}
          aria-pressed={isWeek}
        >
          <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full border border-[var(--glass-line2)] font-mono text-[12px] text-ink2">7d</span>
          <span className="flex flex-col">
            <span className="text-[15px] font-semibold">The week</span>
            <span className="text-[12px] text-ink3">Schedule, recovery, calendar</span>
          </span>
        </button>
      </div>

      {isWeek ? (
        <WeekView store={store} setStore={setStore} />
      ) : (
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
            {/* Phase stepper */}
            <section className="glass flex flex-col gap-4 rounded-[26px] p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <span className="eyebrow">
                    {META[skill].name} · {phase.weeks || phase.weeksLabel} · {phase.durationWeeks} weeks
                  </span>
                  <h2 className="text-[clamp(24px,2.4vw,32px)] font-light leading-tight tracking-[-0.02em]">{phase.title}</h2>
                </div>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {phases.map((p: any, i: number) => {
                  const g = gateCriteriaOf(skill, p);
                  const cleared = g.length > 0 && g.every((_, gi) => store.gateChecks[`${skill}-${p.id}-gate-${gi}`]);
                  const on = p.id === phase.id;
                  return (
                    <div key={p.id} className="flex flex-none items-center gap-1.5">
                      <button
                        type="button"
                        title={p.title}
                        aria-label={`Phase ${i + 1}: ${p.title}`}
                        aria-current={on}
                        onClick={() => setStore((s: any) => ({ ...s, activePhase: { ...s.activePhase, [skill]: p.id } }))}
                        className="flex h-9 min-w-9 items-center justify-center rounded-full border px-3 font-mono text-[12px] transition-all"
                        style={
                          on
                            ? { background: META[skill].tint, borderColor: META[skill].tint, color: "#07080a", boxShadow: `0 0 18px ${META[skill].tint}66` }
                            : cleared
                            ? { borderColor: "rgba(220,232,239,0.4)", color: "#dce8ef", background: "rgba(220,232,239,0.08)" }
                            : { borderColor: "rgba(255,255,255,0.14)", color: "#9aa3ab" }
                        }
                      >
                        {cleared && !on ? "✓" : `P${i + 1}`}
                      </button>
                      {i < phases.length - 1 && <span className="h-px w-6 bg-white/15" />}
                    </div>
                  );
                })}
                <span className="ml-auto pl-3 font-mono text-[12px] text-ink3">
                  {phaseIdx + 1}/{phases.length}
                </span>
              </div>
            </section>
            <Dossier skill={skill} phase={phase} store={store} setStore={setStore} />
          </div>

          {/* Today rail */}
          <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
            <section className="glass flex flex-col gap-4 rounded-[26px] p-5" style={{ background: "linear-gradient(170deg, rgba(207,224,234,0.08), rgba(18,20,24,0.6))", borderColor: "rgba(220,232,239,0.22)" }}>
              <div className="flex items-center gap-3.5">
                <Ring p={gate.length ? gateDone / gate.length : 0} size={60} stroke={META[skill].tint} text={`${gateDone}/${gate.length}`} />
                <span className="flex flex-col">
                  <span className="eyebrow">Phase gate</span>
                  <span className="text-[13px] text-ink2">{gate.length - gateDone ? `${gate.length - gateDone} criteria to unlock the next phase` : "Cleared"}</span>
                </span>
              </div>
              <button type="button" className="btn btn-pri h-11 justify-center" onClick={() => setLogOpen(true)}>
                {loggedToday(skill) ? "Log another session" : "+ Log today’s session"}
              </button>
            </section>

            {META[skill].body && (
              <section className="glass flex flex-col gap-3 rounded-[26px] p-5">
                <span className="eyebrow">Body check · {META[skill].body}</span>
                <div className="flex gap-1.5">
                  {[
                    ["green", "Green", "rgba(157,211,200"],
                    ["amber", "Amber", "rgba(233,195,138"],
                    ["red", "Red", "rgba(255,140,143"]
                  ].map(([k, l, c]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setStatus(k)}
                      aria-pressed={status === k}
                      className="h-9 flex-1 rounded-full border text-[12.5px] font-medium transition-all"
                      style={status === k ? { borderColor: `${c},0.8)`, background: `${c},0.14)`, color: `${c},1)` } : { borderColor: "rgba(255,255,255,0.12)", color: "#9aa3ab" }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <span className={`text-[13px] leading-snug ${status === "red" ? "text-red" : status === "amber" ? "text-amber" : "text-ink2"}`}>{statusCopy[status]}</span>
              </section>
            )}

            <section className="glass flex flex-col gap-3 rounded-[26px] p-5">
              <button type="button" onClick={() => setToolsOpen(!toolsOpen)} className="flex items-center justify-between text-left" aria-expanded={toolsOpen}>
                <span className="eyebrow">Practice tool · {Tool.label}</span>
                <span className="font-mono text-[12px] text-ink3">{toolsOpen ? "hide" : "open"}</span>
              </button>
              {toolsOpen && (
                <div className="rise">
                  <Tool.El />
                </div>
              )}
            </section>
          </aside>
        </div>
      )}

      {logOpen && <LogModal skill={skill} phase={phase} store={store} setStore={setStore} onClose={() => setLogOpen(false)} />}
    </div>
  );
}
