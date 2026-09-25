import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        sunk: "var(--sunk)",
        hover: "var(--hover)",
        line: "var(--line)",
        line2: "var(--line2)",
        ink: "var(--ink)",
        ink2: "var(--ink2)",
        ink3: "var(--ink3)",
        accent: "var(--accent)",
        accentbg: "var(--accent-bg)",
        onaccent: "var(--on-accent)",
        green: "var(--green)",
        greenbg: "var(--green-bg)",
        amber: "var(--amber)",
        amberbg: "var(--amber-bg)",
        red: "var(--red)",
        redbg: "var(--red-bg)",
        teal: "var(--teal)",
        tealbg: "var(--teal-bg)",
        gray: "var(--gray)",
        graybg: "var(--gray-bg)"
      },
      fontFamily: {
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
        serif: ["var(--font-newsreader)", "Georgia", "serif"]
      },
      borderRadius: {
        xl2: "14px"
      }
    }
  },
  plugins: []
};

export default config;
