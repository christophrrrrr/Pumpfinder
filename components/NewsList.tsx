import type { NewsItem } from "@/lib/types";
import { timeAgo } from "@/lib/format";

export default function NewsList({ items }: { items: NewsItem[] }) {
  if (items.length === 0) {
    return (
      <section>
        <h3 className="mb-2 text-sm font-semibold text-zinc-700">News & Catalysts</h3>
        <p className="text-sm text-zinc-400">No recent news or filings found.</p>
      </section>
    );
  }

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-zinc-700">News & Catalysts</h3>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={`${item.url}-${i}`} className="text-sm leading-snug">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-900 underline-offset-2 hover:underline"
            >
              {item.title}
            </a>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
              {item.kind === "filing" && item.filingType && (
                <span className="rounded bg-indigo-100 px-1.5 py-0.5 font-medium text-indigo-700">
                  {item.filingType}
                </span>
              )}
              <span>{item.source}</span>
              {item.publishedAt && (
                <>
                  <span aria-hidden>·</span>
                  <span>{timeAgo(item.publishedAt)}</span>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
