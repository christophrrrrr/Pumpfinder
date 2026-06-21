import { buildBriefing, type BriefingOptions } from "@/lib/briefing";
import { saveLookup } from "@/lib/db";
import type { StockBriefing } from "@/lib/types";

/**
 * Short-lived per-ticker cache so refreshing or re-entering a symbol doesn't
 * re-hit Yahoo / Google / SEC / Gemini and trip free-tier rate limits.
 *
 * In-memory works within a warm process (dev, or a warm serverless instance).
 * Persistent history/cross-instance reuse is handled by the history DB layer.
 */
const TTL_MS = 30 * 60 * 1000; // 30 minutes
// On globalThis so the cache is shared across route entrypoints / survives HMR.
const globalForCache = globalThis as unknown as {
  __jpCache?: Map<string, { at: number; data: StockBriefing }>;
};
globalForCache.__jpCache ??= new Map();
const mem = globalForCache.__jpCache;

function cacheKey(symbol: string, opts: BriefingOptions): string {
  const day = new Date().toISOString().slice(0, 10);
  return `${symbol.toUpperCase()}|ai${opts.useAi ? 1 : 0}|v${opts.verdict ? 1 : 0}|${day}`;
}

export async function getBriefing(
  symbol: string,
  opts: BriefingOptions,
): Promise<StockBriefing> {
  const key = cacheKey(symbol, opts);
  const hit = mem.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return { ...hit.data, fromCache: true };
  }

  const data = await buildBriefing(symbol, opts);
  mem.set(key, { at: Date.now(), data });

  // Persist for the History page (no-op when no DATABASE_URL is configured).
  void saveLookup(data).catch(() => {});

  return data;
}
