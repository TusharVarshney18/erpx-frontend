export type LedgerGroup = {
  id: string;
  name: string;
  groupNature: string;
  normalBalance: string;
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
  bankAccountNo?: string | null;
  bankIfsc?: string | null;
  isActive: boolean;
  isSystem?: boolean;
};

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function groupKind(group?: LedgerGroup | null): "PARTY" | "BANK" | "OTHER" {
  if (!group) return "OTHER";
  const name = group.name.toLowerCase();
  if (name.includes("debtor") || name.includes("creditor") || name.includes("sundry")) {
    return "PARTY";
  }
  if (name.includes("bank")) return "BANK";
  return "OTHER";
}
