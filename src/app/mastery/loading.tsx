import styles from "@/components/life/mastery/mastery.module.css";

// Next.js shows this automatically the instant someone navigates to
// /mastery, for exactly as long as the page component above is awaiting its
// Supabase fetch (loadMasteryState()) -- that fetch is the actual source of
// the "second or two" of lag with nothing on screen. This is Next's
// built-in streaming fallback (no extra library, no manual timer): it
// appears whether the fetch takes 100ms or 2s and is swapped out the
// instant real data is ready, on both a fresh page load and a client-side
// navigation from TransitionLink.
export default function MasteryLoading() {
  return (
    <div className={styles.app}>
      <div className={styles.topbar}>
        <span className={styles.topbtn} style={{ opacity: 0.35 }}>
          ← COMMAND CENTER
        </span>
        <span className={styles.brand}>
          LIFE <span>// MASTERY OS</span>
        </span>
      </div>
      <main
        className={styles.workspace}
        style={{ alignItems: "center", justifyContent: "center", minHeight: "60vh" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            color: "#8B949E",
            fontFamily: "var(--jbmono), monospace",
            fontSize: 12,
            letterSpacing: "0.05em"
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "999px",
              border: "2px solid rgba(255,255,255,0.12)",
              borderTopColor: "#2DD4BF",
              animation: "mastery-loading-spin 0.8s linear infinite"
            }}
          />
          LOADING PROTOCOL&hellip;
        </div>
      </main>
      <style>{`@keyframes mastery-loading-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
