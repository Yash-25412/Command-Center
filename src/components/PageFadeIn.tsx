"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// The click-anchored circle-reveal in TransitionLink/globals.css only
// animates in browsers that support the native View Transitions API
// (Chromium-based browsers; not Firefox, and only very recent Safari).
// Everywhere else document.startViewTransition doesn't exist, TransitionLink
// falls straight back to a plain router.push, and the Work <-> Life Mastery
// switch cuts instantly with nothing visible -- which is what the recording
// showed. This is a universal, CSS-only fallback: it fades the new section
// in on top of whatever the View Transitions API already does, so there's
// always SOME visible transition regardless of browser support.
//
// It only reacts to crossing the Work <-> Life Mastery boundary (not every
// ordinary click inside Work), so normal in-section navigation is untouched.
function sectionOf(pathname: string | null): "life" | "work" {
  return pathname?.startsWith("/mastery") ? "life" : "work";
}

export default function PageFadeIn({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const section = sectionOf(pathname);
  const [renderedSection, setRenderedSection] = useState(section);
  const [visible, setVisible] = useState(true);

  // Detected during render (not in an effect) so the very first paint of the
  // new section is already invisible -- no flash of the new page at full
  // opacity before the fade-in kicks in.
  if (section !== renderedSection) {
    setRenderedSection(section);
    setVisible(false);
  }

  useEffect(() => {
    if (!visible) {
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(id);
    }
  }, [visible]);

  return (
    <div style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease" }}>
      {children}
    </div>
  );
}
