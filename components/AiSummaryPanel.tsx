import type { AiSummary } from "@/lib/types";

export default function AiSummaryPanel({ ai }: { ai: AiSummary }) {
  if (!ai.whyMoved && !ai.meaningfulVsHype) return null;
  return (
    <section className="rounded-xl bg-indigo-50/60 p-3">
      <h3 className="mb-1.5 text-sm font-semibold text-indigo-900">AI Take</h3>
      <div className="space-y-1.5">
        {ai.whyMoved && (
          <p className="text-sm text-zinc-700">
            <span className="font-semibold text-zinc-900">Why it moved: </span>
            {ai.whyMoved}
          </p>
        )}
        {ai.meaningfulVsHype && (
          <p className="text-sm text-zinc-700">
            <span className="font-semibold text-zinc-900">Meaningful vs. hype: </span>
            {ai.meaningfulVsHype}
          </p>
        )}
      </div>
    </section>
  );
}
