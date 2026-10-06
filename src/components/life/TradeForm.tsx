"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addTrade } from "@/app/actions/life";

export default function TradeForm({ today }: { today: string }) {
  const [side, setSide] = useState<"Long" | "Short">("Long");
  const [entry, setEntry] = useState("");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [exit, setExit] = useState("");

  const preview = useMemo(() => {
    const e = parseFloat(entry);
    const s = parseFloat(sl);
    const t = parseFloat(tp);
    const x = parseFloat(exit);

    const risk = isFinite(e) && isFinite(s) ? Math.abs(e - s) : null;
    const reward = isFinite(e) && isFinite(t) ? Math.abs(t - e) : null;
    const plannedRR = risk && reward ? reward / risk : null;

    let points: number | null = null;
    if (isFinite(e) && isFinite(x)) {
      points = side === "Short" ? e - x : x - e;
    }
    const realizedR = risk && points !== null ? points / risk : null;

    return { plannedRR, points, realizedR };
  }, [side, entry, sl, tp, exit]);

  return (
    <form action={addTrade} className="card flex flex-col gap-5 p-6" style={{ maxWidth: 640 }}>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Date</span>
          <input type="date" name="date" defaultValue={today} className="field" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Symbol</span>
          <input type="text" name="symbol" placeholder="NIFTY, RELIANCE…" className="field" required />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Side</span>
        <div className="flex gap-2">
          <label className="flex-1">
            <input
              type="radio"
              name="side"
              value="Long"
              checked={side === "Long"}
              onChange={() => setSide("Long")}
              className="peer sr-only"
            />
            <span className="flex h-10 cursor-pointer items-center justify-center rounded-[10px] border-[1.5px] border-line text-[13px] font-semibold text-ink2 peer-checked:border-green peer-checked:bg-greenbg peer-checked:text-green">
              Long
            </span>
          </label>
          <label className="flex-1">
            <input
              type="radio"
              name="side"
              value="Short"
              checked={side === "Short"}
              onChange={() => setSide("Short")}
              className="peer sr-only"
            />
            <span className="flex h-10 cursor-pointer items-center justify-center rounded-[10px] border-[1.5px] border-line text-[13px] font-semibold text-ink2 peer-checked:border-red peer-checked:bg-redbg peer-checked:text-red">
              Short
            </span>
          </label>
        </div>
      </label>

      <div className="grid grid-cols-3 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Entry price</span>
          <input
            type="number"
            step="0.01"
            name="entry"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            className="field"
            required
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Stop loss</span>
          <input type="number" step="0.01" name="sl" value={sl} onChange={(e) => setSl(e.target.value)} className="field" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Target</span>
          <input type="number" step="0.01" name="tp" value={tp} onChange={(e) => setTp(e.target.value)} className="field" />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Exit price</span>
        <input
          type="number"
          step="0.01"
          name="exit"
          value={exit}
          onChange={(e) => setExit(e.target.value)}
          className="field"
        />
        <span className="text-[11px] text-ink3">Leave blank if the trade is still open.</span>
      </label>

      {(preview.plannedRR !== null || preview.points !== null) && (
        <div className="flex gap-3 rounded-[10px] border border-line2 bg-sunk px-4 py-3">
          {preview.plannedRR !== null && (
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-ink3">Planned R:R</span>
              <span className="font-mono text-[15px] font-semibold text-plum">1 : {preview.plannedRR.toFixed(2)}</span>
            </div>
          )}
          {preview.points !== null && (
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-ink3">Points captured</span>
              <span className={`font-mono text-[15px] font-semibold ${preview.points >= 0 ? "text-green" : "text-accent"}`}>
                {preview.points >= 0 ? "+" : ""}
                {preview.points.toFixed(1)} pts
              </span>
            </div>
          )}
          {preview.realizedR !== null && (
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-ink3">Realized R</span>
              <span className={`font-mono text-[15px] font-semibold ${preview.realizedR >= 0 ? "text-green" : "text-accent"}`}>
                {preview.realizedR >= 0 ? "+" : ""}
                {preview.realizedR.toFixed(2)}R
              </span>
            </div>
          )}
        </div>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Setup / tag</span>
        <input type="text" name="setup" placeholder="Breakout, Reversal, VWAP…" className="field" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Notes</span>
        <textarea
          name="notes"
          rows={4}
          placeholder="What was the plan, what happened, what did you learn?"
          className="field resize-none"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Chart screenshots / broker statement</span>
        <input
          type="file"
          name="images"
          accept="image/*"
          multiple
          className="rounded-[10px] border-[1.5px] border-dashed border-line2 bg-sunk px-3.5 py-3 text-[12.5px] text-ink2 file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-onaccent"
        />
        <span className="text-[11px] text-ink3">You can attach more than one image — add entry/exit charts or a broker screenshot.</span>
      </label>

      <div className="flex justify-end gap-2 pt-1">
        <Link href="/life/trading" className="btn">
          Cancel
        </Link>
        <button type="submit" className="btn btn-pri">
          Save trade
        </button>
      </div>
    </form>
  );
}
