"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import styles from "./mastery.module.css";
import PIANO_DATA from "./data/piano.json";
import PHYSICAL_DATA from "./data/physical.json";
import { saveMasteryState } from "@/app/actions/mastery";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--jbmono" });

/* ============================== class helper ============================== */
function kebabToCamel(s: string): string {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames
    .filter(Boolean)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => (styles as any)[kebabToCamel(tok)] || (styles as any)[tok] || tok)
    .join(" ");
}

/* ============================== persistence ============================== */
// The store lives in Supabase (table `mastery_state`, see
// supabase/migration-mastery-os.sql) so progress survives across devices --
// this just defines the shape and merges in whatever the server loaded.
function defaultStore(): any {
  return {
    activeSkill: "piano",
    activeTab: "workspace",
    activePhase: { piano: "phase-1", handstand: "hs-p1", dragonflag: "df-p1", marathon: "run-p1" },
    gateChecks: {}, drillChecks: {}, habitChecks: {}, fieldNotes: {},
    preflightChecks: {}, tissueStatus: {}, calendarLog: {}, logs: { piano: [], handstand: [], dragonflag: [], marathon: [] },
    recoveryBuff: {}
  };
}

/* ============================== audio ============================== */
let _actx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (!_actx) { try { _actx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch (e) {} }
  return _actx;
}
function click(freq = 880, dur = 0.045, gainVal = 0.09) {
  const ctx = getCtx(); if (!ctx) return;
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.frequency.value = freq; osc.type = "sine";
  gain.gain.setValueAtTime(gainVal, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + dur);
}
function useMetronome(bpm: number, enabled: boolean, freq?: number) {
  useEffect(() => {
    if (!enabled || !bpm) return;
    const ms = 60000 / bpm;
    click(freq || 880);
    const id = setInterval(() => click(freq || 880), ms);
    return () => clearInterval(id);
  }, [bpm, enabled, freq]);
}
function useDrone(on: boolean, freq?: number) {
  const ref = useRef<any>(null);
  useEffect(() => {
    const ctx = getCtx(); if (!ctx) return;
    if (on) {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.frequency.value = freq || 261.63; osc.type = "triangle";
      gain.gain.value = 0.045;
      osc.connect(gain); gain.connect(ctx.destination); osc.start();
      ref.current = { osc, gain };
    }
    return () => { if (ref.current) { try { ref.current.osc.stop(); } catch (e) {} ref.current = null; } };
  }, [on, freq]);
}
function playNote(freq: number) {
  const ctx = getCtx(); if (!ctx) return;
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.type = "triangle"; osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.95);
}

/* ============================== data adapters ============================== */
const SKILL_META: Record<string, { label: string; short: string; color: string }> = {
  piano: { label: "01 PIANO", short: "PIANO", color: "var(--piano)" },
  handstand: { label: "02 HANDSTAND", short: "HANDSTAND", color: "var(--hs)" },
  dragonflag: { label: "03 DRAGON FLAG", short: "DRAGON FLAG", color: "var(--df)" },
  marathon: { label: "04 MARATHON", short: "MARATHON", color: "var(--run)" }
};

function physicalProgram(id: string): any {
  return (PHYSICAL_DATA as any).programs.find((p: any) => p.program.id === id);
}
const HS_PROGRAM = physicalProgram("handstand-zero-to-mastery");
const DF_PROGRAM = physicalProgram("dragon-flag-zero-to-mastery");
const RUN_PROGRAM = physicalProgram("running-zero-to-marathon");

function getPhases(skill: string): any[] {
  if (skill === "piano") return (PIANO_DATA as any).phases;
  if (skill === "handstand") return HS_PROGRAM.phases;
  if (skill === "dragonflag") return DF_PROGRAM.phases;
  if (skill === "marathon") return RUN_PROGRAM.phases;
  return [];
}
function getPhase(skill: string, id: string): any {
  return getPhases(skill).find((p: any) => p.id === id) || getPhases(skill)[0];
}
function gateCriteriaOf(skill: string, phase: any): string[] {
  if (skill === "piano") return phase.gateCriteria || [];
  const gateM = (phase.milestones || []).find((m: any) => m.type === "gate");
  return gateM ? gateM.criteria : [];
}
function checkpointsOf(skill: string, phase: any): any[] {
  if (skill === "piano") return phase.drills || [];
  return (phase.milestones || []).filter((m: any) => m.type === "checkpoint");
}
function today(): string { return new Date().toISOString().slice(0, 10); }
function toggleHabit(setStore: any, key: string) {
  setStore((s: any) => ({ ...s, habitChecks: { ...s.habitChecks, [key]: !s.habitChecks[key] } }));
}

/* ============================== small UI atoms ============================== */
function Badge({ children, cls }: { children: any; cls?: string }) {
  return <span className={cx("badge", cls)}>{children}</span>;
}

function ToggleSwitch({ on, onToggle, labelOn, labelOff, color }: any) {
  return (
    <div onClick={onToggle} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div className={cx("toggle")} style={{ background: on ? (color || "var(--emerald)") : "#30363D" }}>
        <div className={cx("knob")} style={{ position: "absolute", top: 3, left: on ? 40 : 4, width: 28, height: 28, borderRadius: 999, background: "#E6EDF3", transition: "left .18s ease", boxShadow: "0 1px 4px rgba(0,0,0,.4)" }}></div>
      </div>
      <span className={cx("mono")} style={{ fontSize: 11, color: on ? (color || "var(--emerald)") : "var(--ink-dim)" }}>{on ? labelOn : labelOff}</span>
    </div>
  );
}

function StatusSelector({ value, onChange, label }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span className={cx("eyebrow")}>{label}</span>
      <div className={cx("status-row")}>
        {["green", "amber", "red"].map((s) => (
          <div key={s} className={cx("status-btn", s, value === s && "on")} onClick={() => onChange(s)}>{s.toUpperCase()}</div>
        ))}
      </div>
    </div>
  );
}

