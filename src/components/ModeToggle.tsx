"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Work <-> Life is a full context switch: it's a route change (different
// layout, different sidebar, different color identity via the "life" class
// on <html>), not a client-side filter. Both sidebars render this same pill
// so the switch is reachable from either side.
export default function ModeToggle() {
  const pathname = usePathname();
  const isLife = pathname?.startsWith("/life");

  return (
    <div className="flex items-center gap-0 rounded-full border border-line2 bg-sunk p-[3px]">
      <Link
        href="/today"
        className={`flex-1 rounded-full py-1.5 text-center text-[12.5px] font-semibold ${
          !isLife ? "bg-accent text-onaccent" : "text-ink3"
        }`}
      >
        Work
      </Link>
      <Link
        href="/life"
        className={`flex-1 rounded-full py-1.5 text-center text-[12.5px] font-semibold ${
          isLife ? "bg-accent text-onaccent" : "text-ink3"
        }`}
      >
        Life
      </Link>
    </div>
  );
}
