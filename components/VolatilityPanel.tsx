import type { VolatilityStats } from "@/lib/types";
import { formatCompact, formatDate, formatPct } from "@/lib/format";

function volLabel(annualized: number | null): { text: string; cls: string } | null {
  if (annualized == null) return null;
  if (annualized >= 1.0) return { text: "Extreme", cls: "bg-red-100 text-red-700" };
  if (annualized >= 0.6) return { text: "Very High", cls: "bg-orange-100 text-orange-700" };
  if (annualized >= 0.35) return { text: "High", cls: "bg-amber-100 text-amber-700" };
  if (annualized >= 0.2) return { text: "Moderate", cls: "bg-zinc-100 text-zinc-700" };
  return { text: "Low", cls: "bg-emerald-100 text-emerald-700" };
}

export default function VolatilityPanel({
  v,
  symbol,
}: {
  v: VolatilityStats;
  symbol: string;
}) {
  const label = volLabel(v.annualizedVol);
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-700">Volatility & Behavior</h3>
        {label && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${label.cls}`}>
            {label.text}
          </span>
        )}
        <a
          href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs font-medium text-indigo-600 hover:underline"
        >
          View chart on TradingView ↗
        </a>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Annualized Vol
          </span>
          <span className="text-sm font-semibold text-zinc-900">
            {formatPct(v.annualizedVol)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Typical Daily Move
          </span>
          <span className="text-sm font-semibold text-zinc-900">
            {formatPct(v.typicalDailyMove)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Volume vs Avg
          </span>
          <span
            className={`text-sm font-semibold ${
              v.isVolumeSpike ? "text-orange-600" : "text-zinc-900"
            }`}
          >
            {v.volumeSpikeRatio != null ? `${v.volumeSpikeRatio.toFixed(1)}×` : "—"}
            {v.isVolumeSpike && " spike"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Biggest Up Day
          </span>
          <span className="text-sm font-semibold text-emerald-600">
            {formatPct(v.maxGain, { sign: true })}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Biggest Down Day
          </span>
          <span className="text-sm font-semibold text-red-600">
            {formatPct(v.maxDrop, { sign: true })}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            History
          </span>
          <span className="text-sm font-semibold text-zinc-900">{v.historyDays}d</span>
        </div>
      </div>

      {v.bigMoves.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Recent ±15% days
          </p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {v.bigMoves.map((m) => (
              <li
                key={m.date}
                className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                  m.changePct > 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
                title={`Volume ${formatCompact(m.volume)}`}
              >
                {formatDate(m.date)}: {formatPct(m.changePct, { sign: true })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
