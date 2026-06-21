import { NextResponse } from "next/server";
import { getBriefing } from "@/lib/cache";

// Per-ticker briefing. The client fires these with limited concurrency so each
// card streams in independently and free-tier rate limits stay respected.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    ticker?: unknown;
    useAi?: unknown;
    verdict?: unknown;
  };

  const ticker = typeof body.ticker === "string" ? body.ticker.trim() : "";
  if (!ticker) {
    return NextResponse.json({ error: "ticker is required" }, { status: 400 });
  }

  const useAi = body.useAi !== false; // default on (server skips if no key)
  const verdict = body.verdict === true;

  try {
    const briefing = await getBriefing(ticker, { useAi, verdict });
    return NextResponse.json(briefing);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
