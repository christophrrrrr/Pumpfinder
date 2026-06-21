import type { Fundamentals } from "@/lib/types";
import { formatCompact, formatPct } from "@/lib/format";

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "good" | "bad";
}) {
  const toneClass =
    tone === "good" ? "text-emerald-600" : tone === "bad" ? "text-red-600" : "text-zinc-900";
  return (
    <div className="flex flex-col">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      <span className={`text-sm font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}

function signTone(n: number | null | undefined): "neutral" | "good" | "bad" {
  if (n == null) return "neutral";
  return n > 0 ? "good" : n < 0 ? "bad" : "neutral";
}

export default function FinancialsPanel({ f }: { f: Fundamentals }) {
  const cur = f.currency ?? "USD";
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-zinc-700">Financial Health</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <Stat label="Market Cap" value={formatCompact(f.marketCap, cur)} />
        <Stat label="Revenue (TTM)" value={formatCompact(f.totalRevenue, cur)} />
        <Stat
          label="Rev. Growth"
          value={formatPct(f.revenueGrowth, { sign: true })}
          tone={signTone(f.revenueGrowth)}
        />
        <Stat
          label="Profitable"
          value={
            f.isProfitable == null ? "—" : f.isProfitable ? "Yes" : "No"
          }
          tone={f.isProfitable == null ? "neutral" : f.isProfitable ? "good" : "bad"}
        />
        <Stat
          label="Profit Margin"
          value={formatPct(f.profitMargins, { sign: true })}
          tone={signTone(f.profitMargins)}
        />
        <Stat
          label="Free Cash Flow"
          value={formatCompact(f.freeCashflow, cur)}
          tone={signTone(f.freeCashflow)}
        />
        <Stat label="Cash" value={formatCompact(f.totalCash, cur)} />
        <Stat label="Debt" value={formatCompact(f.totalDebt, cur)} />
        <Stat label="Country" value={f.country ?? "—"} />
      </div>
      {(f.sector || f.industry) && (
        <p className="mt-3 text-xs text-zinc-400">
          {[f.sector, f.industry].filter(Boolean).join(" · ")}
        </p>
      )}
    </section>
  );
}
