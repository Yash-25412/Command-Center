// Small glass-card ring stat, the Glass Pro dashboard's signature piece —
// pure SVG + CSS vars, so it already themes correctly across Work/Life and
// light/dark without any extra work. No client-side JS needed since it's
// static per page load.
export default function ProgressRing({
  pct,
  display,
  label,
  colorVar
}: {
  pct: number;
  display: string;
  label: string;
  colorVar: "--green" | "--amber" | "--red" | "--accent" | "--teal";
}) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = c - (clamped / 100) * c;

  return (
    <div className="card flex flex-col items-center gap-2 p-4">
      <div className="relative h-[76px] w-[76px] flex-none">
        <svg width="76" height="76" viewBox="0 0 76 76" className="absolute inset-0" aria-hidden="true">
          <circle cx="38" cy="38" r={r} fill="none" stroke="var(--line)" strokeWidth="7" />
          <circle
            cx="38"
            cy="38"
            r={r}
            fill="none"
            stroke={`var(${colorVar})`}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform="rotate(-90 38 38)"
            style={{ transition: "stroke-dashoffset 0.4s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[15px] font-bold">{display}</div>
      </div>
      <span className="text-[12px] font-medium text-ink2">{label}</span>
    </div>
  );
}
