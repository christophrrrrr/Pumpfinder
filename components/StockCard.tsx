import type { StockBriefing } from "@/lib/types";
import { formatCompact, formatMoney, formatPct, timeAgo } from "@/lib/format";
import FinancialsPanel from "@/components/FinancialsPanel";
import VolatilityPanel from "@/components/VolatilityPanel";
import NewsList from "@/components/NewsList";
import NewsSummary from "@/components/NewsSummary";
import AiSummaryPanel from "@/components/AiSummaryPanel";
import VerdictBadge from "@/components/VerdictBadge";

export default function StockCard({ briefing }: { briefing: StockBriefing }) {
  const { fundamentals: f, volatility: v } = briefing;
  const name = f?.name ?? briefing.symbol;
  const day = f?.dayChange ?? v?.lastChange ?? null;
  const dayTone =
    day == null ? "text-zinc-500" : day > 0 ? "text-emerald-600" : day < 0 ? "text-red-600" : "text-zinc-500";

  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">
              {briefing.symbol}
            </h2>
            {f?.exchange && (
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-500">
                {f.exchange}
              </span>
            )}
          </div>
          <p className="truncate text-sm text-zinc-500">{name}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-semibold text-zinc-900">
            {formatMoney(f?.price, f?.currency ?? "USD")}
          </div>
          <div className={`text-sm font-medium ${dayTone}`}>
            {formatPct(day, { sign: true })} today
          </div>
          <div className="text-xs text-zinc-400">{formatCompact(f?.marketCap, f?.currency ?? "USD")} cap</div>
        </div>
      </header>

      {briefing.errors.length > 0 && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {briefing.errors.join(" · ")}
        </div>
      )}

      {briefing.ai?.verdict && <VerdictBadge verdict={briefing.ai.verdict} />}
      {briefing.ai && <AiSummaryPanel ai={briefing.ai} />}
      {f && <FinancialsPanel f={f} />}
      {v && <VolatilityPanel v={v} symbol={briefing.symbol} />}
      {briefing.ai && briefing.ai.bullets.length > 0 ? (
        <NewsSummary bullets={briefing.ai.bullets} />
      ) : (
        <NewsList items={briefing.news} />
      )}

      <footer className="mt-1 border-t border-zinc-100 pt-2 text-xs text-zinc-400">
        Generated {timeAgo(briefing.generatedAt)}
        {briefing.fromCache && " · cached"}
      </footer>
    </article>
  );
}
