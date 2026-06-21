import type { Verdict } from "@/lib/types";

const LABEL_STYLES: Record<Verdict["overallLabel"], string> = {
  "Strong Candidate": "bg-emerald-600 text-white",
  "Likely Hype": "bg-amber-500 text-white",
  Neutral: "bg-zinc-400 text-white",
};

function Score({ label, value }: { label: string; value: number }) {
  const pct = (value / 10) * 100;
  const barColor =
    value >= 7 ? "bg-emerald-500" : value >= 4 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-zinc-500">{label}</span>
        <span className="text-xs font-semibold text-zinc-900">{value}/10</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          AI Verdict
        </span>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${LABEL_STYLES[verdict.overallLabel]}`}
        >
          {verdict.overallLabel}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <Score label="Catalyst" value={verdict.catalystStrength} />
        <Score label="Financials" value={verdict.financialHealth} />
        <Score label="Volatility" value={verdict.volatilityPotential} />
      </div>
      {verdict.rationale && (
        <p className="mt-3 text-xs italic text-zinc-500">{verdict.rationale}</p>
      )}
    </div>
  );
}
