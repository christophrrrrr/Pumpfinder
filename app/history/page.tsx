import Link from "next/link";
import { getRecentLookups } from "@/lib/db";
import { features } from "@/lib/env";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const lookups = await getRecentLookups(60);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">History</h1>
      <p className="mt-1 text-sm text-zinc-500">Briefings you&apos;ve generated recently.</p>

      {!features.db() && (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          History is kept in memory and resets when the app restarts. Add a
          <code className="mx-1 rounded bg-amber-100 px-1">DATABASE_URL</code>
          (free Neon/Supabase Postgres) to keep it permanently.
        </div>
      )}

      {lookups.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-400">
          No lookups yet. Generate a briefing from the{" "}
          <Link href="/dashboard" className="underline">
            dashboard
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {lookups.map((r) => {
            const verdict = r.briefing.ai?.verdict;
            return (
              <li key={r.id}>
                <Link
                  href={`/history/${r.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-50"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-zinc-900">{r.symbol}</span>
                    {r.briefing.fundamentals?.name && (
                      <span className="ml-2 truncate text-sm text-zinc-500">
                        {r.briefing.fundamentals.name}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {verdict && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                        {verdict.overallLabel}
                      </span>
                    )}
                    <span className="text-xs text-zinc-400">{timeAgo(r.createdAt)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
