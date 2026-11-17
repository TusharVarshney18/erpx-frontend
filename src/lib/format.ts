/**
 * Shared currency formatter.
 *
 * All rupee amounts should be rendered through this helper so grouping
 * (en-IN: ₹1,00,000), symbol placement and decimal behaviour stay consistent.
 * Values are formatted for display only — never mutate stored data or API
 * payloads.
 */
export interface FormatINROptions {
  /** Number of decimal places to show. Defaults to 0 (whole rupees). */
  decimals?: number;
}

export function formatINR(
  value: string | number | null | undefined,
  { decimals = 0 }: FormatINROptions = {},
): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Compact Indian notation for dashboards: ₹950, ₹12.4K, ₹3.2 L, ₹1.25 Cr.
 * Use for headline figures only; tables should keep full `formatINR` values.
 */
export function formatINRCompact(value: string | number | null | undefined): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "₹0";
  const sign = num < 0 ? "-" : "";
  const abs = Math.abs(num);
  const trim = (n: number, d: number) => n.toFixed(d).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");
  if (abs >= 1e7) return `${sign}₹${trim(abs / 1e7, 2)} Cr`;
  if (abs >= 1e5) return `${sign}₹${trim(abs / 1e5, 2)} L`;
  if (abs >= 1e3) return `${sign}₹${trim(abs / 1e3, 1)}K`;
  return `${sign}₹${Math.round(abs)}`;
}
