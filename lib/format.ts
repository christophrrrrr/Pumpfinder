/** Display helpers. All accept nullish input and return a dash placeholder. */

const DASH = "—";

export function formatMoney(value: number | null | undefined, currency = "USD"): string {
  if (value == null || Number.isNaN(value)) return DASH;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Compact large numbers: 1.2B, 340M, 15.3K. */
export function formatCompact(value: number | null | undefined, currency?: string): string {
  if (value == null || Number.isNaN(value)) return DASH;
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  let out: string;
  if (abs >= 1e12) out = (abs / 1e12).toFixed(2) + "T";
  else if (abs >= 1e9) out = (abs / 1e9).toFixed(2) + "B";
  else if (abs >= 1e6) out = (abs / 1e6).toFixed(1) + "M";
  else if (abs >= 1e3) out = (abs / 1e3).toFixed(1) + "K";
  else out = abs.toFixed(0);
  const symbol = currency === "USD" ? "$" : currency ? currency + " " : "";
  return `${sign}${symbol}${out}`;
}

/** Fraction → percent string. 0.0512 -> "+5.1%". */
export function formatPct(
  fraction: number | null | undefined,
  opts: { digits?: number; sign?: boolean } = {},
): string {
  if (fraction == null || Number.isNaN(fraction)) return DASH;
  const { digits = 1, sign = false } = opts;
  const pct = fraction * 100;
  const prefix = sign && pct > 0 ? "+" : "";
  return `${prefix}${pct.toFixed(digits)}%`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return DASH;
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** "3 hours ago", "2 days ago". */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return DASH;
  const diffMs = Date.now() - then;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}
