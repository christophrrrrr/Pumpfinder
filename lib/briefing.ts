import { computeVolatility } from "@/lib/analysis/volatility";
import { getFundamentals, getPriceHistory, normalizeSymbol } from "@/lib/data/yahoo";
import { getNews } from "@/lib/data/news";
import { generateAiSummary } from "@/lib/ai/gemini";
import { features } from "@/lib/env";
import type { AiSummary, StockBriefing } from "@/lib/types";

export interface BriefingOptions {
  /** Include the AI news summary (requires GEMINI_API_KEY). */
  useAi?: boolean;
  /** Include the AI Verdict scores/label (only when useAi is true). */
  verdict?: boolean;
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Orchestrate all data sources for one ticker into a single briefing.
 * Each section fails softly: a failure is recorded in `errors` and that section
 * is null/empty rather than failing the whole card.
 */
export async function buildBriefing(
  symbolRaw: string,
  opts: BriefingOptions = {},
): Promise<StockBriefing> {
  const symbol = normalizeSymbol(symbolRaw);
  const errors: string[] = [];

  // Fundamentals and price history are independent — fetch together.
  const fundamentalsP = getFundamentals(symbol).catch((e) => {
    errors.push(`Financials unavailable: ${errMessage(e)}`);
    return null;
  });
  const volatilityP = getPriceHistory(symbol)
    .then(computeVolatility)
    .catch((e) => {
      errors.push(`Price history unavailable: ${errMessage(e)}`);
      return null;
    });

  // News query benefits from the company name, so it waits on fundamentals
  // (volatility keeps fetching in parallel meanwhile).
  const fundamentals = await fundamentalsP;
  const news = await getNews(symbol, fundamentals?.name ?? null).catch((e) => {
    errors.push(`News unavailable: ${errMessage(e)}`);
    return [];
  });
  const volatility = await volatilityP;

  // AI summary/verdict — only when requested AND a key is configured.
  let ai: AiSummary | null = null;
  if (opts.useAi && features.ai()) {
    try {
      ai = await generateAiSummary(
        { symbol, fundamentals, volatility, news },
        opts.verdict ?? false,
      );
    } catch (e) {
      errors.push(`AI summary unavailable: ${errMessage(e)}`);
    }
  }

  return {
    symbol,
    fundamentals,
    volatility,
    news,
    ai,
    errors,
    generatedAt: new Date().toISOString(),
    fromCache: false,
  };
}
