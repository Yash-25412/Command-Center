"use client";

import { useEffect } from "react";

// Adds the "life" class to <html> while any Life-mode page is mounted, and
// removes it on the way out. globals.css defines ".life" and ".life.dark"
// variable blocks that override the same --bg/--ink/--accent/etc. variables
// Work mode uses, so every existing .card/.btn/.chip/.field rule repaints
// with Life's warm clay/plum palette automatically — nothing else changes.
export default function LifeThemeScope() {
  useEffect(() => {
    document.documentElement.classList.add("life");
    return () => {
      document.documentElement.classList.remove("life");
    };
  }, []);

  return null;
}
