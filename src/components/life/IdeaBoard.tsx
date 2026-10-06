"use client";

import { useState, useTransition } from "react";
import { advanceIdea, parkIdea } from "@/app/actions/life";

type Idea = { id: string; title: string; note: string | null; stage: string };

const COLUMNS: { key: string; title: string; chipClass: string }[] = [
  { key: "idea", title: "Idea", chipClass: "chip-gray" },
  { key: "talks", title: "In talks", chipClass: "chip-amber" },
  { key: "negotiating", title: "Negotiating", chipClass: "chip-accent" },
  { key: "committed", title: "Committed", chipClass: "chip-green" },
  { key: "parked", title: "Parked", chipClass: "chip-red" }
];

export default function IdeaBoard({ ideas }: { ideas: Idea[] }) {
  const [shown, setShown] = useState(ideas);
  const [, startTransition] = useTransition();

  function advance(id: string) {
    const order = ["idea", "talks", "negotiating", "committed"];
    setShown((rows) =>
      rows.map((r) => {
        if (r.id !== id) return r;
        const i = order.indexOf(r.stage);
        return { ...r, stage: order[Math.min(i + 1, order.length - 1)] };
      })
    );
    const fd = new FormData();
    fd.set("ideaId", id);
    startTransition(() => {
      advanceIdea(fd);
    });
  }

  function park(id: string) {
    setShown((rows) => rows.map((r) => (r.id === id ? { ...r, stage: "parked" } : r)));
    const fd = new FormData();
    fd.set("ideaId", id);
    startTransition(() => {
      parkIdea(fd);
    });
  }

  return (
    <div className="grid grid-cols-5 gap-3.5">
      {COLUMNS.map((col) => {
        const cards = shown.filter((i) => i.stage === col.key);
        return (
          <div key={col.key} className="flex min-w-0 flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <span className={`chip ${col.chipClass}`}>{col.title}</span>
              <span className="text-xs text-ink3">{cards.length}</span>
            </div>
            <div className="flex min-h-[60px] flex-col gap-2.5 rounded-[14px] bg-sunk p-2.5">
              {cards.map((c) => (
                <div key={c.id} className="card flex flex-col gap-2 p-3.5">
                  <span className="text-[13.5px] font-semibold">{c.title}</span>
                  {c.note && <span className="text-xs leading-relaxed text-ink2">{c.note}</span>}
                  <div className="mt-1 flex items-center justify-between">
                    {col.key !== "committed" && col.key !== "parked" ? (
                      <>
                        <button onClick={() => park(c.id)} className="text-xs font-medium text-ink3 hover:text-red">
                          Park
                        </button>
                        <button
                          onClick={() => advance(c.id)}
                          aria-label="Move to next stage"
                          className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-accent text-[13px] text-onaccent"
                        >
                          →
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-ink3">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
