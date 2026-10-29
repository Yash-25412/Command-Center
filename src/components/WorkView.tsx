"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import TaskRow, { RowTask } from "@/components/TaskRow";
import { STATUS_META, STATUS_ORDER, FLAG_META } from "@/lib/format";
import { changeStatus } from "@/app/actions/tasks";

const FLAG_TABS: { key: "all" | "follow_up" | "update"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "follow_up", label: FLAG_META.follow_up.label },
  { key: "update", label: FLAG_META.update.label }
];

function StatusGroup({ meta, items }: { meta: { label: string; className: string }; items: RowTask[] }) {
  const [tab, setTab] = useState<"all" | "follow_up" | "update">("all");

  const counts = {
    all: items.length,
    follow_up: items.filter((t) => t.flag_type === "follow_up").length,
    update: items.filter((t) => t.flag_type === "update").length
  };
  const flaggedCount = counts.follow_up + counts.update;
  const shown = tab === "all" ? items : items.filter((t) => t.flag_type === tab);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="font-semibold">{meta.label}</span>
        <span className="text-ink3">{items.length}</span>
      </div>
      {flaggedCount > 0 && (
        <div className="flex gap-1.5">
          {FLAG_TABS.filter((f) => f.key === "all" || counts[f.key] > 0).map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setTab(f.key)}
              className={`h-6 rounded-full border px-2.5 text-[11.5px] font-semibold ${
                tab === f.key ? "border-transparent bg-ink text-bg" : "border-line2 text-ink2 hover:bg-hover"
              }`}
            >
              {f.label} {f.key !== "all" && counts[f.key]}
            </button>
          ))}
        </div>
      )}
      <div className="card overflow-hidden">
        {shown.map((t) => (
          <TaskRow key={t.id} t={t} />
        ))}
        {shown.length === 0 && <div className="p-5 text-center text-ink3">Nothing with this flag.</div>}
      </div>
    </section>
  );
}

export default function WorkView({ initialView, rows }: { initialView: "list" | "board"; rows: RowTask[] }) {
  // List <-> Board is purely a different arrangement of data already on the
  // page, so switching never needs to touch the network.
  const [view, setView] = useState<"list" | "board">(initialView);

  // Mirrored locally so dragging a card between columns can repaint
  // instantly, instead of waiting on a full page round-trip. Re-syncs
  // whenever the server sends fresh rows (new filter, revalidation, etc).
  const [localRows, setLocalRows] = useState(rows);
  useEffect(() => setLocalRows(rows), [rows]);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDrop(newStatus: string) {
    setOverColumn(null);
    const id = draggingId;
    setDraggingId(null);
    if (!id) return;
    const task = localRows.find((r) => r.id === id);
    if (!task || task.status === newStatus) return;

    const from = task.status;
    setLocalRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    const fd = new FormData();
    fd.set("taskId", id);
    fd.set("from", from);
    fd.set("to", newStatus);
    startTransition(() => {
      changeStatus(fd);
    });
  }

  const groups = STATUS_ORDER.map((key) => ({
    key,
    meta: STATUS_META[key],
    items: localRows.filter((r) => r.status === key)
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
            <StatusGroup key={g.key} meta={g.meta} items={g.items} />
          ))}
          {localRows.length === 0 && (
            <div className="card p-10 text-center text-ink2">Nothing matches these filters.</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-6 items-start gap-3">
          {STATUS_ORDER.map((key) => {
            const meta = STATUS_META[key];
            const items = localRows.filter((r) => r.status === key);
            return (
              <div
                key={key}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (overColumn !== key) setOverColumn(key);
                }}
                onDragLeave={() => setOverColumn((c) => (c === key ? null : c))}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(key);
                }}
                className={`flex min-w-0 flex-col gap-2 p-1.5 ${overColumn === key ? "kanban-column-over" : ""}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`chip ${meta.className}`}>{meta.label}</span>
                  <span className="text-xs text-ink3">{items.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((t) => (
                    <Link
                      key={t.id}
                      href={`/task/${t.id}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        setDraggingId(t.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setOverColumn(null);
                      }}
                      className={`card lift kanban-card flex flex-col gap-1.5 p-3 hover:border-line2 ${
                        draggingId === t.id ? "kanban-card-dragging" : ""
                      }`}
                    >
                      <span className="line-clamp-2 text-[13.5px] font-medium leading-snug">{t.title}</span>
                      <div className="flex items-center justify-between text-xs text-ink3">
                        <span className="truncate">
                          {t.projectName || (t.assignees.length ? t.assignees.map((a) => a.name).join(", ") : "Unassigned")}
                        </span>
                        {t.priority === "high" && <span className="chip chip-red flex-none">High</span>}
                      </div>
                      {t.flag_type && (
                        <span className={`chip w-fit ${FLAG_META[t.flag_type].cls}`}>{FLAG_META[t.flag_type].label}</span>
                      )}
                    </Link>
                  ))}
                  {items.length === 0 && (
                    <div className="card p-3 text-center text-xs text-ink3">
                      {overColumn === key ? "Drop here" : "Empty"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
