import type { NewsBullet } from "@/lib/types";

/**
 * AI-generated digest of the news as bullet points, each linked to the source
 * it came from — so the reader understands the situation without clicking out.
 */
export default function NewsSummary({ bullets }: { bullets: NewsBullet[] }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-zinc-700">News & Catalysts</h3>
      <ul className="space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2 text-sm leading-snug text-zinc-700">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
            <span>
              {b.text}
              {b.sourceUrl && (
                <a
                  href={b.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 whitespace-nowrap text-xs font-medium text-indigo-600 hover:underline"
                >
                  ({b.sourceName ?? "source"} ↗)
                </a>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
