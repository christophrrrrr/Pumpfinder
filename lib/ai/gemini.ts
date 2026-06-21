import { GoogleGenAI, Type } from "@google/genai";
import { env } from "@/lib/env";
import { formatCompact, formatPct } from "@/lib/format";
import { financialHealthScore, volatilityScore } from "@/lib/analysis/scores";
import type {
  AiSummary,
  Fundamentals,
  NewsBullet,
  NewsItem,
  Verdict,
  VerdictLabel,
  VolatilityStats,
} from "@/lib/types";

const VERDICT_LABELS: VerdictLabel[] = ["Strong Candidate", "Likely Hype", "Neutral"];
const MAX_NEWS_FOR_AI = 12;

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!env.geminiApiKey) throw new Error("GEMINI_API_KEY is not set");
  if (!client) client = new GoogleGenAI({ apiKey: env.geminiApiKey });
  return client;
}

export interface AiInput {
  symbol: string;
  fundamentals: Fundamentals | null;
  volatility: VolatilityStats | null;
  news: NewsItem[];
}

/** Compact, model-readable fact sheet built from the data we already fetched. */
function buildFactSheet(input: AiInput): string {
  const { symbol, fundamentals: f, volatility: v, news } = input;
  const lines: string[] = [`TICKER: ${symbol}`];

  if (f) {
    lines.push(
      `Company: ${f.name ?? "?"} | Country: ${f.country ?? "?"} | Sector: ${f.sector ?? "?"}`,
      `Price: ${f.price ?? "?"} ${f.currency ?? ""} | Today: ${formatPct(f.dayChange, { sign: true })}`,
      `Market cap: ${formatCompact(f.marketCap)} | Revenue: ${formatCompact(f.totalRevenue)} | Rev growth: ${formatPct(f.revenueGrowth, { sign: true })}`,
      `Profitable: ${f.isProfitable == null ? "?" : f.isProfitable ? "yes" : "no"} | Profit margin: ${formatPct(f.profitMargins, { sign: true })}`,
      `Free cash flow: ${formatCompact(f.freeCashflow)} | Cash: ${formatCompact(f.totalCash)} | Debt: ${formatCompact(f.totalDebt)}`,
      `Institutional ownership: ${formatPct(f.institutionsPercentHeld)} | Insider ownership: ${formatPct(f.insidersPercentHeld)}`,
    );
  } else {
    lines.push("Financials: unavailable.");
  }

  if (v) {
    lines.push(
      `Annualized volatility: ${formatPct(v.annualizedVol)} | Typical daily move: ${formatPct(v.typicalDailyMove)}`,
      `Biggest up day: ${formatPct(v.maxGain, { sign: true })} | Biggest down day: ${formatPct(v.maxDrop, { sign: true })}`,
      `Latest volume vs avg: ${v.volumeSpikeRatio != null ? v.volumeSpikeRatio.toFixed(1) + "x" : "?"}${v.isVolumeSpike ? " (SPIKE)" : ""}`,
    );
    if (v.bigMoves.length > 0) {
      lines.push(
        "Recent large single-day moves: " +
          v.bigMoves
            .map((m) => `${m.date.slice(0, 10)} ${formatPct(m.changePct, { sign: true })}`)
            .join(", "),
      );
    }
  } else {
    lines.push("Volatility history: unavailable.");
  }

  lines.push("", "RECENT NEWS & SEC FILINGS (newest first, numbered for citation):");
  const items = news.slice(0, MAX_NEWS_FOR_AI);
  if (items.length === 0) {
    lines.push("(none found)");
  } else {
    items.forEach((n, i) => {
      const tag = n.kind === "filing" ? `[SEC ${n.filingType ?? "filing"}]` : `[${n.source}]`;
      const when = n.publishedAt ? n.publishedAt.slice(0, 10) : "?";
      const snip = n.snippet ? ` — ${n.snippet.slice(0, 160)}` : "";
      lines.push(`[${i + 1}] ${when} ${tag} ${n.title}${snip}`);
    });
  }

  return lines.join("\n");
}

