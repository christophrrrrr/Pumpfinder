import type { BigMove, PriceBar, VolatilityStats } from "@/lib/types";

const TRADING_DAYS_PER_YEAR = 252;
const BIG_MOVE_THRESHOLD = 0.15; // |single-day move| counted as a "sudden move"
const VOLUME_SPIKE_RATIO = 2; // latest volume vs trailing average
const VOLUME_LOOKBACK = 30;
const MAX_BIG_MOVES = 8;

function stdev(values: number[]): number | null {
  if (values.length < 2) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Derive volatility/behavioral stats from daily bars (oldest first).
 * Answers: how volatile is this normally, has it spiked/crashed before, and is
 * today's volume unusual.
 */
export function computeVolatility(bars: PriceBar[]): VolatilityStats {
  const historyDays = bars.length;
  const empty: VolatilityStats = {
    lastClose: bars.at(-1)?.close ?? null,
    lastChange: null,
    annualizedVol: null,
    typicalDailyMove: null,
    maxGain: null,
    maxDrop: null,
    bigMoves: [],
    avgVolume: null,
    latestVolume: bars.at(-1)?.volume ?? null,
    volumeSpikeRatio: null,
    isVolumeSpike: false,
    historyDays,
  };
  if (bars.length < 2) return empty;

  // Close-to-close daily returns, using split/dividend-adjusted prices so a
  // (reverse) split is never mistaken for a real single-day move.
  const returns: number[] = [];
  const bigMoves: BigMove[] = [];
  for (let i = 1; i < bars.length; i++) {
    const prev = bars[i - 1].adjclose;
    const cur = bars[i].adjclose;
    if (!prev) continue;
    const r = cur / prev - 1;
    returns.push(r);
    if (Math.abs(r) >= BIG_MOVE_THRESHOLD) {
      bigMoves.push({ date: bars[i].date, changePct: r, volume: bars[i].volume });
    }
  }

  const sd = stdev(returns);
  const annualizedVol = sd != null ? sd * Math.sqrt(TRADING_DAYS_PER_YEAR) : null;
  const typicalDailyMove =
    returns.length > 0
      ? returns.reduce((a, b) => a + Math.abs(b), 0) / returns.length
      : null;
  const maxGain = returns.length ? Math.max(...returns) : null;
  const maxDrop = returns.length ? Math.min(...returns) : null;

  // Volume spike: latest vs trailing average (excluding the latest bar).
  const latestVolume = bars.at(-1)?.volume ?? null;
  const lookback = bars.slice(Math.max(0, bars.length - 1 - VOLUME_LOOKBACK), bars.length - 1);
  const avgVolume =
    lookback.length > 0
      ? lookback.reduce((a, b) => a + b.volume, 0) / lookback.length
      : null;
  const volumeSpikeRatio =
    latestVolume != null && avgVolume && avgVolume > 0 ? latestVolume / avgVolume : null;

  return {
    lastClose: bars.at(-1)?.close ?? null,
    lastChange: returns.at(-1) ?? null,
    annualizedVol,
    typicalDailyMove,
    maxGain,
    maxDrop,
    bigMoves: bigMoves.reverse().slice(0, MAX_BIG_MOVES), // most recent first
    avgVolume,
    latestVolume,
    volumeSpikeRatio,
    isVolumeSpike: volumeSpikeRatio != null && volumeSpikeRatio >= VOLUME_SPIKE_RATIO,
    historyDays,
  };
}
