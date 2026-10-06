"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ModeToggle from "./ModeToggle";

const NAV = [
  { href: "/life", label: "Dashboard" },
  { href: "/life/trading", label: "Trading" },
  { href: "/life/side-hustle", label: "Side Hustle" },
  { href: "/life/skills", label: "Skills" },
  { href: "/life/habits", label: "Habits" }
];

export default function LifeSidebar() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);

  // Shares the same "cc-theme" localStorage key as Work mode's toggle, so
  // light/dark stays consistent whichever side you're on when you flip it.
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
        <span className="font-serif text-[19px] font-medium tracking-tight">Command Center</span>
      </div>

      <ModeToggle />

      <nav className="flex flex-col gap-0.5">
        {NAV.map((n) => {
          const on = n.href === "/life" ? pathname === "/life" : pathname?.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex h-9 items-center gap-2.5 rounded-lg px-2.5 font-medium ${
                on ? "bg-accentbg text-accent" : "text-ink2 hover:bg-hover hover:text-ink"
              }`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2.5 px-1">
        <button onClick={toggleTheme} className="btn btn-sm justify-center">
          {dark ? "Switch to light" : "Switch to dark"}
        </button>
        <p className="px-1 text-xs leading-snug text-ink3">
          Life mode: goals, side projects and habits — nothing here is official work.
        </p>
      </div>
    </aside>
  );
}
