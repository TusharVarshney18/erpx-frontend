export function formatMoney(value: string | number | null | undefined, currency?: string | null): string {
  const num = Number(value ?? 0);
  const formatted = num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (currency && currency !== "INR") return `${formatted} ${currency}`;
  return `₹${formatted}`;
}

export function formatNumber(value: string | number | null | undefined): string {
  return Number(value ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function maskAccountNumber(accountNumber: string): string {
  const cleaned = accountNumber.replace(/\s/g, "");
  if (cleaned.length <= 4) return cleaned;
  return `•••• ${cleaned.slice(-4)}`;
}

export const accountTypeBadge: Record<string, string> = {
  SAVINGS: "bg-primary/15 text-primary",
  CURRENT: "bg-info/15 text-info",
  CASH: "bg-success/15 text-success",
  LOAN: "bg-warning/15 text-warning",
  OTHER: "bg-muted text-muted-foreground",
};

export const transactionTypeBadge: Record<string, string> = {
  CREDIT: "bg-success/15 text-success",
  DEBIT: "bg-destructive/15 text-destructive",
  TRANSFER: "bg-primary/15 text-primary",
};

export const transactionStatusBadge: Record<string, string> = {
  PENDING: "bg-warning/15 text-warning",
  CLEARED: "bg-success/15 text-success",
  FAILED: "bg-destructive/15 text-destructive",
  REVERSED: "bg-muted text-muted-foreground",
};

export const accountTypeLabel: Record<string, string> = {
  SAVINGS: "Savings",
  CURRENT: "Current",
  CASH: "Cash",
  LOAN: "Loan",
  OTHER: "Other",
};

export const transactionTypeLabel: Record<string, string> = {
  CREDIT: "Credit",
  DEBIT: "Debit",
  TRANSFER: "Transfer",
};

export const transactionStatusLabel: Record<string, string> = {
  PENDING: "Pending",
  CLEARED: "Cleared",
  FAILED: "Failed",
  REVERSED: "Reversed",
};
