import Link from "next/link";
import { dueLabel, initials } from "@/lib/format";

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
}

export default function TaskRow({ t }: { t: RowTask }) {
  const due = dueLabel(t.due_date);
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
      <span
        className={`avatar h-[22px] w-[22px] text-[10px] ${t.doerIsMe ? "avatar-me" : ""}`}
        style={t.doerIsMe ? undefined : { background: `hsl(${t.doerHue} 30% 88%)`, color: `hsl(${t.doerHue} 35% 32%)` }}
        title={t.doerName}
      >
        {initials(t.doerName)}
      </span>
      <span className={`chip w-[92px] justify-center ${due.cls}`}>{due.label}</span>
    </Link>
  );
}