// A plain number input + stepper is the real control -- direct, unambiguous,
// no gesture to learn. The dial underneath is a live readout you *can* also
// drag (pointer capture keeps tracking even once the cursor leaves the small
// circle, so fast drags don't jump or lose the gesture), with
// touch-action/userSelect locked down so dragging never highlights the number.
function Dial({ value, min, max, step, onChange, label, unit, color }: any) {
  const s = step || 1;
  const dragRef = useRef<any>({ active: false, startY: 0, startVal: value });
  useEffect(() => { dragRef.current.startVal = value; }, [value]);
  const frac = (value - min) / (max - min);
  const angle = -110 + frac * 220;
  function clamp(v: number) { return Math.max(min, Math.min(max, v)); }
  function onDown(e: any) {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    dragRef.current = { active: true, startY: e.clientY, startVal: value };
  }
  function onMove(e: any) {
    if (!dragRef.current.active) return;
    e.preventDefault();
    const delta = (dragRef.current.startY - e.clientY) * ((max - min) / 220);
    const next = clamp(Math.round((dragRef.current.startVal + delta) / s) * s);
    onChange(next);
  }
  function onUp(e: any) {
    dragRef.current.active = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
  }
  function nudge(dir: number) { onChange(clamp(Math.round((value + dir * s) / s) * s)); }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <span className={cx("eyebrow")}>{label}</span>
      <div
        className={cx("dial")}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{ touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
      >
        <div style={{ position: "absolute", width: 4, height: 58, top: 10, left: "50%", background: color || "var(--amber)", borderRadius: 2, transformOrigin: "bottom center", transform: `translateX(-50%) rotate(${angle}deg)`, boxShadow: `0 0 6px ${color || "var(--amber)"}`, pointerEvents: "none" }}></div>
        <span className={cx("mono")} style={{ fontSize: 22, fontWeight: 700, color: color || "var(--amber)", userSelect: "none", pointerEvents: "none" }}>{value}{unit || ""}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button type="button" className={cx("topbtn", "ghost")} style={{ padding: "4px 11px" }} onClick={() => nudge(-1)}>−</button>
        <input
          type="number"
          className={cx("mono")}
          value={value}
          min={min}
          max={max}
          step={s}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          style={{ width: 62, textAlign: "center" }}
        />
        <button type="button" className={cx("topbtn", "ghost")} style={{ padding: "4px 11px" }} onClick={() => nudge(1)}>+</button>
      </div>
    </div>
  );
}

