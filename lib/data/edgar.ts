import { env } from "@/lib/env";
import type { NewsItem } from "@/lib/types";

/**
 * SEC EDGAR (free, official) — surfaces recent material filings (8-K), earnings
 * (10-Q/10-K), foreign reports (6-K/20-F), and offerings (S-1/424B) as catalysts.
 */

const TICKER_MAP_URL = "https://www.sec.gov/files/company_tickers.json";
const SUBMISSIONS_URL = (cik10: string) =>
  `https://data.sec.gov/submissions/CIK${cik10}.json`;

// Forms worth surfacing as potential catalysts.
const RELEVANT_FORMS = new Set([
  "8-K",
  "8-K/A",
  "6-K",
  "10-Q",
  "10-K",
  "20-F",
  "40-F",
  "S-1",
  "S-3",
  "424B5",
  "424B4",
  "424B3",
  "425",
]);

const MAX_FILINGS = 6;
const MAX_AGE_DAYS = 150;

function headers() {
  return { "User-Agent": env.secUserAgent, Accept: "application/json" };
}

// Cache the (large) ticker→CIK map in memory for the process lifetime.
let tickerMap: Map<string, string> | null = null;
let tickerMapAt = 0;
const TICKER_MAP_TTL = 1000 * 60 * 60 * 24; // 1 day

async function getTickerMap(): Promise<Map<string, string>> {
  if (tickerMap && Date.now() - tickerMapAt < TICKER_MAP_TTL) return tickerMap;
  const res = await fetch(TICKER_MAP_URL, { headers: headers() });
  if (!res.ok) throw new Error(`EDGAR ticker map HTTP ${res.status}`);
  const data = (await res.json()) as Record<
    string,
    { cik_str: number; ticker: string; title: string }
  >;
  const map = new Map<string, string>();
  for (const row of Object.values(data)) {
    map.set(row.ticker.toUpperCase(), String(row.cik_str).padStart(10, "0"));
  }
  tickerMap = map;
  tickerMapAt = Date.now();
  return map;
}

interface RecentFilings {
  accessionNumber: string[];
  filingDate: string[];
  form: string[];
  primaryDocument: string[];
  primaryDocDescription: string[];
}

export async function getEdgarFilings(symbol: string): Promise<NewsItem[]> {
  const map = await getTickerMap();
  const cik10 = map.get(symbol.toUpperCase());
  if (!cik10) return []; // foreign / OTC tickers often aren't in EDGAR

  const res = await fetch(SUBMISSIONS_URL(cik10), { headers: headers() });
  if (!res.ok) throw new Error(`EDGAR submissions HTTP ${res.status}`);
  const data = (await res.json()) as { filings?: { recent?: RecentFilings } };
  const recent = data.filings?.recent;
  if (!recent) return [];

  const cikInt = String(Number(cik10));
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const items: NewsItem[] = [];

  for (let i = 0; i < recent.form.length && items.length < MAX_FILINGS; i++) {
    const form = recent.form[i];
    if (!RELEVANT_FORMS.has(form)) continue;

    const filingDate = recent.filingDate[i];
    const ts = new Date(filingDate).getTime();
    if (!Number.isNaN(ts) && ts < cutoff) continue;

    const accn = recent.accessionNumber[i];
    const accnNoDash = accn.replace(/-/g, "");
    const doc = recent.primaryDocument[i];
    const url = doc
      ? `https://www.sec.gov/Archives/edgar/data/${cikInt}/${accnNoDash}/${doc}`
      : `https://www.sec.gov/Archives/edgar/data/${cikInt}/${accnNoDash}/`;
    const desc = recent.primaryDocDescription?.[i] || "";

    items.push({
      title: desc ? `${form} — ${desc}` : `SEC Filing: ${form}`,
      source: "SEC EDGAR",
      url,
      publishedAt: ts ? new Date(ts).toISOString() : null,
      snippet: null,
      kind: "filing",
      filingType: form,
    });
  }

  return items;
}
