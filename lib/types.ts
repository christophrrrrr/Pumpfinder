/**
 * Shared type contract for a per-stock briefing. All percentage fields are
 * fractions (0.05 = 5%) unless the name ends in "Pct" and is documented otherwise.
 */

export interface Fundamentals {
  symbol: string;
  name: string | null;
  currency: string | null;
  exchange: string | null;
  country: string | null;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  price: number | null;
  dayChange: number | null; // fraction; today's regular-market change
  totalRevenue: number | null;
  revenueGrowth: number | null; // fraction, YoY
  profitMargins: number | null; // fraction
  netIncomeToCommon: number | null;
  freeCashflow: number | null;
  operatingCashflow: number | null;
  totalCash: number | null;
  totalDebt: number | null;
  sharesOutstanding: number | null;
  isProfitable: boolean | null;
}

export interface PriceBar {
  date: string; // ISO
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BigMove {
  date: string; // ISO
  changePct: number; // fraction, single-day close-to-close
  volume: number;
}

export interface VolatilityStats {
  lastClose: number | null;
  lastChange: number | null; // fraction, most recent session
  annualizedVol: number | null; // fraction, e.g. 0.65 = 65%
  typicalDailyMove: number | null; // fraction, avg |daily move|
  maxGain: number | null; // fraction, biggest up day in window
  maxDrop: number | null; // fraction, biggest down day in window
  bigMoves: BigMove[]; // notable single-day moves, most recent first
  avgVolume: number | null;
  latestVolume: number | null;
  volumeSpikeRatio: number | null; // latest / avg
  isVolumeSpike: boolean;
  historyDays: number;
}

export interface NewsItem {
  title: string;
  source: string; // publisher name, "SEC EDGAR", "Google News"
  url: string;
  publishedAt: string | null; // ISO
  snippet: string | null;
  kind: "news" | "filing";
  filingType: string | null; // e.g. "8-K"
}

export type VerdictLabel = "Strong Candidate" | "Likely Hype" | "Neutral";

export interface Verdict {
  catalystStrength: number; // 0-10
  financialHealth: number; // 0-10
  volatilityPotential: number; // 0-10
  overallLabel: VerdictLabel;
  rationale: string;
}

export interface NewsBullet {
  text: string; // a concise factual point about what's going on
  sourceUrl: string | null; // link to the news/filing this point came from
  sourceName: string | null;
}

export interface AiSummary {
  bullets: NewsBullet[]; // digest of the news, each point linked to its source
  whyMoved: string;
  meaningfulVsHype: string;
  verdict: Verdict | null; // null when the verdict toggle is off
}

export interface StockBriefing {
  symbol: string;
  fundamentals: Fundamentals | null;
  volatility: VolatilityStats | null;
  news: NewsItem[];
  ai: AiSummary | null; // null when AI is disabled/unconfigured/unavailable
  errors: string[]; // soft, per-section failures (shown subtly in the UI)
  generatedAt: string; // ISO
  fromCache: boolean;
}
