import Parser from "rss-parser";
import { getEdgarFilings } from "@/lib/data/edgar";
import { getYahooNews } from "@/lib/data/yahoo";
import type { NewsItem } from "@/lib/types";

const MAX_ITEMS = 12;
const MAX_NEWS = 9; // reserve the remaining slots for SEC filings (catalysts)
const rss = new Parser({ timeout: 8000 });

/** Trim common corporate suffixes for a tighter news query. */
function cleanName(name: string): string {
  return name
    .replace(/,?\s+(Inc\.?|Corp\.?|Corporation|Ltd\.?|Limited|PLC|S\.A\.|Company|Co\.?|Holdings?|Group|Therapeutics|Pharmaceuticals)\.?$/i, "")
    .trim();
}

function googleNewsUrl(query: string): string {
  const q = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
}

/** Google News titles look like "Headline - Publisher". Split them apart. */
function splitTitlePublisher(raw: string): { title: string; publisher: string | null } {
  const idx = raw.lastIndexOf(" - ");
  if (idx > 0 && idx > raw.length - 60) {
    return { title: raw.slice(0, idx).trim(), publisher: raw.slice(idx + 3).trim() };
  }
  return { title: raw.trim(), publisher: null };
}

async function getGoogleNews(symbol: string, name: string | null): Promise<NewsItem[]> {
  const cleaned = name ? cleanName(name) : "";
  const query = cleaned ? `"${cleaned}" stock` : `${symbol} stock`;
  const feed = await rss.parseURL(googleNewsUrl(query));
  return (feed.items ?? []).slice(0, MAX_ITEMS).map((item) => {
    const { title, publisher } = splitTitlePublisher(item.title ?? "");
    return {
      title,
      source: publisher ?? "Google News",
      url: item.link ?? "",
      publishedAt: item.isoDate ?? (item.pubDate ? new Date(item.pubDate).toISOString() : null),
      snippet: item.contentSnippet ?? null,
      kind: "news" as const,
      filingType: null,
    };
  });
}

function mapYahoo(news: Awaited<ReturnType<typeof getYahooNews>>): NewsItem[] {
  return news.map((n) => ({
    title: n.title,
    source: n.publisher ?? "Yahoo Finance",
    url: n.link,
    publishedAt: n.providerPublishTime ? new Date(n.providerPublishTime).toISOString() : null,
    snippet: null,
    kind: "news" as const,
    filingType: null,
  }));
}

function dedupeKey(item: NewsItem): string {
  if (item.url) return item.url.split("?")[0].toLowerCase();
  return item.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Aggregate news + filings from all free sources, dedupe, and sort newest-first.
 * Individual source failures are swallowed so one bad feed doesn't blank the section.
 */
export async function getNews(symbol: string, name: string | null): Promise<NewsItem[]> {
  const settled = await Promise.allSettled([
    getYahooNews(symbol).then(mapYahoo),
    getGoogleNews(symbol, name),
    getEdgarFilings(symbol),
  ]);

  const all: NewsItem[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") all.push(...r.value);
  }

  const seen = new Set<string>();
  const deduped = all.filter((item) => {
    if (!item.url && !item.title) return false;
    const key = dedupeKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const byDateDesc = (a: NewsItem, b: NewsItem) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return tb - ta;
  };

  // Keep filings (catalysts) from being crowded out by higher-volume news feeds.
  const news = deduped.filter((i) => i.kind === "news").sort(byDateDesc).slice(0, MAX_NEWS);
  const filings = deduped
    .filter((i) => i.kind === "filing")
    .sort(byDateDesc)
    .slice(0, MAX_ITEMS - news.length);

  return [...news, ...filings].sort(byDateDesc);
}
