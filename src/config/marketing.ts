import {
  BadgeCheck,
  Briefcase,
  History,
  Lock,
  Package,
  ReceiptText,
  Rocket,
  ShieldCheck,
  ShoppingCart,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type TrustPoint = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const TRUST_POINTS: TrustPoint[] = [
  {
    title: "GST-ready",
    description: "Invoices, tax reports and records built for Indian compliance.",
    icon: ReceiptText,
  },
  {
    title: "Role-based access",
    description: "Every teammate sees exactly the records and actions their role allows.",
    icon: ShieldCheck,
  },
  {
    title: "Per-company isolation",
    description: "Your organization's data is scoped and separated at the database layer.",
    icon: Lock,
  },
  {
    title: "Audit trail on every entry",
    description: "Who changed what, and when — captured for every financial record.",
    icon: History,
  },
];

export type MarketingModule = {
  id: string;
  name: string;
  icon: LucideIcon;
  summary: string;
  points: string[];
};

export const MODULES: MarketingModule[] = [
  {
    id: "accounting",
    name: "Accounting",
    icon: Wallet,
    summary:
      "Ledgers, journals, vouchers, trial balance, P&L and balance sheet — posted once and reflected everywhere.",
    points: ["Chart of accounts", "Vouchers & journals", "Trial balance, P&L, balance sheet"],
  },
  {
    id: "sales",
    name: "Sales & Billing",
    icon: ShoppingCart,
    summary:
      "Quotations, sales orders, GST invoices and payment tracking on a single customer record.",
    points: ["Quotations & orders", "GST invoices", "Payments & receivables"],
  },
  {
    id: "inventory",
    name: "Inventory",
    icon: Package,
    summary:
      "Live stock across warehouses, transfers, low-stock alerts and full movement history.",
    points: ["Multi-warehouse stock", "Transfers & adjustments", "Low-stock alerts"],
  },
  {
    id: "crm",
    name: "CRM & People",
    icon: Users,
    summary:
      "Leads, opportunities, activities, customers and teams in one shared pipeline.",
    points: ["Leads & opportunities", "Activities & follow-ups", "Customer 360"],
  },
  {
    id: "hrms",
    name: "HRMS",
    icon: Briefcase,
    summary:
      "Employees, attendance, leave and payroll-ready records connected to accounting.",
    points: ["Employee records", "Attendance & leave", "Payroll-ready data"],
  },
];

export type MobileTab = {
  id: string;
  label: string;
  /** Seconds into the app demo where this screen starts. */
  start: number;
  caption: string;
};

export const MOBILE_APP_DEMO = {
  video: "/mockups/mobile-app-demo.mp4",
  poster: "/mockups/mobile-app-poster.jpg",
};

export const MOBILE_TABS: MobileTab[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    start: 0,
    caption: "See revenue, receivables and stock the moment you open the app.",
  },
  {
    id: "attendance",
    label: "Attendance",
    start: 3.6,
    caption: "Check in from the floor and review the day's activity.",
  },
  {
    id: "approvals",
    label: "Approvals",
    start: 6.1,
    caption: "Approve leave and pending documents without a laptop.",
  },
  {
    id: "more",
    label: "More",
    start: 9.1,
    caption: "Switch organizations, open reports and manage security.",
  },
];

