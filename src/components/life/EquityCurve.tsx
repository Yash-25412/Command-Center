// Pure computation from already-fetched data — no interactivity, so this
// stays a server component (no "use client", no hooks).
export default function EquityCurve({ pnls }: { pnls: number[] }) {
  if (pnls.length === 0) {
    return <div className="flex h-[180px] items-center justify-center text-sm text-ink3">No trades logged yet.</div>;
  }

  let cum = 0;
  const points = pnls.map((p) => (cum += p));
  const minV = Math.min(0, ...points);
  const maxV = Math.max(0, ...points);
  const span = maxV - minV || 1;
  const stepX = 560 / (points.length - 1 || 1);
  const coords = points.map((v, i) => {
    const x = Math.round(i * stepX);
    const y = Math.round(170 - ((v - minV) / span) * 160 - 5);
    return [x, y];
  });
  const linePath = coords.map((c, i) => (i === 0 ? `M${c[0]},${c[1]}` : `L${c[0]},${c[1]}`)).join(" ");
  const fillPath = `${linePath} L${coords[coords.length - 1][0]},178 L0,178 Z`;

  return (
    <svg viewBox="0 0 560 180" className="mt-1 h-[180px] w-full" preserveAspectRatio="none">
      <path d={fillPath} fill="var(--plum-bg)" />
      <path d={linePath} fill="none" stroke="var(--plum)" strokeWidth={2.5} />
    </svg>
  );
}
