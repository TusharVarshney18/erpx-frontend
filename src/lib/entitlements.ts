import { api } from "@/lib/api/client";

export const ENTITLEMENT_MODULES = [
  "accounting",
  "sales",
  "inventory",
  "crm",
  "hrms",
  "payroll",
  "banking",
  "reports",
  "ai",
  "mobile",
] as const;

export type EntitlementModule = (typeof ENTITLEMENT_MODULES)[number];

export type ModuleCatalogEntry = {
  label: string;
  benefits: string[];
};

export type EffectiveModule = {
  enabled: boolean;
  source: "plan" | "override";
  requiredPlan: string | null;
  requiredPlanName: string | null;
  reason?: string | null;
  expiresAt?: string | null;
  label: string;
};

export type Entitlements = {
  organizationId: string;
  company: { id: string; name: string } | null;
  plan: {
    slug: string;
    name: string;
    status: string | null;
    state:
      | "trialing"
      | "active"
      | "grace_period"
      | "past_due"
      | "canceled"
      | "expired"
      | "locked";
    isTrialing: boolean;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    gracePeriodEndsAt: string | null;
  };
  access: "full" | "read_only";
  modules: Record<EntitlementModule, EffectiveModule>;
  enabledModules: EntitlementModule[];
  limits: { maxUsers: number | null; maxCompanies: number | null };
  usage: { users: number; companies: number };
  catalog: Record<EntitlementModule, ModuleCatalogEntry>;
};

export async function fetchEntitlements(): Promise<Entitlements> {
  return api.get<Entitlements>("/me/entitlements");
}

/** Shared fallback shown before/without the API payload. */
export const MODULE_FALLBACK: Record<EntitlementModule, ModuleCatalogEntry> = {
  accounting: { label: "Accounting", benefits: ["Chart of accounts", "Vouchers & ledgers", "Financial statements"] },
  sales: { label: "Sales", benefits: ["Quotations & sales orders", "GST-ready invoices", "Customer payments"] },
  inventory: { label: "Inventory", benefits: ["Products & categories", "Warehouses & stock", "Low-stock alerts"] },
  crm: { label: "CRM", benefits: ["Leads & opportunities", "Activities & follow-ups", "Customer pipeline"] },
  hrms: { label: "HRMS", benefits: ["Employee records", "Attendance tracking", "Leave management"] },
  payroll: { label: "Payroll", benefits: ["Salary structures", "Payroll runs & payslips", "Statutory calculations"] },
  banking: { label: "Banking", benefits: ["Bank accounts & balances", "Transaction reconciliation", "Statement imports"] },
  reports: { label: "Reports", benefits: ["Financial statements", "Sales & inventory reports", "GST reports"] },
  ai: { label: "AI Copilot", benefits: ["Ask about live ERP data", "Generate summaries", "Predictive insights"] },
  mobile: { label: "Mobile app", benefits: ["Attendance on the go", "Approvals & alerts", "Mobile reports"] },
};

export function moduleLabel(module: EntitlementModule, entitlements?: Entitlements): string {
  return entitlements?.catalog?.[module]?.label ?? MODULE_FALLBACK[module].label;
}

export function moduleBenefits(module: EntitlementModule, entitlements?: Entitlements): string[] {
  return entitlements?.catalog?.[module]?.benefits ?? MODULE_FALLBACK[module].benefits;
}

export function planLabel(slug: string | null | undefined): string {
  if (!slug) return "Upgrade";
  return slug.replace(/-yearly$/, "").replace(/^\w/, (c) => c.toUpperCase());
}
