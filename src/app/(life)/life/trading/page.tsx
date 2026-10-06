import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SkillLadder from "@/components/life/SkillLadder";
import TradeExplorer from "@/components/life/TradeExplorer";
import EquityCurve from "@/components/life/EquityCurve";

export const dynamic = "force-dynamic";

function fmtMoney(n: number) {
  return (n >= 0 ? "+₹" : "-₹") + Math.abs(Math.round(n)).toLocaleString("en-IN");
}

export default async function TradingPage() {
  const supabase = createClient();

  const [{ data: skill }, { data: trades }, { data: images }] = await Promise.all([
    supabase.from("skill").select("*").eq("kind", "trading").maybeSingle(),
    supabase.from("trade").select("*").order("date", { ascending: true }),
    supabase.from("trade_image").select("trade_id")
  ]);

  const all = trades || [];
  const imageCountByTrade = new Map<string, number>();
  (images || []).forEach((img) => imageCountByTrade.set(img.trade_id, (imageCountByTrade.get(img.trade_id) || 0) + 1));

  const wins = all.filter((t) => t.pnl > 0);
  const losses = all.filter((t) => t.pnl < 0);
  const net = all.reduce((s, t) => s + Number(t.pnl), 0);
  const winRate = all.length ? Math.round((wins.length / all.length) * 100) : 0;
  const grossWin = wins.reduce((s, t) => s + Number(t.pnl), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + Number(t.pnl), 0));
  const profitFactor = grossLoss ? (grossWin / grossLoss).toFixed(2) : grossWin ? "∞" : "—";
  const avgR = all.length
    ? (all.reduce((s, t) => s + Number(t.r_multiple || 0), 0) / all.length).toFixed(2)
    : "0.00";

  let peak = 0,
    running = 0,
    maxDD = 0;
  all.forEach((t) => {
    running += Number(t.pnl);
    peak = Math.max(peak, running);
    maxDD = Math.min(maxDD, running - peak);
  });

  const stats = [
    { label: "Net P&L", value: fmtMoney(net), positive: net >= 0 },
    { label: "Win rate", value: `${winRate}%`, positive: true },
    { label: "Profit factor", value: profitFactor, positive: true },
    { label: "Avg R", value: avgR, positive: parseFloat(avgR) >= 0 },
    { label: "Max drawdown", value: fmtMoney(maxDD), positive: false },
    { label: "Trades logged", value: String(all.length), positive: true }
  ];

  const tradeRows = all
    .slice()
    .reverse()
    .map((t) => ({
      id: t.id,
      date: t.date,
      symbol: t.symbol,
      side: t.side as "Long" | "Short",
      entry: t.entry,
      exit: t.exit,
      pnl: Number(t.pnl),
      r: t.r_multiple ? Number(t.r_multiple) : null,
      setup: t.setup,
      notes: t.notes,
      imageCount: imageCountByTrade.get(t.id) || 0
    }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-plum">Trading</span>
          <h1 className="font-serif text-[30px] font-medium tracking-tight">Journal &amp; path to funded</h1>
        </div>
        <Link href="/life/trading/new" className="btn btn-pri">
          + Log a trade
        </Link>
      </div>

      {skill && (
        <SkillLadder skillId={skill.id} stages={skill.stages} currentStage={skill.current_stage} accentClass="bg-plum" compact />
      )}

      <div className="grid grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card flex flex-col p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">{s.label}</span>
            <span className={`font-serif mt-1 text-xl font-semibold ${s.positive ? "text-green" : "text-accent"}`}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      <div className="card flex flex-col gap-1.5 p-5">
        <span className="font-serif text-lg font-medium">Equity curve — all trades</span>
        <EquityCurve pnls={all.map((t) => Number(t.pnl))} />
      </div>

      <TradeExplorer trades={tradeRows} />
    </div>
  );
}
