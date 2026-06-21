import type { Fundamentals, VolatilityStats } from "@/lib/types";

/**
 * Deterministic, transparent 0-10 scores for the verdict.
 * (Catalyst stays an AI judgment; these two do not.)
 */

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, Math.round(n)));
}

/** Biggest single-day move (either direction) over the lookback, as a fraction. */
export function peakSingleDayMove(v: VolatilityStats): number | null {
  const moves = [v.maxGain, v.maxDrop].filter((x): x is number => x != null).map(Math.abs);
  return moves.length > 0 ? Math.max(...moves) : null;
}

/**
 * Volatility 0-10, aligned with the rating tiers:
 * <=10% Low (0-3), >10% Moderate (3-6), >30% High (6-9), >100% Extreme (9-10).
 */
export function volatilityScore(v: VolatilityStats | null): number | null {
  if (!v) return null;
  const p = peakSingleDayMove(v);
  if (p == null) return null;
  let s: number;
  if (p <= 0.1) s = (p / 0.1) * 3;
  else if (p <= 0.3) s = 3 + ((p - 0.1) / 0.2) * 3;
  else if (p <= 1.0) s = 6 + ((p - 0.3) / 0.7) * 3;
  else s = 9 + Math.min((p - 1.0) / 1.0, 1);
  return clamp10(s);
}

/**
 * Financial health 0-10 from a transparent rubric:
 * profitable (+3), positive FCF (+2), revenue growth (+1/+2),
 * balance sheet cash vs debt (+1/+2), strong margin (+1).
 */
export function financialHealthScore(f: Fundamentals | null): number | null {
  if (!f) return null;
  const signals = [f.isProfitable, f.freeCashflow, f.revenueGrowth, f.totalCash, f.profitMargins];
  if (signals.every((x) => x == null)) return null; // no usable data

  let s = 0;
  if (f.isProfitable === true) s += 3;
  if (f.freeCashflow != null && f.freeCashflow > 0) s += 2;
  if (f.revenueGrowth != null) {
    if (f.revenueGrowth > 0.2) s += 2;
    else if (f.revenueGrowth > 0) s += 1;
  }
  if (f.totalCash != null && f.totalDebt != null) {
    if (f.totalCash > f.totalDebt) s += 2;
    else if (f.totalCash >= 0.5 * f.totalDebt) s += 1;
  } else if (f.totalCash != null && f.totalDebt == null) {
    s += 1;
  }
  if (f.profitMargins != null && f.profitMargins > 0.15) s += 1;
  return clamp10(s);
}
