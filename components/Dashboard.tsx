"use client";

import { useEffect, useState } from "react";
import type { StockBriefing } from "@/lib/types";
import StockCard from "@/components/StockCard";
import StockCardSkeleton from "@/components/StockCardSkeleton";

type Result =
  | { symbol: string; status: "loading" }
  | { symbol: string; status: "done"; briefing: StockBriefing }
  | { symbol: string; status: "error"; error: string };

const MAX_TICKERS = 15;
const CONCURRENCY = 3;

function parseSymbols(input: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input.split(/[\s,]+/)) {
    const s = raw.trim().toUpperCase();
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out.slice(0, MAX_TICKERS);
}

async function runPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let i = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) await worker(items[i++]);
  });
  await Promise.all(runners);
}

export default function Dashboard({ aiEnabled }: { aiEnabled: boolean }) {
  const [input, setInput] = useState("");
  const [verdict, setVerdict] = useState(true);
  const [results, setResults] = useState<Result[]>([]);
  const [running, setRunning] = useState(false);

  // Remember the trader's input + verdict preference between visits.
  useEffect(() => {
    // One-time hydration of persisted preferences from the browser store.
    const savedInput = localStorage.getItem("jp_input");
    const savedVerdict = localStorage.getItem("jp_verdict");
    /* eslint-disable react-hooks/set-state-in-effect */
    if (savedInput) setInput(savedInput);
    if (savedVerdict != null) setVerdict(savedVerdict === "1");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  useEffect(() => {
    localStorage.setItem("jp_verdict", verdict ? "1" : "0");
  }, [verdict]);

  async function fetchOne(symbol: string) {
    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: symbol, useAi: true, verdict }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      const briefing = (await res.json()) as StockBriefing;
      setResults((prev) =>
        prev.map((r) => (r.symbol === symbol ? { symbol, status: "done", briefing } : r)),
      );
    } catch (e) {
      const error = e instanceof Error ? e.message : "Failed to load";
      setResults((prev) =>
        prev.map((r) => (r.symbol === symbol ? { symbol, status: "error", error } : r)),
      );
    }
  }

  async function generate(e?: React.FormEvent) {
    e?.preventDefault();
    const symbols = parseSymbols(input);
    if (symbols.length === 0) return;
    localStorage.setItem("jp_input", input);
    setRunning(true);
    setResults(symbols.map((symbol) => ({ symbol, status: "loading" })));
    await runPool(symbols, CONCURRENCY, fetchOne);
    setRunning(false);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Morning Briefings
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Paste the tickers from your group (comma or space separated). Up to {MAX_TICKERS}.
      </p>

      <form onSubmit={generate} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. AAPL, PLUG, BBAI"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
        />
        <label className="flex select-none items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={verdict}
            onChange={(e) => setVerdict(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300"
          />
          AI Verdict
        </label>
        <button
          type="submit"
          disabled={running || input.trim().length === 0}
          className="rounded-lg bg-zinc-900 px-5 py-2 font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? "Researching…" : "Generate"}
        </button>
      </form>

      {!aiEnabled && (
        <p className="mt-2 text-xs text-zinc-400">
          AI summaries are off — add a GEMINI_API_KEY to enable the catalyst summary and verdict.
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {results.map((r) => {
            if (r.status === "loading") return <StockCardSkeleton key={r.symbol} symbol={r.symbol} />;
            if (r.status === "error")
              return (
                <article
                  key={r.symbol}
                  className="rounded-2xl border border-red-200 bg-red-50 p-5"
                >
                  <h2 className="text-lg font-bold text-zinc-900">{r.symbol}</h2>
                  <p className="mt-1 text-sm text-red-600">Could not load: {r.error}</p>
                </article>
              );
            return <StockCard key={r.symbol} briefing={r.briefing} />;
          })}
        </div>
      )}
    </div>
  );
}
