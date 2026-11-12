"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";

// A click-anchored page transition for the two big section jumps (Work <->
// Life Mastery). Uses the browser's native View Transitions API -- no
// library, nothing to install -- so a click on this link records where you
// clicked and the new page reveals outward from that exact point instead of
// the old hard cut.
//
// Falls back to a plain router.push with no special effect in any browser
// that doesn't support document.startViewTransition yet; nothing breaks,
// it's just not animated there.
export default function TransitionLink({
  href,
  className,
  style,
  children
}: {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // let modified clicks behave normally (open in new tab, etc.)
    e.preventDefault();

    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    document.documentElement.style.setProperty("--vt-x", x + "%");
    document.documentElement.style.setProperty("--vt-y", y + "%");

    const doc = document as any;
    if (typeof doc.startViewTransition !== "function") {
      router.push(href);
      return;
    }

    doc.startViewTransition(
      () =>
        new Promise<void>((resolve) => {
          startTransition(() => {
            router.push(href);
            // Give the new route a couple of frames to paint before the
            // transition snapshot is taken as "after".
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          });
        })
    );
  }

  return (
    <a href={href} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  );
}
