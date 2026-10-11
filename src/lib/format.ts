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
