"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import QuickAdd from "./QuickAdd";

const NAV = [
  { href: "/work", label: "Work" },
  { href: "/inbox", label: "Inbox" }
];

export default function Sidebar({ inboxCount, peopleNames }: { inboxCount: number; peopleNames: string[] }) {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [qaOpen, setQaOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cc-theme");
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("cc-theme", next ? "dark" : "light");
  }

  return (
    <aside className="flex w-[232px] flex-none flex-col gap-[18px] border-r border-line px-3.5 py-[18px]">
      <div className="flex items-center gap-2.5 px-2">
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-ink text-bg">
          <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h4l2-6 4 12 2-6h4" />
          </svg>
        </span>
        <span className="font-serif text-[19px] font-medium tracking-tight">Command Center</span>
      </div>

      <button onClick={() => setQaOpen(true)} className="btn btn-pri h-[38px] justify-center">
        <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Quick add
      </button>

      <nav className="flex flex-col gap-0.5">
        {NAV.map((n) => {
          const on = pathname?.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex h-9 items-center gap-2.5 rounded-lg px-2.5 font-medium ${
                on ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-ink2 hover:bg-hover hover:text-ink"
              }`}
            >
              <span className="flex-1">{n.label}</span>
              {n.href === "/inbox" && inboxCount > 0 && (
                <span className="text-xs tabular-nums text-ink3">{inboxCount}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2.5 px-1">
        <button onClick={toggleTheme} className="btn btn-sm justify-center">
          {dark ? "Switch to light" : "Switch to dark"}
        </button>
        <p className="px-1 text-xs leading-snug text-ink3">
          More screens (Today, Projects, People, Waiting) are on the way.
        </p>
      </div>

      <QuickAdd open={qaOpen} onClose={() => setQaOpen(false)} peopleNames={peopleNames} />
    </aside>
  );
}
