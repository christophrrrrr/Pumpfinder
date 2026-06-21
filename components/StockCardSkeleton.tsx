export default function StockCardSkeleton({ symbol }: { symbol: string }) {
  return (
    <article className="flex animate-pulse flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-6 w-20 rounded bg-zinc-200" />
        <div className="h-5 w-16 rounded bg-zinc-100" />
      </div>
      <div className="h-3 w-40 rounded bg-zinc-100" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 rounded bg-zinc-100" />
        ))}
      </div>
      <div className="h-3 w-full rounded bg-zinc-100" />
      <div className="h-3 w-5/6 rounded bg-zinc-100" />
      <p className="text-xs text-zinc-400">Researching {symbol}…</p>
    </article>
  );
}
