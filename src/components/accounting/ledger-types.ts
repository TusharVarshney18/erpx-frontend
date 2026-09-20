export type LedgerGroup = {
  id: string;
  name: string;
  groupNature: string;
  normalBalance: string;
  behavesAs?: string | null;
  parentGroupId?: string | null;
};

export type Ledger = {
  id: string;
  organizationId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  accountGroupId: string | null;
  accountGroup?: { id: string; name: string; groupNature?: string } | null;
  ledgerType: string;
  normalBalance: string;
  openingBalance: number | string;
  openingBalanceType: string;
  currency: string;
  gstin?: string | null;
  pan?: string | null;
  state?: string | null;
  address?: string | null;
  creditDays?: number | null;
  creditLimit?: number | string | null;
  registrationType?: string | null;
  taxType?: string | null;
  taxRate?: number | string | null;
  bankAccountNo?: string | null;
  bankIfsc?: string | null;
  isActive: boolean;
  isSystem?: boolean;
};

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export type GroupKind = "PARTY" | "BANK" | "DUTY" | "OTHER";

export function groupKind(group?: LedgerGroup | null): GroupKind {
  if (!group) return "OTHER";
  const behaves = (group.behavesAs ?? "").toUpperCase();
  if (behaves === "DEBTOR" || behaves === "CREDITOR") return "PARTY";
  if (behaves === "BANK" || behaves === "CASH") return "BANK";
  if (behaves === "DUTY_TAX") return "DUTY";
  // Fallback to name matching for groups created before behavesAs existed.
  const name = group.name.toLowerCase();
  if (name.includes("debtor") || name.includes("creditor") || name.includes("sundry")) {
    return "PARTY";
  }
  if (name.includes("bank") || name.includes("cash")) return "BANK";
  if (name.includes("duties") || name.includes("tax")) return "DUTY";
  return "OTHER";
}
