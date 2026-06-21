import Link from "next/link";
import { notFound } from "next/navigation";
import { getLookupById } from "@/lib/db";
import StockCard from "@/components/StockCard";

export const dynamic = "force-dynamic";

export default async function LookupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getLookupById(id);
  if (!record) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link href="/history" className="text-sm text-zinc-500 hover:underline">
        ← Back to history
      </Link>
      <div className="mt-4">
        <StockCard briefing={record.briefing} />
      </div>
    </div>
  );
}