function HoldTimer({ onFinish, color }: any) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);
  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now() - elapsed * 1000;
    const id = setInterval(() => setElapsed((Date.now() - startRef.current) / 1000), 50);
    return () => clearInterval(id);
  }, [running]);
  function toggle() {
    if (running) { setRunning(false); onFinish && onFinish(Math.round(elapsed * 10) / 10); }
    else { setElapsed(0); setRunning(true); }
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <span className={cx("eyebrow")}>HOLD TIMER</span>
      <div onClick={toggle} style={{ cursor: "pointer", width: 150, height: 150, borderRadius: 999, border: `2px solid ${running ? (color || "var(--emerald)") : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface2)", boxShadow: running ? `0 0 18px ${color || "var(--emerald)"}55` : "none" }}>
        <span className={cx("mono")} style={{ fontSize: 28, fontWeight: 700, color: running ? (color || "var(--emerald)") : "var(--ink)" }}>{elapsed.toFixed(1)}s</span>
      </div>
      <span className={cx("mono")} style={{ fontSize: 11, color: "var(--ink-dim)" }}>{running ? "tap to stop & record" : "tap to start"}</span>
    </div>
  );
}

/* ============================== guardrail banner ============================== */
function GuardBanner({ mode, text, color }: any) {
  const bg = color === "red" ? "rgba(239,68,68,.08)" : color === "amber" ? "rgba(245,158,11,.08)" : "rgba(16,185,129,.08)";
  const border = color === "red" ? "rgba(239,68,68,.3)" : color === "amber" ? "rgba(245,158,11,.3)" : "rgba(16,185,129,.3)";
  const ink = color === "red" ? "#fca5a5" : color === "amber" ? "#f0cf9b" : "#9fe8c8";
  const lbl = color === "red" ? "#EF4444" : color === "amber" ? "#F59E0B" : "#10B981";
  return (
    <div className={cx("guard-banner")} style={{ background: bg, borderColor: border }}>
      <span className={cx("mono")} style={{ fontSize: 10, letterSpacing: ".08em", color: lbl }}>{mode}</span>
      <span style={{ fontSize: 13, lineHeight: 1.55, color: ink }}>{text}</span>
    </div>
  );
}

/* ============================== chameleon telemetry per skill ============================== */
function PianoTelemetry({ store, setStore }: any) {
  const [bpm, setBpm] = useState(100);
  const [metroOn, setMetroOn] = useState(false);
  const [droneOn, setDroneOn] = useState(false);
  const [slotIdx, setSlotIdx] = useState(0);
  const [slotSecs, setSlotSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const slots = [
    { label: "0-5m Warm-up", secs: 5 * 60 },
    { label: "5-15m Core Technique", secs: 10 * 60 },
    { label: "15-22m Applied Repertoire", secs: 7 * 60 },
    { label: "22-25m Cooldown", secs: 3 * 60 }
  ];
  useMetronome(bpm, metroOn, 988);
  useDrone(droneOn, 261.63);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSlotSecs((s) => {
        if (s + 1 >= slots[slotIdx].secs) {
          if (slotIdx < slots.length - 1) { setSlotIdx((i) => i + 1); return 0; }
          setRunning(false); return s;
        }
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, slotIdx]);

  const WHITE = [{ n: "Sa", w: "C", f: 261.63 }, { n: "Re", w: "D", f: 293.66 }, { n: "Ga", w: "E", f: 329.63 }, { n: "Ma", w: "F", f: 349.23 }, { n: "Pa", w: "G", f: 392.0 }, { n: "Dha", w: "A", f: 440.0 }, { n: "Ni", w: "B", f: 493.88 }];
  const BLACK = [{ n: "k.Re", w: "C#", f: 277.18, pos: 14.28 }, { n: "k.Ga", w: "D#", f: 311.13, pos: 28.56 }, { n: "t.Ma", w: "F#", f: 369.99, pos: 57.14 }, { n: "k.Dha", w: "G#", f: 415.30, pos: 71.42 }, { n: "k.Ni", w: "A#", f: 466.16, pos: 85.70 }];

  return (
    <div className={cx("telemetry-deck")}>
      <div className={cx("card")} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <span className={cx("eyebrow")}>SARGAM / WESTERN OCTAVE MAP</span>
        <div className={cx("key-map")}>
          {WHITE.map((k, i) => <div key={i} className={cx("wkey")} onClick={() => playNote(k.f)}><b>{k.n}</b><span>{k.w}</span></div>)}
          {BLACK.map((k, i) => <div key={i} className={cx("bkey")} style={{ left: k.pos + "%" }} onClick={() => playNote(k.f)}>{k.n}</div>)}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div className={cx("pill", droneOn && "on")} onClick={() => setDroneOn(!droneOn)}>{droneOn ? "● Sa DRONE ON" : "○ Sa DRONE"}</div>
        </div>
      </div>

      <div className={cx("card")} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <span className={cx("eyebrow")}>TACTILE METRONOME &amp; 25-MIN SEQUENCER</span>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Dial value={bpm} min={40} max={200} onChange={setBpm} label="TEMPO BPM" color="var(--piano)" />
          <div className={cx("pill", metroOn && "on")} onClick={() => setMetroOn(!metroOn)}>{metroOn ? "● CLICK ON" : "○ CLICK"}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {slots.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: i === slotIdx ? 1 : 0.45 }}>
              <div style={{ width: 9, height: 9, borderRadius: 999, background: i < slotIdx ? "var(--emerald)" : (i === slotIdx ? "var(--emerald2)" : "#30363D"), boxShadow: i === slotIdx ? "0 0 6px var(--emerald2)" : "none" }}></div>
              <span style={{ fontSize: 12.5, flex: 1 }}>{s.label}</span>
              <span className={cx("mono")} style={{ fontSize: 11, color: "var(--ink-dim)" }}>{i === slotIdx ? Math.floor(slotSecs / 60) + ":" + String(slotSecs % 60).padStart(2, "0") + " / " + Math.floor(s.secs / 60) + ":00" : Math.floor(s.secs / 60) + " min"}</span>
            </div>
          ))}
        </div>
        <button className={cx("topbtn", "primary")} onClick={() => { if (!running) { setSlotIdx(0); setSlotSecs(0); } setRunning(!running); }}>{running ? "PAUSE SEQUENCE" : "START 25-MIN SESSION"}</button>
      </div>

      <div className={cx("card")} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span className={cx("eyebrow")}>5-MIN TENSION DROP RULE</span>
        <p style={{ fontSize: 13, color: "var(--ink-dim)", lineHeight: 1.6, margin: 0 }}>Every 5 minutes, drop your hands into your lap, shake them loose, then continue. Non-weighted keys build tension because nothing pushes back.</p>
        <ToggleSwitch on={store.habitChecks["piano-tension-" + today()] || false} onToggle={() => toggleHabit(setStore, "piano-tension-" + today())} labelOn="DROPPED TODAY" labelOff="TAP WHEN DONE" color="var(--piano)" />
      </div>
    </div>
  );
}

function HandstandTelemetry({ store, setStore }: any) {
  const [coldStart, setColdStart] = useState(false);
  const [catchRatio, setCatchRatio] = useState(0);
  const [holdVal, setHoldVal] = useState(0);
  const status = store.tissueStatus["handstand-" + today()] || "green";
  function setStatus(v: string) { setStore((s: any) => ({ ...s, tissueStatus: { ...s.tissueStatus, ["handstand-" + today()]: v } })); }
  return (
    <div className={cx("telemetry-deck")}>
      <div className={cx("card")} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <HoldTimer color="var(--hs)" onFinish={setHoldVal} />
        {holdVal > 0 && <span className={cx("mono")} style={{ marginTop: 10, fontSize: 12, color: "var(--ink-dim)" }}>last hold: {holdVal}s</span>}
      </div>
      <div className={cx("card")} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <span className={cx("eyebrow")}>KICK-UP CATCH RATIO</span>
        <div className={cx("mono")} style={{ fontSize: 40, fontWeight: 700, color: "var(--hs)", textAlign: "center" }}>{catchRatio}/10</div>
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} onClick={() => setCatchRatio(i + 1)} style={{ flex: 1, height: 24, borderRadius: 4, background: i < catchRatio ? "var(--hs)" : "#1c2128", cursor: "pointer" }}></div>
          ))}
        </div>
        <ToggleSwitch on={coldStart} onToggle={() => setColdStart(!coldStart)} labelOn="COLD-START ATTEMPT" labelOff="WARMED-UP ATTEMPT" color="var(--hs)" />
      </div>
      <div className={cx("card")} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <StatusSelector value={status} onChange={setStatus} label="WRIST STATUS" />
        <GuardBanner mode={status === "green" ? "CLEARED" : "CAUTION"} color={status} text={status === "red" ? "Stop all loaded wrist work for 48-72 hours. See a physio if it returns." : status === "amber" ? "Keep holds to 15s or less today; no heel pulls." : "Wrists clear — proceed with today's protocol."} />
      </div>
    </div>
  );
}

function DragonFlagTelemetry({ store, setStore }: any) {
  const LEVERS = ["Hollow", "Tuck", "Advanced Tuck", "Single-Leg", "Straddle", "Full Dragon Flag"];
  const TORQUE = [20, 45, 60, 75, 85, 100];
  const [leverIdx, setLeverIdx] = useState(1);
  const [tempo, setTempo] = useState(5);
  const [counting, setCounting] = useState(false);
  const [count, setCount] = useState(0);
  const status = store.tissueStatus["dragonflag-" + today()] || "green";
  function setStatus(v: string) { setStore((s: any) => ({ ...s, tissueStatus: { ...s.tissueStatus, ["dragonflag-" + today()]: v } })); }
  useEffect(() => {
    if (!counting) return;
    setCount(0);
    let n = 0;
    click(660);
    const id = setInterval(() => {
      n += 1;
      if (n >= tempo) { clearInterval(id); setCounting(false); click(1200, 0.09, 0.12); return; }
      click(660); setCount(n);
    }, 1000);
    return () => clearInterval(id);
  }, [counting]);
  return (
    <div className={cx("telemetry-deck")}>
      <div className={cx("card")} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <span className={cx("eyebrow")}>BIOMECHANICAL LEVER SELECTOR</span>
        <input type="range" min={0} max={5} value={leverIdx} onChange={(e) => setLeverIdx(Number(e.target.value))} style={{ width: "100%" }} />
        <div className={cx("mono")} style={{ fontSize: 16, fontWeight: 700, color: "var(--df)" }}>{LEVERS[leverIdx]}</div>
        <div style={{ height: 10, borderRadius: 5, background: "#1c2128", overflow: "hidden" }}>
          <div style={{ height: "100%", width: TORQUE[leverIdx] + "%", background: "var(--df)", transition: "width .2s" }}></div>
        </div>
        <span className={cx("mono")} style={{ fontSize: 11, color: "var(--ink-dim)" }}>relative shoulder torque: {TORQUE[leverIdx]}%</span>
      </div>
      <div className={cx("card")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <span className={cx("eyebrow")}>ECCENTRIC TEMPO PACEMAKER</span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className={cx("mono")} style={{ fontSize: 12, color: "var(--ink-dim)" }}>TEMPO</span>
          <input type="number" value={tempo} min={2} max={8} onChange={(e) => setTempo(Number(e.target.value))} style={{ width: 60 }} />
          <span className={cx("mono")} style={{ fontSize: 12, color: "var(--ink-dim)" }}>sec descent</span>
        </div>
        <div style={{ width: 150, height: 150, borderRadius: 999, border: `3px solid ${counting ? "var(--df)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface2)" }}>
          <span className={cx("mono")} style={{ fontSize: 36, fontWeight: 700, color: "var(--df)" }}>{counting ? count : tempo}</span>
        </div>
        <button className={cx("topbtn", "primary")} onClick={() => setCounting(true)} disabled={counting} style={{ opacity: counting ? 0.5 : 1 }}>START REP</button>
      </div>
      <div className={cx("card")} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <StatusSelector value={status} onChange={setStatus} label="LUMBAR / NECK STATUS" />
        <GuardBanner mode={status === "green" ? "CLEARED" : "CAUTION"} color={status} text={status === "red" ? "Stop all core loading today. See a physio if pain lasts 48h or returns." : status === "amber" ? "Shorten the lever and drop a set today." : "Lower back and neck clear — proceed."} />
      </div>
    </div>
  );
}

