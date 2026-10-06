"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Trade = {
  id: string;
  date: string;
  symbol: string;
  side: "Long" | "Short";
  entry: number | null;
  exit: number | null;
  pnl: number;
  r: number | null;
  setup: string | null;
  notes: string | null;
  imageCount: number;
};

function fmtMoney(n: number) {
  return (n >= 0 ? "+₹" : "-₹") + Math.abs(Math.round(n)).toLocaleString("en-IN");
}

export default function TradeExplorer({ trades }: { trades: Trade[] }) {
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const setups = useMemo(
    () => Array.from(new Set(trades.map((t) => t.setup).filter((s): s is string => !!s))),
    [trades]
  );

  function toggleTag(tag: string) {
    setActiveTags((tags) => (tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]));
  }

  const filtered = trades.filter((t) => {
    if (activeTags.length && !(t.setup && activeTags.includes(t.setup))) return false;
    if (selectedDate && t.date !== selectedDate) return false;
    return true;
  });

  // ---- calendar: current month ----
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const pnlByDate = new Map<string, number>();
  trades.forEach((t) => pnlByDate.set(t.date, (pnlByDate.get(t.date) || 0) + t.pnl));

  const cells: (null | { day: number; dateStr: string; pnl: number | undefined })[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, dateStr, pnl: pnlByDate.get(dateStr) });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        {setups.map((tag) => {
          const on = activeTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`h-[30px] rounded-full border px-3.5 text-[12.5px] font-semibold ${
                on ? "border-transparent bg-accent text-onaccent" : "border-line2 text-ink2"
              }`}
            >
              {tag}
            </button>
          );
        })}
        {selectedDate && (
          <button
            type="button"
            onClick={() => setSelectedDate(null)}
            className="h-[30px] rounded-full border border-plum bg-plumbg px-3.5 text-[12.5px] font-semibold text-plum"
          >
            Showing {selectedDate} ✕
          </button>
        )}
      </div>

      <div className="card flex flex-col gap-2.5 p-5">
        <span className="font-serif text-lg font-medium">{monthLabel}</span>
        <div className="mt-1 grid grid-cols-7 gap-[5px]">
          {["S", "M", "T", "W", "T", "F", "S"].map((wd, i) => (
            <span key={i} className="text-center text-[10px] font-semibold text-ink3">
              {wd}
            </span>
          ))}
          {cells.map((cell, i) => {
            if (!cell) return <span key={i} />;
            const selected = selectedDate === cell.dateStr;
            let bg = "var(--sunk)";
            let fg = "var(--ink3)";
            if (cell.pnl !== undefined) {
              if (cell.pnl > 3000) {
                bg = "var(--green)";
                fg = "#fff";
              } else if (cell.pnl > 0) {
                bg = "var(--green-bg)";
                fg = "var(--green)";
              } else if (cell.pnl < -2000) {
                bg = "var(--accent)";
                fg = "#fff";
              } else {
                bg = "var(--accent-bg)";
                fg = "var(--accent)";
              }
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedDate(selected ? null : cell.dateStr)}
                style={{ background: bg, color: fg, border: selected ? "2px solid var(--plum)" : "1px solid transparent" }}
                className="h-[30px] rounded-[7px] text-[11px] font-semibold"
              >
                {cell.day}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex gap-4 text-[11px] text-ink3">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-[3px] bg-green" /> Win day
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-[3px] bg-accent" /> Loss day
          </span>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="flex items-baseline justify-between px-5 py-4">
          <span className="font-serif text-lg font-medium">Trade log</span>
          <span className="text-[12.5px] text-ink3">
            {filtered.length} trade{filtered.length === 1 ? "" : "s"}
            {activeTags.length || selectedDate ? " (filtered)" : ""}
          </span>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y border-line">
              <th className="px-3.5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-ink3">Date</th>
              <th className="px-3.5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-ink3">Symbol</th>
              <th className="px-3.5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-ink3">Side</th>
              <th className="px-3.5 py-2.5 text-right text-[11px] font-bold uppercase tracking-wide text-ink3">Entry</th>
              <th className="px-3.5 py-2.5 text-right text-[11px] font-bold uppercase tracking-wide text-ink3">Exit</th>
              <th className="px-3.5 py-2.5 text-right text-[11px] font-bold uppercase tracking-wide text-ink3">P&amp;L</th>
              <th className="px-3.5 py-2.5 text-right text-[11px] font-bold uppercase tracking-wide text-ink3">R</th>
              <th className="px-3.5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-ink3">Setup</th>
              <th className="px-3.5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-ink3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-line">
                <td className="px-3.5 py-2.5 font-mono text-[12.5px] text-ink3">{t.date.slice(5)}</td>
                <td className="px-3.5 py-2.5 text-[13px] font-semibold">{t.symbol}</td>
                <td className="px-3.5 py-2.5">
                  <span
                    className={`rounded-[6px] px-2 py-0.5 text-[11px] font-bold ${
                      t.side === "Long" ? "bg-greenbg text-green" : "bg-redbg text-red"
                    }`}
                  >
                    {t.side}
                  </span>
                </td>
                <td className="px-3.5 py-2.5 text-right font-mono text-[12.5px] text-ink2">{t.entry ?? "—"}</td>
                <td className="px-3.5 py-2.5 text-right font-mono text-[12.5px] text-ink2">{t.exit ?? "—"}</td>
                <td
                  className={`px-3.5 py-2.5 text-right font-mono text-[12.5px] font-semibold ${
                    t.pnl >= 0 ? "text-green" : "text-accent"
                  }`}
                >
                  {fmtMoney(t.pnl)}
                </td>
                <td className={`px-3.5 py-2.5 text-right font-mono text-[12.5px] ${t.pnl >= 0 ? "text-green" : "text-accent"}`}>
                  {t.r !== null ? (t.r >= 0 ? `+${t.r.toFixed(1)}` : t.r.toFixed(1)) : "—"}
                </td>
                <td className="px-3.5 py-2.5">
                  {t.setup && <span className="rounded-full bg-sunk px-2.5 py-0.5 text-[11px] font-semibold text-ink2">{t.setup}</span>}
                </td>
                <td className="max-w-[220px] px-3.5 py-2.5 text-[12.5px] text-ink3">
                  <Link href={`/life/trading/${t.id}`} className="hover:text-accent hover:underline">
                    {t.notes ? (t.notes.length > 50 ? t.notes.slice(0, 50) + "…" : t.notes) : "—"}
                    {t.imageCount > 0 && ` 📎${t.imageCount}`}
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3.5 py-8 text-center text-ink3">
                  No trades match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
