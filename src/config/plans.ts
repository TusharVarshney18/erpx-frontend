/**
 * Single source of truth for the public pricing page.
 *
 * The backend seeds subscription plans in USD cents (`billing-portal.service.ts`)
 * and exposes them only to authenticated clients, so the marketing site keeps a
 * local, typed catalogue. Slugs intentionally match the backend plan slugs
 * (`free`, `starter`, `starter-yearly`, `pro`, `pro-yearly`, `enterprise`) so a
 * `?plan=` hand-off can be mapped to the real subscription later.
 *
 * INR amounts below are marketing placeholders — replace them with the final
 * commercial pricing before launch.
 */

export type PlanId = "free" | "starter" | "pro" | "enterprise";

export type PricingPlan = {
  id: PlanId;
  /** Backend slug used when a monthly plan is selected. */
  backendSlug: string;
  name: string;
  tagline: string;
  /** Monthly price in INR, or null for custom pricing. */
  monthlyInr: number | null;
  /** Effective per-month price in INR when billed yearly, or null. */
  yearlyInr: number | null;
  /** Headline bullet points shown on the card. */
  highlights: string[];
  cta: string;
  popular?: boolean;
};

export const YEARLY_SAVING_PERCENT = 17;

export const GST_NOTE = "All prices are in INR and exclude 18% GST.";

export const PLANS: PricingPlan[] = [
  {
    id: "free",
    backendSlug: "free",
    name: "Free",
    tagline: "For trying ERPX on a real workspace.",
    monthlyInr: 0,
    yearlyInr: 0,
    highlights: [
      "Up to 3 users",
      "Accounting, sales, inventory, CRM & HRMS",
      "GST-ready invoices and reports",
      "Audit trail on every entry",
    ],
    cta: "Start free",
  },
  {
    id: "starter",
    backendSlug: "starter",
    name: "Starter",
    tagline: "For small teams replacing spreadsheets.",
    monthlyInr: 2499,
    yearlyInr: 2082,
    highlights: [
      "Up to 15 users",
      "Everything in Free",
      "Banking & reconciliation",
      "Integrations, automation & API keys",
      "Advanced reports",
    ],
    cta: "Start with Starter",
  },
  {
    id: "pro",
    backendSlug: "pro",
    name: "Pro",
    tagline: "For growing businesses that need AI and scale.",
    monthlyInr: 7999,
    yearlyInr: 6666,
    highlights: [
      "Up to 50 users",
      "Everything in Starter",
      "AI Copilot — 1,000 questions / month",
      "Priority email support",
      "Advanced role-based access",
    ],
    cta: "Start with Pro",
    popular: true,
  },
  {
    id: "enterprise",
    backendSlug: "enterprise",
    name: "Enterprise",
    tagline: "For multi-company groups and larger teams.",
    monthlyInr: null,
    yearlyInr: null,
    highlights: [
      "Unlimited users",
      "Everything in Pro",
      "Unlimited AI Copilot usage",
      "Dedicated onboarding",
      "Priority support",
    ],
    cta: "Talk to sales",
  },
];

export function planForSelection(selection: string | undefined): PricingPlan | undefined {
  if (!selection) return undefined;
  const base = selection.replace(/-yearly$/, "");
  return PLANS.find((plan) => plan.id === base || plan.backendSlug === selection);
}

/** Value sent to `/auth?plan=...` for self-serve plans. */
export function planSelectionValue(plan: PricingPlan, yearly: boolean): string {
  if (plan.id === "free") return "free";
  return yearly ? `${plan.id}-yearly` : plan.backendSlug;
}

export function formatInr(amount: number | null): string {
  if (amount === null) return "Custom";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

type ComparisonValue = boolean | string;

export type ComparisonRow = {
  label: string;
  hint?: string;
  values: Record<PlanId, ComparisonValue>;
};

export type ComparisonGroup = {
  title: string;
  rows: ComparisonRow[];
};

export const COMPARISON_GROUPS: ComparisonGroup[] = [
  {
    title: "Platform",
    rows: [
      {
        label: "Team members",
        values: { free: "Up to 3", starter: "Up to 15", pro: "Up to 50", enterprise: "Unlimited" },
      },
      {
        label: "Companies / organizations",
        values: { free: "1", starter: "1", pro: "1", enterprise: "Multi-company" },
      },
      {
        label: "Core modules",
        hint: "Accounting, sales, inventory, CRM and HRMS",
        values: { free: true, starter: true, pro: true, enterprise: true },
      },
      {
        label: "Audit trail on every entry",
        values: { free: true, starter: true, pro: true, enterprise: true },
      },
    ],
  },
  {
    title: "Finance & operations",
    rows: [
      {
        label: "GST-ready invoicing",
        values: { free: true, starter: true, pro: true, enterprise: true },
      },
      {
        label: "Advanced reports",
        values: { free: false, starter: true, pro: true, enterprise: true },
      },
      {
        label: "Banking & reconciliation",
        values: { free: false, starter: true, pro: true, enterprise: true },
      },
      {
        label: "Integrations, automation & API keys",
        values: { free: false, starter: true, pro: true, enterprise: true },
      },
    ],
  },
  {
    title: "AI",
    rows: [
      {
        label: "AI Copilot",
        values: { free: false, starter: false, pro: "1,000 / month", enterprise: "Unlimited" },
      },
    ],
  },
  {
    title: "Security & support",
    rows: [
      {
        label: "Role-based access control",
        values: { free: true, starter: true, pro: true, enterprise: true },
      },
      {
        label: "Per-company data isolation",
        values: { free: true, starter: true, pro: true, enterprise: true },
      },
      {
        label: "Support",
        values: { free: "Community", starter: "Email", pro: "Priority email", enterprise: "Priority" },
      },
      {
        label: "Dedicated onboarding",
        values: { free: false, starter: false, pro: false, enterprise: true },
      },
    ],
  },
];

export type PricingFaq = {
  question: string;
  answer: string;
};

export const PRICING_FAQS: PricingFaq[] = [
  {
    question: "Are the prices inclusive of GST?",
    answer:
      "No. Prices are listed in INR and exclude 18% GST, which is added to the invoice. GST-registered businesses can claim input credit on their subscription.",
  },
  {
    question: "Can I change plans later?",
    answer:
      "Yes. You can upgrade, downgrade or cancel from Billing inside your workspace. Changes take effect from the next billing period.",
  },
  {
    question: "What counts as a user?",
    answer:
      "A user is any teammate with a login to your workspace. Read-only collaborators and customers using your customer portal do not count towards the limit.",
  },
  {
    question: "Is my company data isolated from other companies?",
    answer:
      "Yes. Every record is scoped to your organization, and role-based access controls what each user can see and do inside it.",
  },
  {
    question: "Do you offer annual billing?",
    answer: `Yes. Switch to yearly billing to save about ${YEARLY_SAVING_PERCENT}% compared with paying monthly. Enterprise agreements are quoted annually.`,
  },
  {
    question: "How do I pay?",
    answer:
      "Indian customers pay online via Razorpay. International customers are redirected to a secure hosted checkout. Every payment produces a GST invoice in Billing.",
  },
  {
    question: "Can I migrate from Tally or Excel?",
    answer:
      "Yes. Start with a demo and our team will help you bring over your chart of accounts, opening balances and masters. Self-serve import templates are available for lists.",
  },
  {
    question: "What happens when my trial ends?",
    answer:
      "Your workspace stays available on the Free plan. Nothing is deleted — paid modules are simply restricted until you upgrade.",
  },
];
