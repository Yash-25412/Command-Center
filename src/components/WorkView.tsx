"use client";

import { useState } from "react";
import Link from "next/link";
import TaskRow, { RowTask } from "@/components/TaskRow";
import { STATUS_META, STATUS_ORDER } from "@/lib/format";

export default function WorkView({ initialView, rows }: { initialView: "list" | "board"; rows: RowTask[] }) {
  // List <-> Board is purely a different arrangement of data already on the
  // page, so switching never needs to touch the network.
  const [view, setView] = useState<"list" | "board">(initialView);

  const groups = STATUS_ORDER.map((key) => ({
    key,
    meta: STATUS_META[key],
    items: rows.filter((r) => r.status === key)
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="inline-flex w-fit gap-0.5 rounded-[10px] bg-sunk p-[3px]">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`h-7 rounded-[7px] px-3 text-[13px] font-medium ${view === "list" ? "bg-surface text-ink shadow-sm" : "text-ink2"}`}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => setView("board")}
          className={`h-7 rounded-[7px] px-3 text-[13px] font-medium ${view === "board" ? "bg-surface text-ink shadow-sm" : "text-ink2"}`}
        >
          Board
        </button>
      </div>

      {view === "list" ? (
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <section key={g.key} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{g.meta.label}</span>
                <span className="text-ink3">{g.items.length}</span>
              </div>
              <div className="card overflow-hidden">
                {g.items.map((t) => (
                  <TaskRow key={t.id} t={t} />
                ))}
              </div>
            </section>
          ))}
          {rows.length === 0 && (
            <div className="card p-10 text-center text-ink2">Nothing matches these filters.</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-6 items-start gap-3">
          {STATUS_ORDER.map((key) => {
            const meta = STATUS_META[key];
            const items = rows.filter((r) => r.status === key);
            return (
              <div key={key} className="flex min-w-0 flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <span className={`chip ${meta.className}`}>{meta.label}</span>
                  <span className="text-xs text-ink3">{items.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((t) => (
                    <Link key={t.id} href={`/task/${t.id}`} className="card lift flex flex-col gap-1.5 p-3 hover:border-line2">
                      <span className="line-clamp-2 text-[13.5px] font-medium leading-snug">{t.title}</span>
                      <div className="flex items-center justify-between text-xs text-ink3">
                        <span className="truncate">
                          {t.projectName || (t.assignees.length ? t.assignees.map((a) => a.name).join(", ") : "Unassigned")}
                        </span>
                        {t.priority === "high" && <span className="chip chip-red flex-none">High</span>}
                      </div>
                    </Link>
                  ))}
                  {items.length === 0 && <div className="card p-3 text-center text-xs text-ink3">Empty</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