function buildPrompt(
  input: AiInput,
  includeVerdict: boolean,
  scores: { vol: number | null; fin: number | null },
): string {
  const volTxt =
    scores.vol != null
      ? `${scores.vol} (PRECOMPUTED from price action — you MUST use exactly this value)`
      : "estimate an integer 0-10 yourself";
  const finTxt =
    scores.fin != null
      ? `${scores.fin} (PRECOMPUTED from the financials — you MUST use exactly this value)`
      : "estimate an integer 0-10 yourself";
  return [
    "You are a sharp, skeptical analyst helping a short-term trader quickly decide whether a volatile small-cap stock is worth trading TODAY.",
    "Base everything ONLY on the facts below. Be concise and concrete. Do not give financial advice or tell the user to buy/sell.",
    "",
    "Write:",
    "- summaryBullets: 3-7 short, concrete bullet points that together tell the reader everything important going on with this stock right now (catalysts, news, filings) — so they understand the situation WITHOUT clicking through. Each bullet is one specific fact (no vague filler). For each bullet, set sourceIndex to the [number] of the single news/filing item it is based on. Use ONLY the numbered items below; never invent facts or sources.",
    "- whyMoved: 1-2 sentences on the most likely reason the stock is moving, citing the specific catalyst.",
    "- meaningfulVsHype: 1-2 sentences judging whether the catalyst looks substantive (real revenue/contracts/approvals) or like temporary hype/promotion. Flag dilution risk if there are recent offerings (S-1/424B) or shelf registrations.",
    includeVerdict
      ? `- catalystStrength: integer 0-10 — how strong and FRESH the news catalyst is (a real new contract/approval/earnings = high; nothing new or just hype = low).\n- volatilityPotential: ${volTxt}.\n- financialHealth: ${finTxt}.\n- overallLabel: one of 'Strong Candidate', 'Likely Hype', 'Neutral'. rationale: one short sentence. Base the label and rationale on the catalyst together with the volatility and financial-health scores above.`
      : "",
    "",
    "FACTS:",
    buildFactSheet(input),
  ]
    .filter(Boolean)
    .join("\n");
}

function clampScore(n: unknown): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(10, Math.round(x)));
}

function normalizeLabel(s: unknown): VerdictLabel {
  return VERDICT_LABELS.includes(s as VerdictLabel) ? (s as VerdictLabel) : "Neutral";
}

/** Gemini ApiError messages are large JSON blobs; extract the human-readable bit. */
function conciseApiError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    // not JSON
  }
  return raw.slice(0, 160);
}

export async function generateAiSummary(
  input: AiInput,
  includeVerdict: boolean,
): Promise<AiSummary> {
  const ai = getClient();

  const properties: Record<string, unknown> = {
    summaryBullets: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          sourceIndex: { type: Type.INTEGER },
        },
        required: ["text", "sourceIndex"],
      },
    },
    whyMoved: { type: Type.STRING },
    meaningfulVsHype: { type: Type.STRING },
  };
  const required = ["summaryBullets", "whyMoved", "meaningfulVsHype"];
  if (includeVerdict) {
    properties.catalystStrength = { type: Type.INTEGER };
    properties.financialHealth = { type: Type.INTEGER };
    properties.volatilityPotential = { type: Type.INTEGER };
    properties.overallLabel = { type: Type.STRING, enum: VERDICT_LABELS };
    properties.rationale = { type: Type.STRING };
    required.push(
      "catalystStrength",
      "financialHealth",
      "volatilityPotential",
      "overallLabel",
      "rationale",
    );
  }

  // Deterministic scores — computed in code, not guessed by the model.
  const volScore = volatilityScore(input.volatility);
  const finScore = financialHealthScore(input.fundamentals);

  let response;
  try {
    response = await ai.models.generateContent({
      model: env.geminiModel,
      contents: buildPrompt(input, includeVerdict, { vol: volScore, fin: finScore }),
      config: {
        responseMimeType: "application/json",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        responseSchema: { type: Type.OBJECT, properties, required } as any,
        temperature: 0.4,
      },
    });
  } catch (e) {
    throw new Error(conciseApiError(e));
  }

  const text = response.text;
  if (!text) throw new Error("Empty AI response");

  const parsed = JSON.parse(text) as Record<string, unknown>;

  // Resolve each bullet's sourceIndex back to the actual news item it cited.
  const newsForAi = input.news.slice(0, MAX_NEWS_FOR_AI);
  const rawBullets = Array.isArray(parsed.summaryBullets) ? parsed.summaryBullets : [];
  const bullets: NewsBullet[] = rawBullets
    .map((b): NewsBullet => {
      const obj = (b ?? {}) as { text?: unknown; sourceIndex?: unknown };
      const idx = Number(obj.sourceIndex);
      const item =
        Number.isInteger(idx) && idx >= 1 && idx <= newsForAi.length
          ? newsForAi[idx - 1]
          : null;
      return {
        text: String(obj.text ?? "").trim(),
        sourceUrl: item?.url ?? null,
        sourceName: item?.source ?? null,
      };
    })
    .filter((b) => b.text.length > 0);

  let verdict: Verdict | null = null;
  if (includeVerdict) {
    verdict = {
      catalystStrength: clampScore(parsed.catalystStrength),
      // Authoritative deterministic scores; fall back to the model only if uncomputable.
      financialHealth: finScore ?? clampScore(parsed.financialHealth),
      volatilityPotential: volScore ?? clampScore(parsed.volatilityPotential),
      overallLabel: normalizeLabel(parsed.overallLabel),
      rationale: String(parsed.rationale ?? ""),
    };
  }

  return {
    bullets,
    whyMoved: String(parsed.whyMoved ?? ""),
    meaningfulVsHype: String(parsed.meaningfulVsHype ?? ""),
    verdict,
  };
}
