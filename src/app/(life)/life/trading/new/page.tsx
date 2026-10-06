import Link from "next/link";
import { addTrade } from "@/app/actions/life";

export default function NewTradePage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/life/trading" className="text-[12.5px] font-semibold text-ink3 hover:text-accent">
          ← Back to journal
        </Link>
        <h1 className="font-serif mt-1 text-[30px] font-medium tracking-tight">Log a trade</h1>
      </div>

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
              <input type="radio" name="side" value="Long" defaultChecked className="peer sr-only" />
              <span className="flex h-10 cursor-pointer items-center justify-center rounded-[10px] border-[1.5px] border-line text-[13px] font-semibold text-ink2 peer-checked:border-green peer-checked:bg-greenbg peer-checked:text-green">
                Long
              </span>
            </label>
            <label className="flex-1">
              <input type="radio" name="side" value="Short" className="peer sr-only" />
              <span className="flex h-10 cursor-pointer items-center justify-center rounded-[10px] border-[1.5px] border-line text-[13px] font-semibold text-ink2 peer-checked:border-red peer-checked:bg-redbg peer-checked:text-red">
                Short
              </span>
            </label>
          </div>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Entry price</span>
            <input type="number" step="0.01" name="entry" className="field" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Exit price</span>
            <input type="number" step="0.01" name="exit" className="field" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">P&amp;L (₹)</span>
            <input type="number" step="0.01" name="pnl" placeholder="-500 or 1200" className="field" required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">R multiple</span>
            <input type="number" step="0.1" name="rMultiple" placeholder="1.5" className="field" />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Setup / tag</span>
          <input type="text" name="setup" placeholder="Breakout, Reversal, VWAP…" className="field" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Notes</span>
          <textarea name="notes" rows={4} placeholder="What was the plan, what happened, what did you learn?" className="field resize-none" />
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
    </div>
  );
}
