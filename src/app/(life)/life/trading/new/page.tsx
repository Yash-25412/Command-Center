import Link from "next/link";
import TradeForm from "@/components/life/TradeForm";

export default function NewTradePage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/life/trading" className="text-[12.5px] font-semibold text-ink3 hover:text-accent">
          ← Back to journal
        </Link>
        <h1 className="font-serif mt-1 text-[30px] font-medium tracking-tight">Log a trade</h1>
      </div>

      <TradeForm today={today} />
    </div>
  );
}
