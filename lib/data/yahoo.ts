import YahooFinance from "yahoo-finance2";
import type { Fundamentals, PriceBar } from "@/lib/types";

// Single shared client. Suppress the library's interactive survey notice.
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

/** Normalize a user-entered symbol (uppercase, trimmed). */
export function normalizeSymbol(raw: string): string {
  return raw.trim().toUpperCase();
}

export async function getFundamentals(symbol: string): Promise<Fundamentals> {
  const qs = await yf.quoteSummary(symbol, {
    modules: [
      "price",
      "summaryDetail",
      "assetProfile",
      "financialData",
      "defaultKeyStatistics",
      "institutionOwnership",
    ],
  });

  const price = qs.price;
  const profile = qs.assetProfile;
  const fin = qs.financialData;
  const stats = qs.defaultKeyStatistics;

  // Yahoo's per-holder `pctHeld` is divided by a STALE share count, so it's
  // wildly inflated for recently-diluted stocks (can exceed 100% or the
  // aggregate). Recompute from the holder's share position over the CURRENT
  // shares outstanding for a consistent, sane figure.
  const sharesOut = stats?.sharesOutstanding ?? null;
  const topInstitutions = (qs.institutionOwnership?.ownershipList ?? [])
    .filter((o) => o.organization)
    .slice(0, 6)
    .map((o) => ({
      name: o.organization as string,
      pctHeld:
        sharesOut && sharesOut > 0 && o.position != null
          ? Math.min(o.position / sharesOut, 1)
          : o.pctHeld ?? null,
    }));

  const netIncome = stats?.netIncomeToCommon ?? null;
  const revenue = fin?.totalRevenue ?? null;
  // Yahoo returns a bogus 0 profit margin for some deeply-unprofitable names;
  // recompute from net income / revenue so we never show a false "0.0%".
  let profitMargins = fin?.profitMargins ?? null;
  if ((profitMargins == null || profitMargins === 0) && netIncome != null && revenue && revenue > 0) {
    profitMargins = netIncome / revenue;
  }
  let isProfitable: boolean | null = null;
  if (netIncome != null) isProfitable = netIncome > 0;
  else if (profitMargins != null) isProfitable = profitMargins > 0;

  return {
    symbol: price?.symbol ?? symbol,
    name: price?.longName ?? price?.shortName ?? null,
    currency: price?.currency ?? null,
    exchange: price?.exchangeName ?? null,
    country: profile?.country ?? null,
    sector: profile?.sector ?? null,
    industry: profile?.industry ?? null,
    marketCap: price?.marketCap ?? null,
    price: price?.regularMarketPrice ?? null,
    dayChange: price?.regularMarketChangePercent ?? null,
    totalRevenue: fin?.totalRevenue ?? null,
    revenueGrowth: fin?.revenueGrowth ?? null,
    profitMargins,
    netIncomeToCommon: netIncome,
    freeCashflow: fin?.freeCashflow ?? null,
    operatingCashflow: fin?.operatingCashflow ?? null,
    totalCash: fin?.totalCash ?? null,
    totalDebt: fin?.totalDebt ?? null,
    sharesOutstanding: stats?.sharesOutstanding ?? null,
    institutionsPercentHeld: stats?.heldPercentInstitutions ?? null,
    insidersPercentHeld: stats?.heldPercentInsiders ?? null,
    topInstitutions,
    isProfitable,
  };
}

/** Daily OHLCV bars for the trailing `days` calendar days. */
export async function getPriceHistory(symbol: string, days = 400): Promise<PriceBar[]> {
  const period1 = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const chart = await yf.chart(symbol, { period1, interval: "1d" });
  const quotes = chart.quotes ?? [];
  return quotes
    .filter((q) => q.close != null && q.date != null)
    .map((q) => ({
      date: new Date(q.date as Date).toISOString(),
      open: q.open ?? q.close!,
      high: q.high ?? q.close!,
      low: q.low ?? q.close!,
      close: q.close!,
      adjclose: q.adjclose ?? q.close!,
      volume: q.volume ?? 0,
    }));
}

/** Recent news headlines for a symbol from Yahoo's search endpoint. */
export async function getYahooNews(symbol: string, count = 8) {
  const result = await yf.search(symbol, { newsCount: count, quotesCount: 0 });
  return result.news ?? [];
}