export type Step = {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const STEPS: Step[] = [
  {
    number: "01",
    title: "Create your workspace",
    description:
      "Sign up and set your company, currency and fiscal year. No implementation project needed.",
    icon: Rocket,
  },
  {
    number: "02",
    title: "Invite your team",
    description:
      "Assign roles and permissions so finance, sales and operations each see the right records.",
    icon: Users,
  },
  {
    number: "03",
    title: "Run the day",
    description:
      "Bill, buy, track and report from one place, with an audit trail on every entry.",
    icon: BadgeCheck,
  },
];

export type ProductSection = {
  id: string;
  /** Slug of the matching `/solutions/*` page. */
  solutionSlug: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  comingSoon: { label: string; note: string }[];
  visual:
    | { kind: "browser"; src: string; alt: string; url: string }
    | { kind: "phone"; src: string; alt: string };
};

export const PRODUCT_SECTIONS: ProductSection[] = [
  {
    id: "accounting",
    solutionSlug: "accounting-software",
    eyebrow: "Accounting",
    title: "Books that stay closed, and still add up",
    description:
      "Post once and every report follows. ERPX keeps your ledgers, vouchers and statements in one consistent set of books.",
    bullets: [
      "Chart of accounts, groups and ledgers",
      "Journal entries and type-specific vouchers",
      "Trial balance, profit & loss and balance sheet",
      "Receivables, payables and cost centres",
    ],
    comingSoon: [
      {
        label: "GST filing",
        note: "Direct return filing from ERPX is on the roadmap. Export GST-ready reports today.",
      },
    ],
    visual: {
      kind: "browser",
      src: "/mockups/product-accounting.png",
      alt: "ERPX accounting workspace showing ledgers and financial statements",
      url: "app.erpx.com/accounting",
    },
  },
  {
    id: "sales",
    solutionSlug: "gst-billing-software",
    eyebrow: "Sales & Billing",
    title: "From quote to cash, without re-typing",
    description:
      "A single customer record follows every quotation, order, invoice and payment — so nothing is billed twice or forgotten.",
    bullets: [
      "Quotations and sales orders",
      "GST invoices with print-ready layouts",
      "Payments, part-payments and receivables",
      "Customer statements and sales reports",
    ],
    comingSoon: [],
    visual: {
      kind: "browser",
      src: "/mockups/product-sales.png",
      alt: "ERPX sales and billing screen showing invoices and payments",
      url: "app.erpx.com/sales",
    },
  },
  {
    id: "inventory",
    solutionSlug: "inventory-management-software",
    eyebrow: "Inventory",
    title: "Know what you have, everywhere",
    description:
      "Stock levels update as you sell, buy and transfer, with a movement history you can audit line by line.",
    bullets: [
      "Products, categories and HSN/SAC codes",
      "Multi-warehouse stock and transfers",
      "Low-stock alerts and reorder signals",
      "Stock movement and valuation reports",
    ],
    comingSoon: [
      {
        label: "Manufacturing & BOM",
        note: "Bill of materials and production orders are being built — not available yet.",
      },
    ],
    visual: {
      kind: "browser",
      src: "/mockups/product-inventory.png",
      alt: "ERPX inventory screen showing stock across warehouses",
      url: "app.erpx.com/inventory",
    },
  },
  {
    id: "crm",
    solutionSlug: "crm-software",
    eyebrow: "CRM & People",
    title: "One pipeline for customers and teammates",
    description:
      "Track leads and opportunities alongside the people who own them, with every call, note and follow-up in context.",
    bullets: [
      "Leads, stages and opportunities",
      "Notes, activities and follow-ups",
      "Customer 360 with billing history",
      "Teams, departments and ownership",
    ],
    comingSoon: [],
    visual: {
      kind: "phone",
      src: "/mockups/product-crm.png",
      alt: "ERPX mobile CRM screen showing leads and follow-ups",
    },
  },
  {
    id: "hrms",
    solutionSlug: "hrms-software",
    eyebrow: "HRMS",
    title: "People operations, connected to the books",
    description:
      "Keep employee records, attendance and leave next to the finance data they affect — without a second system.",
    bullets: [
      "Employee records and departments",
      "Attendance and leave workflows",
      "Payroll runs with approval stages",
      "Payslips and salary registers",
    ],
    comingSoon: [
      {
        label: "Payroll posting to accounting",
        note: "Automatic payroll journals are on the roadmap. Payroll runs themselves are available today.",
      },
    ],
    visual: {
      kind: "phone",
      src: "/mockups/product-hrms.png",
      alt: "ERPX mobile HRMS screen showing attendance and payroll",
    },
  },
];

export const TEAM_SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"] as const;

/** Common consumer inboxes used to nudge visitors toward a work email. */
export const FREE_EMAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "rediffmail.com",
];
