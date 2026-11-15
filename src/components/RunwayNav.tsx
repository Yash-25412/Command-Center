"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import QuickAdd, { CaptureTab } from "./QuickAdd";
import TransitionLink from "./TransitionLink";

const NAV = [
  { href: "/today", label: "Cockpit", match: ["/today"] },
  { href: "/work", label: "All work", match: ["/work", "/task"] },
  { href: "/projects", label: "Projects", match: ["/projects", "/project"] },
  { href: "/dashboard", label: "Dashboard", match: ["/dashboard"] }
];

// Opens Capture from anywhere: window.dispatchEvent(new CustomEvent("cc:capture", { detail: "reminder" }))
export function openCapture(tab: CaptureTab = "task") {
  window.dispatchEvent(new CustomEvent("cc:capture", { detail: tab }));
}

export default function RunwayNav({
  people,
  categories,
  projects
}: {
  people: { id: string; name: string; is_me: boolean }[];
  categories: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}) {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<CaptureTab>("task");
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setTab("task");
        setOpen(true);
      }
    };
    const onCapture = (e: Event) => {
      setTab(((e as CustomEvent).detail as CaptureTab) || "task");
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("cc:capture", onCapture);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cc:capture", onCapture);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 flex justify-center px-4 pt-5">
        <div className="glass flex flex-wrap items-center justify-center gap-1.5 rounded-full p-1.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]" style={{ background: "rgba(18,20,24,0.62)" }}>
          <Link href="/today" aria-label="Command Center home" className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "conic-gradient(from 210deg, #F4F7F9, #9DB7C6, #E9D9C3, #F4F7F9)" }}>
            <span className="h-7 w-7 rounded-full bg-[#0c0d10]" />
          </Link>
          <div className="flex gap-0.5 rounded-full border border-[var(--glass-line)] p-0.5">
            <span className="seg seg-on inline-flex items-center">Work</span>
            <TransitionLink href="/mastery" className="seg inline-flex items-center">
              Life
            </TransitionLink>
          </div>
          <nav aria-label="Primary" className="flex flex-wrap gap-0.5">
            {NAV.map((n) => {
              const on = n.match.some((m) => pathname.startsWith(m));
              return (
                <Link key={n.href} href={n.href} className={`seg inline-flex h-11 items-center ${on ? "seg-on" : ""}`}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={() => {
              setTab("task");
              setOpen(true);
            }}
            className="btn h-11 gap-2"
            aria-label="Capture (Command K)"
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="font-mono text-[11.5px] text-ink2">⌘K</span>
          </button>
        </div>
      </header>
      <QuickAdd open={open} tab={tab} onClose={close} people={people} categories={categories} projects={projects} />
    </>
  );
}