function MarathonTelemetry({ store, setStore }: any) {
  const [distance, setDistance] = useState(7.0);
  const [duration, setDuration] = useState(40);
  const [hr, setHr] = useState(148);
  const [cadence, setCadence] = useState(170);
  const [rpe, setRpe] = useState(5);
  const [metroOn, setMetroOn] = useState(false);
  const status = store.tissueStatus["marathon-" + today()] || "green";
  function setStatus(v: string) { setStore((s: any) => ({ ...s, tissueStatus: { ...s.tissueStatus, ["marathon-" + today()]: v } })); }
  useMetronome(cadence, metroOn, 1400);
  const pace = duration && distance ? duration / distance : 0;
  const paceMin = Math.floor(pace); const paceSec = Math.round((pace - paceMin) * 60);
  return (
    <div className={cx("telemetry-deck")}>
      <div className={cx("card")} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span className={cx("eyebrow")}>ZONE / PACE TELEMETRY LOGGER</span>
        <div className={cx("two-col")}>
          <div className={cx("field")}><label>DISTANCE (KM)</label><input type="number" step={0.1} value={distance} onChange={(e) => setDistance(Number(e.target.value))} /></div>
          <div className={cx("field")}><label>DURATION (MIN)</label><input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></div>
          <div className={cx("field")}><label>AVG HR</label><input type="number" value={hr} onChange={(e) => setHr(Number(e.target.value))} /></div>
          <div className={cx("field")}><label>CADENCE (SPM)</label><input type="number" value={cadence} onChange={(e) => setCadence(Number(e.target.value))} /></div>
          <div className={cx("field")}><label>RPE (1-10)</label><input type="number" min={1} max={10} value={rpe} onChange={(e) => setRpe(Number(e.target.value))} /></div>
          <div className={cx("field")}><label>AVG PACE</label><div className={cx("mono")} style={{ fontSize: 20, fontWeight: 700, color: "var(--run)", paddingTop: 6 }}>{paceMin}:{String(paceSec).padStart(2, "0")}/km</div></div>
        </div>
      </div>
      <div className={cx("card")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <span className={cx("eyebrow")}>170+ SPM CADENCE METRONOME</span>
        <Dial value={cadence} min={140} max={200} onChange={setCadence} label="CADENCE" unit=" spm" color="var(--run)" />
        <div className={cx("pill", metroOn && "on")} onClick={() => setMetroOn(!metroOn)}>{metroOn ? "● CLICK ON" : "○ CLICK"}</div>
      </div>
      <div className={cx("card")} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <StatusSelector value={status} onChange={setStatus} label="SHIN / CALF HOP-TEST STATUS" />
        <GuardBanner mode={status === "green" ? "CLEARED" : "CAUTION"} color={status} text={status === "red" ? "Stop running for the day. Investigate before the next quality session." : status === "amber" ? "Easy aerobic only today, no quality or long run." : "Lower legs clear — proceed with today's prescription."} />
      </div>
    </div>
  );
}

const TELEMETRY: Record<string, any> = { piano: PianoTelemetry, handstand: HandstandTelemetry, dragonflag: DragonFlagTelemetry, marathon: MarathonTelemetry };

/* ============================== phase timeline + dossier ============================== */
function PhaseTimeline({ skill, activeId, onSelect, store }: any) {
  const phases = getPhases(skill);
  const color = SKILL_META[skill].color;
  return (
    <div className={cx("card")} style={{ "--active-color": color } as any}>
      <span className={cx("eyebrow")}>PHASE TIMELINE</span>
      <div className={cx("timeline-row")} style={{ marginTop: 10 }}>
        {phases.map((p: any, i: number) => {
          const gc = gateCriteriaOf(skill, p);
          const done = gc.length > 0 && gc.every((_: any, gi: number) => store.gateChecks[skill + "-" + p.id + "-gate-" + gi]);
          return (
            <div key={p.id} className={cx("tl-node", p.id === activeId && "active")} onClick={() => onSelect(p.id)} style={{ "--active-color": color } as any}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className={cx("num")}>P{p.order || i + 1}</span>
                <div className={cx("tl-dot")} style={{ background: done ? "var(--emerald)" : (p.id === activeId ? color : "#30363D") }}></div>
              </div>
              <span className={cx("nm")}>{p.title}</span>
              <span className={cx("wk")}>{p.weeks || p.weeksLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhaseDossier({ skill, phase, store, setStore }: any) {
  const [tab, setTab] = useState("focus");
  const color = SKILL_META[skill].color;
  const isPiano = skill === "piano";
  const checkpoints = checkpointsOf(skill, phase);
  const gateCriteria = gateCriteriaOf(skill, phase);
  const gateDoneCount = gateCriteria.filter((_: any, i: number) => store.gateChecks[skill + "-" + phase.id + "-gate-" + i]).length;
  const fieldNoteKey = skill + "-" + phase.id;
  const noteVal = store.fieldNotes[fieldNoteKey] || "";

  function toggleGate(i: number) {
    const key = skill + "-" + phase.id + "-gate-" + i;
    setStore((s: any) => ({ ...s, gateChecks: { ...s.gateChecks, [key]: !s.gateChecks[key] } }));
  }
  function toggleCheckpoint(i: number) {
    const key = skill + "-" + phase.id + "-cp-" + i;
    setStore((s: any) => ({ ...s, drillChecks: { ...s.drillChecks, [key]: !s.drillChecks[key] } }));
  }
  function toggleHabitDone() {
    toggleHabit(setStore, skill + "-" + phase.id + "-habit-" + today());
  }
  function setNote(v: string) {
    setStore((s: any) => ({ ...s, fieldNotes: { ...s.fieldNotes, [fieldNoteKey]: v } }));
  }

  const tabs = isPiano
    ? [["focus", "Focus"], ["theory", "Theory & Bridges"], ["drills", "Drills & Protocol"], ["gate", "Phase Gate"], ["notes", "Field Notes"]]
    : [["focus", "Focus"], ["theory", "Theory & Form Cues"], ["protocol", "Protocol"], ["guardrails", "Pre-Flight & Guardrails"], ["gate", "Phase Gate"], ["notes", "Field Notes"]];

  return (
    <div className={cx("card")} style={{ "--active-color": color, display: "flex", flexDirection: "column", gap: 16 } as any}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <span className={cx("eyebrow")}>{phase.weeks || phase.weeksLabel} · {phase.durationWeeks} weeks</span>
          <h2 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800 }}>{phase.title}</h2>
        </div>
        <span className={cx("mono")} style={{ fontSize: 12, color }}>{gateCriteria.length ? gateDoneCount + " / " + gateCriteria.length + " gate" : ""}</span>
      </div>

      <div className={cx("dossier-tabs")} style={{ "--active-color": color } as any}>
        {tabs.map(([k, l]) => <button key={k} className={cx("dossier-tab", tab === k && "on")} style={{ "--active-color": color } as any} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {tab === "focus" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <span className={cx("eyebrow")}>MECHANICAL SKILL UNLOCKED</span>
            <p style={{ fontSize: 14, marginTop: 6, lineHeight: 1.6 }}>{phase.mechanicalSkill || (phase.coreFocus && phase.coreFocus.mechanicalSkill)}</p>
          </div>
          <div>
            <span className={cx("eyebrow")}>MENTAL MODEL / BIOMECHANICAL UNLOCK</span>
            <p style={{ fontSize: 14, marginTop: 6, lineHeight: 1.6, color: "var(--ink-dim)" }}>{phase.mentalModel || (phase.coreFocus && phase.coreFocus.mentalModel)}</p>
          </div>
          {phase.biomechanicalUnlock && <div><span className={cx("eyebrow")}>BIOMECHANICAL BOTTLENECK</span><p style={{ fontSize: 14, marginTop: 6, lineHeight: 1.6, color: "var(--ink-dim)" }}>{phase.biomechanicalUnlock}</p></div>}
          {phase.frequency && <div><span className={cx("eyebrow")}>FREQUENCY</span><p style={{ fontSize: 13.5, marginTop: 6, color: "var(--ink-dim)" }}>{phase.frequency}</p></div>}
        </div>
      )}

      {tab === "theory" && (
        <div>
          {isPiano ? (phase.theoryConcepts || []).map((t: any, i: number) => (
            <div key={i} className={cx("theory-item")}>
              <h4>{t.title}</h4>
              <p>{t.explanation}</p>
              {t.bridge && <div className={cx("bridge-box")}><span className={cx("lbl")}>SARGAM BRIDGE</span>{t.bridge}</div>}
            </div>
          )) : (phase.formCues || []).map((fc: any, i: number) => (
            <div key={i} className={cx("theory-item")}>
              <h4>{fc.cue}</h4>
              <p>{fc.why}</p>
            </div>
          ))}
          {!isPiano && (phase.theoryConcepts || []).length > 0 && (
            <div style={{ marginTop: 10 }}>
              <span className={cx("eyebrow")}>THEORY CHIPS</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {phase.theoryConcepts.map((tc: string, i: number) => <span key={i} className={cx("qpill")}>{tc}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "drills" && isPiano && (
        <div>
          {(phase.drills || []).map((d: any, i: number) => (
            <div key={i} className={cx("drill-row")}>
              <div>
                <h4 style={{ margin: "0 0 4px", fontSize: 14 }}>{d.title}</h4>
                <p style={{ margin: 0, fontSize: 13, color: "var(--ink-dim)" }}>{d.description}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className={cx("tgt")}>{d.target}</span>
                <input type="checkbox" className={cx("chk")} checked={!!store.drillChecks[skill + "-" + phase.id + "-cp-" + i]} onChange={() => toggleCheckpoint(i)} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14 }}>
            <span className={cx("eyebrow")}>25-MINUTE DAILY BLUEPRINT</span>
            {(phase.dailyPractice || []).map((dp: any, i: number) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div className={cx("mono")} style={{ fontSize: 11, color: "var(--ink-dim)" }}>{dp.time} min<br /><span style={{ color: "var(--ink-faint)" }}>{dp.bpm}</span></div>
                <div><b style={{ fontSize: 13 }}>{dp.label}</b><p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--ink-dim)" }}>{dp.task}</p></div>
              </div>
            ))}
          </div>
          {phase.offKeyboardHabit && (
            <div style={{ marginTop: 14, border: "1px dashed var(--emerald2)", borderRadius: 10, padding: "12px 14px" }}>
              <span className={cx("eyebrow")} style={{ color: "var(--emerald2)" }}>OFF-KEYBOARD MICRO-HABIT · {phase.offKeyboardHabit.title}</span>
              <p style={{ fontSize: 13, margin: "6px 0 10px", color: "var(--ink-dim)" }}>{phase.offKeyboardHabit.task}</p>
              <ToggleSwitch on={!!store.habitChecks[skill + "-" + phase.id + "-habit-" + today()]} onToggle={toggleHabitDone} labelOn="DONE ON WALK/DESK" labelOff="TAP WHEN DONE" color="var(--emerald2)" />
            </div>
          )}
          {phase.resources && phase.resources.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <span className={cx("eyebrow")}>CURATED RESOURCES</span>
              {phase.resources.map((r: any, i: number) => (
                <div key={i} className={cx("res-item")}>
                  <span className={cx("kind-chip")}>{r.kind}</span>
                  <div><b>{r.name}</b><div style={{ color: "var(--ink-dim)", marginTop: 2 }}>{r.description}</div></div>
                </div>
              ))}
            </div>
          )}
          {phase.youtubeQueries && phase.youtubeQueries.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <span className={cx("eyebrow")}>1-CLICK YOUTUBE SEARCHES</span>
              <div style={{ marginTop: 8 }}>
                {phase.youtubeQueries.map((q: string, i: number) => <a key={i} className={cx("qpill")} target="_blank" rel="noopener noreferrer" href={"https://www.youtube.com/results?search_query=" + encodeURIComponent(q)}>{q}</a>)}
              </div>
            </div>
          )}
          {phase.whatToExpect && (
            <div style={{ marginTop: 14 }}>
              <span className={cx("eyebrow")}>WHAT TO EXPECT</span>
              <p style={{ fontSize: 13.5, color: "var(--ink-dim)", marginTop: 6 }}>{phase.whatToExpect}</p>
              {phase.breakthroughCues && phase.breakthroughCues.length > 0 && (
                <ul style={{ paddingLeft: 18, marginTop: 8 }}>{phase.breakthroughCues.map((c: string, i: number) => <li key={i} style={{ fontSize: 13, color: "var(--ink-dim)", marginBottom: 4 }}>{c}</li>)}</ul>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "protocol" && !isPiano && (
        <div>
          <span className={cx("eyebrow")}>DAILY PROTOCOL BLUEPRINT</span>
          {(phase.dailyPractice || []).map((dp: any, i: number) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "110px 1fr auto", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div className={cx("mono")} style={{ fontSize: 11, color: "var(--ink-dim)" }}>SLOT {dp.slot}<br />{dp.minutes} min</div>
              <div><b style={{ fontSize: 13 }}>{dp.label}</b><p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--ink-dim)" }}>{dp.task}</p></div>
              <span className={cx("tgt")}>{dp.prescription}</span>
            </div>
          ))}
          {phase.offKeyboardHabit && (
            <div style={{ marginTop: 14, border: "1px dashed var(--emerald2)", borderRadius: 10, padding: "12px 14px" }}>
              <span className={cx("eyebrow")} style={{ color: "var(--emerald2)" }}>OFF-SESSION MICRO-HABIT · {phase.offKeyboardHabit.title}</span>
              <p style={{ fontSize: 13, margin: "6px 0 10px", color: "var(--ink-dim)" }}>{phase.offKeyboardHabit.task}</p>
              <ToggleSwitch on={!!store.habitChecks[skill + "-" + phase.id + "-habit-" + today()]} onToggle={toggleHabitDone} labelOn="DONE" labelOff="TAP WHEN DONE" color="var(--emerald2)" />
            </div>
          )}
          {checkpoints.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <span className={cx("eyebrow")}>CHECKPOINTS</span>
              {checkpoints.map((c: any, i: number) => (
                <div key={i} className={cx("drill-row")}>
                  <div><h4 style={{ margin: "0 0 4px", fontSize: 14 }}>{c.title}</h4>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--ink-dim)" }}>{(c.criteria || []).join(" ")}</p></div>
                  <input type="checkbox" className={cx("chk")} checked={!!store.drillChecks[skill + "-" + phase.id + "-cp-" + i]} onChange={() => toggleCheckpoint(i)} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "guardrails" && !isPiano && phase.guardrails && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className={cx("dos-donts")}>
            <div>
              <span className={cx("eyebrow")} style={{ color: "var(--emerald)" }}>PRE-FLIGHT DOS</span>
              {(phase.guardrails.dos || []).map((d: string, i: number) => {
                const key = skill + "-" + phase.id + "-pf-" + i;
                return (
                  <label key={i} className={cx("dos-item")} style={{ cursor: "pointer" }}>
                    <input type="checkbox" className={cx("chk")} checked={!!store.preflightChecks[key]} onChange={() => setStore((s: any) => ({ ...s, preflightChecks: { ...s.preflightChecks, [key]: !s.preflightChecks[key] } }))} />
                    <span style={{ fontSize: 13 }}>{d}</span>
                  </label>
                );
              })}
            </div>
            <div>
              <span className={cx("eyebrow")} style={{ color: "var(--crimson)" }}>FORM BREAKDOWN DON'TS</span>
              {(phase.guardrails.donts || []).map((d: string, i: number) => (
                <div key={i} className={cx("donts-item")}><span style={{ color: "var(--crimson)" }}>✕</span><span style={{ fontSize: 13, color: "var(--ink-dim)" }}>{d}</span></div>
              ))}
            </div>
          </div>
          {phase.guardrails.stopRule && (
            <div className={cx("dos-donts")}>
              <div className={cx("stop-card")} style={{ background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.3)" }}>
                <span className={cx("mono")} style={{ fontSize: 10, color: "var(--amber)", letterSpacing: ".06em" }}>AMBER · DOWNGRADE</span>
                <p style={{ margin: "6px 0 0", color: "#f0cf9b" }}>{phase.guardrails.stopRule.amber}</p>
              </div>
              <div className={cx("stop-card")} style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.3)" }}>
                <span className={cx("mono")} style={{ fontSize: 10, color: "var(--red)", letterSpacing: ".06em" }}>RED · STOP NOW</span>
                <p style={{ margin: "6px 0 0", color: "#fca5a5" }}>{phase.guardrails.stopRule.red}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "gate" && (
        <div>
          <span className={cx("eyebrow")}>BOSS-LEVEL PHASE GATE · {gateDoneCount} / {gateCriteria.length} · {gateCriteria.length ? Math.round((100 * gateDoneCount) / gateCriteria.length) : 0}%</span>
          <div style={{ marginTop: 10 }}>
            {gateCriteria.map((c: string, i: number) => {
              const key = skill + "-" + phase.id + "-gate-" + i;
              return (
                <label key={i} className={cx("gate-item")} style={{ cursor: "pointer" }}>
                  <input type="checkbox" className={cx("chk")} checked={!!store.gateChecks[key]} onChange={() => toggleGate(i)} />
                  <span style={{ textDecoration: store.gateChecks[key] ? "line-through" : "none", color: store.gateChecks[key] ? "var(--ink-faint)" : "var(--ink)" }}>{c}</span>
                </label>
              );
            })}
          </div>
          {gateCriteria.length > 0 && gateDoneCount === gateCriteria.length && (
            <div style={{ marginTop: 14 }}><Badge cls="low">PHASE GATE CLEARED — NEXT PHASE UNLOCKED</Badge></div>
          )}
        </div>
      )}

      {tab === "notes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span className={cx("eyebrow")}>PHASE LEARNINGS &amp; FIELD NOTES</span>
          {(phase.fieldNotePrompts || []).map((p: string, i: number) => <p key={i} style={{ fontSize: 13, color: "var(--ink-dim)", margin: 0 }}>· {p}</p>)}
          <textarea rows={6} placeholder="Write your timestamped reflections here..." value={noteVal} onChange={(e) => setNote(e.target.value)} />
          <span className={cx("mono")} style={{ fontSize: 10.5, color: "var(--ink-faint)" }}>autosaved to this device</span>
        </div>
      )}
    </div>
  );
}

/* ============================== weekly schedule tab ============================== */
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function todayLoad(): string {
  const sched = (PHYSICAL_DATA as any).weeklySchedule;
  const dow = DOW[new Date().getDay()];
  const d = sched.days.find((x: any) => x.day === dow);
  return d ? d.load : "low";
}

function WeeklyScheduleView({ store, setStore }: any) {
  const sched = (PHYSICAL_DATA as any).weeklySchedule;
  const dowToday = DOW[new Date().getDay()];
  const buffKey = "buff-" + today();
  const buffChecks = store.recoveryBuff[buffKey] || {};
  const allBuffChecked = sched.restDayBuff.checklist.every((_: any, i: number) => buffChecks[i]);

  function toggleBuff(i: number) {
    setStore((s: any) => ({ ...s, recoveryBuff: { ...s.recoveryBuff, [buffKey]: { ...(s.recoveryBuff[buffKey] || {}), [i]: !(s.recoveryBuff[buffKey] || {})[i] } } }));
  }
  function logRecoveryDay() {
    setStore((s: any) => ({ ...s, calendarLog: { ...s.calendarLog, [today()]: { ...(s.calendarLog[today()] || {}), recoveryBuff: true } } }));
  }

  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();
  const cells: Array<number | null> = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className={cx("card")}>
        <span className={cx("eyebrow")}>TODAY'S OPERATIONAL PRESCRIPTION · {dowToday.toUpperCase()}</span>
        <table className={cx("sched-table")} style={{ marginTop: 12 }}>
          <thead><tr><th>DAY</th><th>GYM</th><th>HANDSTAND</th><th>DRAGON FLAG</th><th>RUN</th><th>LOAD</th></tr></thead>
          <tbody>
            {sched.days.map((d: any, i: number) => (
              <tr key={i} className={d.day === dowToday ? cx("today") : undefined}>
                <td><b>{d.day}</b></td><td>{d.gym}</td><td>{d.handstand}</td><td>{d.dragonFlag}</td><td>{d.run}</td>
                <td><span className={cx("load-chip", "badge", d.load)}>{d.load.toUpperCase()}{d.buff ? " · BUFF" : ""}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 12.5, color: "var(--ink-dim)", marginTop: 10 }}>{sched.assumptions}</p>
      </div>

      <div className={cx("card")}>
        <span className={cx("eyebrow")}>COLLISION &amp; LOAD RULES</span>
        <ul style={{ paddingLeft: 18, marginTop: 10 }}>
          {sched.rules.map((r: string, i: number) => <li key={i} style={{ fontSize: 13.5, color: "var(--ink-dim)", marginBottom: 8 }}>{r}</li>)}
        </ul>
      </div>

      <div className={cx("card")}>
        <span className={cx("eyebrow")} style={{ color: "var(--emerald2)" }}>SUNDAY RECOVERY BUFF RITUAL</span>
        <p style={{ fontSize: 13, color: "var(--ink-dim)" }}>{sched.restDayBuff.rule}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {sched.restDayBuff.checklist.map((c: string, i: number) => (
            <label key={i} style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", fontSize: 13.5 }}>
              <input type="checkbox" className={cx("chk")} checked={!!buffChecks[i]} onChange={() => toggleBuff(i)} />{c}
            </label>
          ))}
        </div>
        <button className={cx("topbtn", "primary")} style={{ marginTop: 14, opacity: allBuffChecked ? 1 : 0.4 }} disabled={!allBuffChecked} onClick={logRecoveryDay}>
          {store.calendarLog[today()] && store.calendarLog[today()].recoveryBuff ? "✓ RECOVERY BUFF LOGGED" : "LOG RECOVERY DAY"}
        </button>
      </div>

      <div className={cx("card")}>
        <span className={cx("eyebrow")}>EDGELOG-STYLE MONTHLY CONSISTENCY CALENDAR</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5, marginTop: 12, marginBottom: 6 }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} className={cx("mono")} style={{ textAlign: "center", fontSize: 10, color: "var(--ink-faint)" }}>{d}</div>)}
        </div>
        <div className={cx("heat-grid")}>
          {cells.map((d, i) => {
            if (!d) return <div key={i}></div>;
            const dateStr = year + "-" + String(month + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
            const entry = store.calendarLog[dateStr];
            let sessions = 0;
            let hasRed = false;
            if (entry) {
              ["piano", "handstand", "dragonflag", "marathon"].forEach((k) => { if (entry[k]) sessions++; });
            }
            Object.keys(store.tissueStatus || {}).forEach((k) => { if (k.endsWith(dateStr) && store.tissueStatus[k] === "red") hasRed = true; });
            let bg = "#161B22";
            if (entry && entry.recoveryBuff) bg = "rgba(167,139,250,.35)";
            else if (sessions >= 3) bg = "#10B981";
            else if (sessions === 2) bg = "rgba(16,185,129,.6)";
            else if (sessions === 1) bg = "rgba(16,185,129,.3)";
            if (hasRed) bg = "#EF4444";
            const isToday = dateStr === today();
            return <div key={i} className={cx("heat-cell")} style={{ background: bg, boxShadow: isToday ? "0 0 0 2px #2DD4BF inset" : "none" }} title={dateStr}>{d}</div>;
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================== log session modal ============================== */
// Not every skill is practiced daily (piano is, marathon isn't) -- so this
// isn't a blanket daily nudge. It only shows up when you open it, and what it
// shows is the CURRENT PHASE's real predefined protocol (the same items the
// Protocol/Drills tab lists for this phase), as a checklist you tick and
// submit. The result -- which items you actually did -- is what lands in
// logs[skill] and lights up today's cell on the calendar.
function LogSessionModal({ skill, phase, onClose, setStore }: any) {
  const items: any[] = phase.dailyPractice || [];
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [notes, setNotes] = useState("");
  function toggle(i: number) { setChecked((c) => ({ ...c, [i]: !c[i] })); }
  const doneCount = Object.keys(checked).filter((k) => checked[Number(k)]).length;

  function submit() {
    const protocolItems = items.map((it: any, i: number) => ({
      label: it.label,
      detail: it.task || it.prescription || "",
      done: !!checked[i]
    }));
    setStore((s: any) => {
      const entry = { date: today(), phaseId: phase.id, protocolItems, notes };
      return {
        ...s,
        logs: { ...s.logs, [skill]: [...(s.logs[skill] || []), entry] },
        calendarLog: { ...s.calendarLog, [today()]: { ...(s.calendarLog[today()] || {}), [skill]: true } }
      };
    });
    onClose();
  }

  return (
    <div className={cx("modal-overlay")} onClick={onClose}>
      <div className={cx("modal")} onClick={(e) => e.stopPropagation()}>
        <span className={cx("eyebrow")}>LOG TODAY'S SESSION · {SKILL_META[skill].short} · {phase.title}</span>
        <h3 style={{ margin: 0 }}>Today's predefined protocol</h3>
        {items.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--ink-dim)", margin: 0 }}>
            No predefined protocol items are defined for this phase yet — log a note below instead.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {items.map((it: any, i: number) => (
              <label key={i} className={cx("drill-row")} style={{ cursor: "pointer", gridTemplateColumns: "20px 1fr", padding: "9px 0" }}>
                <input type="checkbox" className={cx("chk")} checked={!!checked[i]} onChange={() => toggle(i)} />
                <div>
                  <b style={{ fontSize: 13.5, textDecoration: checked[i] ? "line-through" : "none", color: checked[i] ? "var(--ink-faint)" : "var(--ink)" }}>
                    {it.label}
                  </b>
                  <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--ink-dim)" }}>
                    {it.task}{it.prescription ? " — " + it.prescription : ""}
                  </p>
                </div>
              </label>
            ))}
            <span className={cx("mono")} style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 6 }}>{doneCount} / {items.length} done today</span>
          </div>
        )}
        <div className={cx("field")}>
          <label>NOTES (OPTIONAL)</label>
          <textarea rows={3} placeholder="Anything worth remembering — breakthroughs, tension, numbers..." value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className={cx("topbtn", "ghost")} onClick={onClose}>CANCEL</button>
          <button className={cx("topbtn", "primary")} onClick={submit}>CONFIRM LOG</button>
        </div>
      </div>
    </div>
  );
}

/* ============================== streak calc ============================== */
function computeStreak(calendarLog: any): number {
  let streak = 0;
  let d = new Date();
  for (let i = 0; i < 365; i++) {
    const ds = d.toISOString().slice(0, 10);
    const entry = calendarLog[ds];
    const dow = d.getDay();
    const ok = entry && (entry.piano || entry.handstand || entry.dragonflag || entry.marathon || entry.recoveryBuff);
    if (ok) { streak++; }
    else if (dow === 0 && !entry) { if (ds !== today()) break; }
    else { break; }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/* ============================== App ============================== */
export default function MasteryOS({ initialStore }: { initialStore?: any }) {
  // Lazy initializer -- runs exactly once, on first mount, using whatever the
  // server handed down. Deliberately NOT a useEffect keyed on `initialStore`:
  // that pattern re-ran every time the prop reference changed (which happens
  // whenever Next.js refreshes this route's server component) and stomped
  // local clicks -- switch phase/skill, see it snap back to the old one for
  // a moment, click again and it "sticks". A lazy useState init ignores
  // later prop changes entirely, so the server value only ever seeds the
  // store once; after that the client store is the single source of truth
  // and every change is pushed out to Supabase, never pulled back in.
  const [store, setStoreRaw] = useState<any>(() => ({ ...defaultStore(), ...(initialStore || {}) }));
  const [modalOpen, setModalOpen] = useState(false);
  const setStore = useCallback((fn: any) => setStoreRaw((prev: any) => (typeof fn === "function" ? fn(prev) : fn)), []);

  // Debounced save back to Supabase on every change, so progress follows you
  // across devices instead of staying stuck in one browser's localStorage.
  // Skips the very first render (that's just the data we loaded, re-saving
  // it immediately is pointless).
  const saveTimeout = useRef<any>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => { saveMasteryState(store).catch(() => {}); }, 800);
    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [store]);

  const activeSkill = store.activeSkill;
  const activePhaseId = store.activePhase[activeSkill];
  const phase = getPhase(activeSkill, activePhaseId);
  const Telemetry = TELEMETRY[activeSkill];
  const load = todayLoad();
  const streak = computeStreak(store.calendarLog);

  function selectSkill(s: string) { setStore((prev: any) => ({ ...prev, activeSkill: s, activeTab: "workspace" })); }
  function selectPhase(id: string) { setStore((prev: any) => ({ ...prev, activePhase: { ...prev.activePhase, [activeSkill]: id } })); }

  function exportData() {
    const text = JSON.stringify(store, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "life-mastery-os-backup.json"; a.click();
    URL.revokeObjectURL(url);
  }
  function importData(e: any) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { const parsed = JSON.parse(String(reader.result)); setStore(parsed); } catch (err) { alert("Invalid backup file"); }
    };
    reader.readAsText(file);
  }

  return (
    <div className={cx(inter.className, jetbrainsMono.variable, "app")} style={{ fontFamily: inter.style.fontFamily }}>
        <div className={cx("topbar")}>
          <Link href="/today" className={cx("topbtn", "ghost")} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            ← COMMAND CENTER
          </Link>
          <span className={cx("brand")}>LIFE <span>// MASTERY OS</span></span>
          <Badge>{streak}-DAY STREAK</Badge>
          <Badge cls={load}>TODAY · {load.toUpperCase()} LOAD</Badge>
          <div className={cx("cartridges")}>
            {Object.keys(SKILL_META).map((s) => (
              <button key={s} className={cx("cart-btn", store.activeTab === "workspace" && activeSkill === s && "on")} style={{ "--active-color": SKILL_META[s].color } as any} onClick={() => selectSkill(s)}>{SKILL_META[s].label}</button>
            ))}
            <button className={cx("cart-btn", store.activeTab === "schedule" && "on")} onClick={() => setStore((prev: any) => ({ ...prev, activeTab: "schedule" }))}>SCHEDULE &amp; ANALYTICS</button>
          </div>
          <button className={cx("topbtn", "primary")} onClick={() => setModalOpen(true)}>+ LOG TODAY'S SESSION</button>
          <button className={cx("topbtn", "ghost")} onClick={exportData}>EXPORT</button>
          <label className={cx("topbtn", "ghost")} style={{ margin: 0 }}>
            IMPORT
            <input type="file" accept="application/json" onChange={importData} style={{ display: "none" }} />
          </label>
        </div>

        <main className={cx("workspace")}>
          {store.activeTab === "workspace" ? (
            <>
              <Telemetry store={store} setStore={setStore} />
              <PhaseTimeline skill={activeSkill} activeId={activePhaseId} onSelect={selectPhase} store={store} />
              <PhaseDossier skill={activeSkill} phase={phase} store={store} setStore={setStore} />
            </>
          ) : (
            <WeeklyScheduleView store={store} setStore={setStore} />
          )}
        </main>

        {modalOpen && <LogSessionModal skill={activeSkill} phase={phase} onClose={() => setModalOpen(false)} setStore={setStore} />}
    </div>
  );
}
