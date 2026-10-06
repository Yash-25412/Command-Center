import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteTradeImage } from "@/app/actions/life";

export const dynamic = "force-dynamic";

function fmtPoints(n: number) {
  return (n >= 0 ? "+" : "-") + Math.abs(n).toFixed(1) + " pts";
}

export default async function TradeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: trade }, { data: images }] = await Promise.all([
    supabase.from("trade").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("trade_image").select("*").eq("trade_id", params.id).order("created_at", { ascending: true })
  ]);

  if (!trade) notFound();

  const pnl = Number(trade.pnl);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/life/trading" className="text-[12.5px] font-semibold text-ink3 hover:text-accent">
          ← Back to journal
        </Link>
      </div>

      <div className="flex items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-[30px] font-medium tracking-tight">{trade.symbol}</h1>
            <span
              className={`rounded-[6px] px-2 py-0.5 text-[11px] font-bold ${
                trade.side === "Long" ? "bg-greenbg text-green" : "bg-redbg text-red"
              }`}
            >
              {trade.side}
            </span>
          </div>
          <span className="text-[13px] text-ink3">{trade.date}</span>
        </div>
        <span className={`font-serif text-2xl font-semibold ${pnl >= 0 ? "text-green" : "text-accent"}`}>
          {fmtPoints(pnl)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card flex flex-col p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Entry</span>
          <span className="font-mono mt-1 text-lg">{trade.entry ?? "—"}</span>
        </div>
        <div className="card flex flex-col p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Stop loss</span>
          <span className="font-mono mt-1 text-lg">{trade.sl ?? "—"}</span>
        </div>
        <div className="card flex flex-col p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Target</span>
          <span className="font-mono mt-1 text-lg">{trade.tp ?? "—"}</span>
        </div>
        <div className="card flex flex-col p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Exit</span>
          <span className="font-mono mt-1 text-lg">{trade.exit ?? "—"}</span>
        </div>
        <div className="card flex flex-col p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Realized R</span>
          <span className="font-mono mt-1 text-lg">
            {trade.r_multiple !== null ? `${Number(trade.r_multiple) >= 0 ? "+" : ""}${Number(trade.r_multiple).toFixed(2)}R` : "—"}
          </span>
        </div>
        <div className="card flex flex-col p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Setup</span>
          <span className="mt-1 text-lg">
            {trade.setup ? (
              <span className="rounded-full bg-sunk px-2.5 py-0.5 text-[13px] font-semibold text-ink2">{trade.setup}</span>
            ) : (
              "—"
            )}
          </span>
        </div>
      </div>

      <div className="card flex flex-col gap-2 p-5">
        <span className="font-serif text-lg font-medium">Notes</span>
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink2">{trade.notes || "No notes added."}</p>
      </div>

      <div className="card flex flex-col gap-3 p-5">
        <span className="font-serif text-lg font-medium">Charts &amp; screenshots</span>
        {images && images.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {images.map((img) => (
              <div key={img.id} className="group relative overflow-hidden rounded-[10px] border border-line">
                <a href={img.url} target="_blank" rel="noreferrer">
                  <Image
                    src={img.url}
                    alt="Trade attachment"
                    width={400}
                    height={300}
                    className="h-[160px] w-full object-cover"
                    unoptimized
                  />
                </a>
                <form action={deleteTradeImage} className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <input type="hidden" name="imageId" value={img.id} />
                  <input type="hidden" name="path" value={img.path} />
                  <input type="hidden" name="tradeId" value={trade.id} />
                  <button
                    type="submit"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(0,0,0,.55)] text-[13px] text-white"
                    aria-label="Remove image"
                  >
                    ✕
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-ink3">No images attached to this trade yet.</p>
        )}
      </div>
    </div>
  );
}
