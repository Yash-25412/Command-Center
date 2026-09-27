import Link from "next/link";
import { dueLabel, initials } from "@/lib/format";

export interface RowAssignee {
  id: string;
  name: string;
  is_me: boolean;
  hue: number;
}

export interface RowTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  next_action: string;
  doerName: string;
  doerIsMe: boolean;
  doerHue: number;
  projectName: string | null;
  assignees: RowAssignee[];
}

export default function TaskRow({ t }: { t: RowTask }) {
  const due = dueLabel(t.due_date);
  const shown = t.assignees.slice(0, 3);
  const extra = t.assignees.length - shown.length;
  return (
    <Link
      href={`/task/${t.id}`}
      className="row-hover flex items-center gap-3.5 border-t border-line px-4 py-2.5 first:border-t-0"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{t.title}</div>
        <div className="truncate text-[13px] text-ink2">
          {t.next_action ? `Next: ${t.next_action}` : t.projectName || "No project"}
        </div>
      </div>
      {t.priority === "high" && <span className="chip chip-red">High</span>}
      <div className="flex flex-none -space-x-1.5">
        {shown.length === 0 && (
          <span className="avatar h-[22px] w-[22px] flex-none text-[10px]" title="Unassigned">
            ?
          </span>
        )}
        {shown.map((a) => (
          <span
            key={a.id}
            className={`avatar h-[22px] w-[22px] flex-none text-[10px] ring-2 ring-surface ${a.is_me ? "avatar-me" : ""}`}
            style={a.is_me ? undefined : { background: `hsl(${a.hue} 30% 88%)`, color: `hsl(${a.hue} 35% 32%)` }}
            title={a.is_me ? "Me" : a.name}
          >
            {initials(a.is_me ? "Me" : a.name)}
          </span>
        ))}
        {extra > 0 && (
          <span className="avatar h-[22px] w-[22px] flex-none text-[10px]" title={t.assignees.slice(3).map((a) => a.name).join(", ")}>
            +{extra}
          </span>
        )}
      </div>
      <span className={`chip w-[92px] justify-center ${due.cls}`}>{due.label}</span>
    </Link>
  );
}
