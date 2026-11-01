/**
 * Content for the keyword-focused solution pages under `/solutions/*`.
 *
 * Every capability listed here must exist in the product today. Anything on the
 * roadmap belongs in `comingSoon` (rendered with a "Coming soon" label) so the
 * pages never promise features customers cannot use.
 */
import { Briefcase, Package, ReceiptText, Users, Wallet, type LucideIcon } from "lucide-react";

export type SolutionVisual =
  | { kind: "browser"; src: string; alt: string; url: string }
  | { kind: "phone"; src: string; alt: string };

export type Solution = {
  slug: string;
  /** Short name used in navigation, breadcrumbs and related links. */
  name: string;
  icon: LucideIcon;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  headline: string;
  intro: string[];
  visual: SolutionVisual;
  capabilities: { title: string; description: string; points: string[] }[];
  audience: { title: string; description: string }[];
  connections: { title: string; description: string }[];
  comingSoon: { label: string; note: string }[];
  faqs: { question: string; answer: string }[];
};

export const SOLUTIONS: Solution[] = [
  {
    slug: "accounting-software",
    name: "Accounting",
    icon: Wallet,
    metaTitle: "Online Accounting Software for Indian Businesses | ERPX",
    metaDescription:
      "Cloud accounting with chart of accounts, vouchers, journals, trial balance, P&L and balance sheet, plus an audit trail on every entry. Start free with ERPX.",
    eyebrow: "Accounting software",
    headline: "Online accounting software that keeps every report in step",
    intro: [
      "ERPX gives finance teams one set of books for the whole business. Post a voucher once and the ledger, trial balance, profit & loss and balance sheet all reflect it immediately — no re-keying and no month-end reconciliation between spreadsheets.",
      "Because sales, purchases, inventory and payroll live in the same workspace, the numbers in your accounts come from the transactions that created them, and every change is recorded in the audit trail.",
    ],
    visual: {
      kind: "browser",
      src: "/mockups/product-accounting.png",
      alt: "ERPX accounting workspace showing ledgers and financial statements",
      url: "app.erpx.com/accounting",
    },
    capabilities: [
      {
        title: "Chart of accounts and ledgers",
        description:
          "Structure your books the way your business is organised, with account groups and ledgers you control.",
        points: ["Account groups and sub-groups", "Ledgers for every party and head", "Fiscal years"],
      },
      {
        title: "Vouchers and journal entries",
        description:
          "Record day-to-day transactions with type-specific vouchers and post adjustments through journal entries.",
        points: ["Type-specific vouchers", "Journal entries", "Cost centres"],
      },
      {
        title: "Financial statements",
        description:
          "See the position of the business at any time without waiting for a closing exercise.",
        points: ["Trial balance", "Profit & loss", "Balance sheet"],
      },
      {
        title: "Receivables and payables",
        description:
          "Know who owes you and whom you owe, linked directly to the invoices and bills behind each balance.",
        points: ["Customer receivables", "Vendor payables", "Receivables & payables ageing"],
      },
    ],
    audience: [
      {
        title: "Growing SMEs",
        description:
          "Businesses moving off spreadsheets or desktop accounting that want their books online and shared with the team.",
      },
      {
        title: "Finance teams",
        description:
          "Accountants who need role-based access, so juniors can post entries while reports and settings stay restricted.",
      },
      {
        title: "Multi-company groups",
        description:
          "Owners running more than one company who need each organization's data kept separate.",
      },
    ],
    connections: [
      {
        title: "Sales & Billing",
        description: "Invoices and customer payments flow into receivables and the ledgers.",
      },
      {
        title: "Purchases",
        description: "Vendor bills and expenses update payables as they are recorded.",
      },
      {
        title: "Banking",
        description: "Bank accounts and transactions sit next to the books they reconcile with.",
      },
    ],
    comingSoon: [
      {
        label: "GST return filing",
        note: "Filing returns directly from ERPX is on the roadmap. GST-ready reports can be exported today.",
      },
    ],
    faqs: [
      {
        question: "Is ERPX accounting software suitable for small businesses?",
        answer:
          "Yes. The Free plan supports up to 3 users and includes accounting, so a small business can start without paying and upgrade as the team grows.",
      },
      {
        question: "Which financial reports does ERPX generate?",
        answer:
          "ERPX produces a trial balance, profit & loss statement and balance sheet from your posted entries, along with receivables and payables views.",
      },
      {
        question: "Can I control who can post or edit entries?",
        answer:
          "Yes. Role-based access decides what each user can see and do, and the audit trail records who changed what and when on every financial record.",
      },
      {
        question: "Can I file GST returns from ERPX?",
        answer:
          "Not yet. Direct return filing is on the roadmap. Today you can export GST-ready reports to file through your existing process.",
      },
    ],
  },
  {
    slug: "gst-billing-software",
    name: "GST Billing",
    icon: ReceiptText,
    metaTitle: "GST Billing & Invoicing Software — Quote to Cash | ERPX",
    metaDescription:
      "Create GST invoices with print-ready layouts, manage quotations and sales orders, and track payments and receivables on one customer record. Try ERPX free.",
    eyebrow: "GST billing software",
    headline: "GST billing software that takes you from quote to cash",
    intro: [
      "ERPX keeps every quotation, sales order, GST invoice and payment on a single customer record. Convert a quote into an order and an order into an invoice without re-typing items, rates or tax details.",
      "Invoices post to accounting automatically and update stock in inventory, so billing never drifts away from your books or your warehouse.",
    ],
    visual: {
      kind: "browser",
      src: "/mockups/product-sales.png",
      alt: "ERPX sales and billing screen showing GST invoices and payments",
      url: "app.erpx.com/sales",
    },
    capabilities: [
      {
        title: "GST invoices",
        description:
          "Raise tax invoices with HSN/SAC codes on your products and print-ready layouts your customers can use.",
        points: ["GST invoices", "HSN/SAC codes on items", "Print-ready layouts"],
      },
      {
        title: "Quotations and sales orders",
        description:
          "Send quotations, confirm them as sales orders and bill from the order, keeping the full history together.",
        points: ["Quotations", "Sales orders", "Convert without re-typing"],
      },
      {
        title: "Payments and receivables",
        description:
          "Record full and part-payments against invoices and see exactly what is outstanding for each customer.",
        points: ["Full and part-payments", "Receivables by customer", "Customer statements"],
      },
      {
        title: "Sales and GST reports",
        description:
          "Review sales performance and export GST-ready reports for your filing process.",
        points: ["Sales reports", "GST reports", "Export for filing"],
      },
    ],
    audience: [
      {
        title: "Traders and distributors",
        description:
          "High-volume invoicing where billing has to match stock on hand across warehouses.",
      },
      {
        title: "Service businesses",
        description: "Firms that bill with SAC codes and need to chase part-payments cleanly.",
      },
      {
        title: "Sales teams",
        description:
          "Teams that quote, follow up and close deals, with the customer's billing history in one place.",
      },
    ],
    connections: [
      {
        title: "Accounting",
        description: "Every invoice and payment updates receivables and your ledgers.",
      },
      {
        title: "Inventory",
        description: "Invoiced goods are consumed from stock and costed automatically.",
      },
      {
        title: "CRM",
        description: "Won opportunities become customers with their full billing history.",
      },
    ],
    comingSoon: [
      {
        label: "GST return filing",
        note: "Direct filing from ERPX is on the roadmap. GST-ready reports can be exported today.",
      },
    ],
    faqs: [
      {
        question: "Can I create GST-compliant invoices in ERPX?",
        answer:
          "Yes. ERPX generates GST invoices using the HSN/SAC codes on your products, with print-ready layouts.",
      },
      {
        question: "Can I record part-payments against an invoice?",
        answer:
          "Yes. You can record full or part-payments, and the remaining balance stays visible in the customer's receivables.",
      },
      {
        question: "Does billing update my stock and accounts?",
        answer:
          "Yes. Invoices post to accounting and update inventory, because sales, inventory and accounting share the same records.",
      },
      {
        question: "Can I file GST returns from ERPX?",
        answer:
          "Not yet. Direct return filing is on the roadmap. You can export GST-ready reports today.",
      },
    ],
  },
  {
    slug: "inventory-management-software",
    name: "Inventory",
    icon: Package,
    metaTitle: "Inventory Management Software — Multi-Warehouse Stock | ERPX",
    metaDescription:
      "Track live stock across warehouses with transfers, adjustments, low-stock alerts and a full movement history. Inventory that updates as you buy and sell.",
    eyebrow: "Inventory management software",
    headline: "Inventory management software for stock across every warehouse",
    intro: [
      "ERPX updates stock levels as you sell, buy and transfer, so the number on screen is the number on the shelf. Every movement is recorded, giving you a history you can audit line by line.",
      "Products carry their categories and HSN/SAC codes into billing, and low-stock alerts flag items before they run out.",
    ],
    visual: {
      kind: "browser",
      src: "/mockups/product-inventory.png",
      alt: "ERPX inventory screen showing stock across warehouses",
      url: "app.erpx.com/inventory",
    },
    capabilities: [
      {
        title: "Products and categories",
        description: "Keep a clean item master with categories and tax codes used across the business.",
        points: ["Product catalogue", "Categories", "HSN/SAC codes"],
      },
      {
        title: "Multi-warehouse stock",
        description: "See stock per location and move it between warehouses with recorded transfers.",
        points: ["Stock by warehouse", "Transfers", "Adjustments"],
      },
      {
        title: "Low-stock alerts",
        description: "Get signalled when items fall below their reorder level so you can restock in time.",
        points: ["Low-stock list", "Reorder signals", "Fewer stock-outs"],
      },
      {
        title: "Movement and valuation reports",
        description: "Trace every quantity change and review the value of the stock you hold.",
        points: ["Stock movement history", "FIFO / weighted-average valuation", "Valuation reports"],
      },
    ],
    audience: [
      {
        title: "Wholesalers and distributors",
        description: "Businesses holding stock in more than one godown or warehouse.",
      },
      {
        title: "Retail and e-commerce",
        description: "Sellers who need stock to stay accurate as orders are billed.",
      },
      {
        title: "Operations teams",
        description: "Store and warehouse staff who need a reliable record of every movement.",
      },
    ],
    connections: [
      {
        title: "Sales & Billing",
        description: "Invoiced goods are consumed from stock, with cost of goods sold posted.",
      },
      {
        title: "Purchases",
        description: "Vendor bills bring stock in at cost against your suppliers.",
      },
      {
        title: "Reports",
        description: "Inventory reports sit next to sales and financial reports.",
      },
    ],
    comingSoon: [
      {
        label: "Manufacturing & BOM",
        note: "Bill of materials and production orders are being built and are not available yet.",
      },
    ],
    faqs: [
      {
        question: "Can ERPX manage stock in more than one warehouse?",
        answer:
          "Yes. ERPX tracks stock per warehouse and records transfers and adjustments between them.",
      },
      {
        question: "Does stock update automatically when I bill or buy?",
        answer:
          "Yes. Sales, purchases and inventory share the same records, so stock changes as transactions are posted.",
      },
      {
        question: "Will ERPX warn me before an item runs out?",
        answer: "Yes. Low-stock alerts and reorder signals flag items that fall below their reorder level.",
      },
      {
        question: "Does ERPX support manufacturing or BOM?",
        answer:
          "Not yet. Bill of materials and production orders are on the roadmap and are not available today.",
      },
    ],
  },
  {
    slug: "crm-software",
    name: "CRM",
    icon: Users,
    metaTitle: "CRM Software for Sales Pipelines & Follow-ups | ERPX",
    metaDescription:
      "Manage leads, opportunities, activities and follow-ups in one pipeline, with a Customer 360 view that includes billing history. CRM connected to your ERP.",
    eyebrow: "CRM software",
    headline: "CRM software connected to the rest of your business",
    intro: [
      "ERPX tracks leads and opportunities alongside the people who own them, with every call, note and follow-up kept in context.",
      "Because the CRM shares records with billing and accounting, your team sees a customer's invoices and payments next to the conversation — no switching between a sales tool and an ERP.",
    ],
    visual: {
      kind: "phone",
      src: "/mockups/product-crm.png",
      alt: "ERPX mobile CRM screen showing leads and follow-ups",
    },
    capabilities: [
      {
        title: "Leads and opportunities",
        description: "Capture leads, move them through stages and track the opportunities worth pursuing.",
        points: ["Lead capture", "Pipeline stages", "Opportunities"],
      },
      {
        title: "Activities and follow-ups",
        description: "Log calls and notes and schedule the next step so no prospect is forgotten.",
        points: ["Notes and calls", "Follow-ups", "Activity history"],
      },
      {
        title: "Customer 360",
        description: "See everything about a customer in one place, including their billing history.",
        points: ["Single customer record", "Billing history", "Contact details"],
      },
      {
        title: "Teams and ownership",
        description: "Assign records to owners and organise people into teams and departments.",
        points: ["Record ownership", "Teams", "Departments"],
      },
    ],
    audience: [
      {
        title: "B2B sales teams",
        description: "Teams working longer sales cycles with several follow-ups per deal.",
      },
      {
        title: "Founders and owners",
        description: "Leaders who want pipeline and revenue in the same system.",
      },
      {
        title: "Account managers",
        description: "People who need a customer's orders and payments before every call.",
      },
    ],
    connections: [
      {
        title: "Sales & Billing",
        description: "Won deals move straight into quotations, orders and invoices.",
      },
      {
        title: "Accounting",
        description: "Customer balances come from the same ledgers finance uses.",
      },
      {
        title: "Mobile app",
        description: "Review leads and follow-ups from the ERPX mobile app.",
      },
    ],
    comingSoon: [],
    faqs: [
      {
        question: "Is the ERPX CRM a separate product?",
        answer:
          "No. CRM is part of the same ERPX workspace, so leads, customers, invoices and payments share one set of records.",
      },
      {
        question: "Can I see a customer's billing history in the CRM?",
        answer: "Yes. The Customer 360 view shows the customer's billing history next to their activities.",
      },
      {
        question: "Can I assign leads to specific salespeople?",
        answer: "Yes. Records have owners, and people can be organised into teams and departments.",
      },
      {
        question: "Can I use the CRM on my phone?",
        answer: "Yes. The ERPX mobile app gives access to leads and follow-ups on the go.",
      },
    ],
  },
  {
    slug: "hrms-software",
    name: "HRMS & Payroll",
    icon: Briefcase,
    metaTitle: "HRMS & Payroll Software — Attendance, Leave, Payslips | ERPX",
    metaDescription:
      "Employee records, attendance, leave workflows and payroll runs with approvals, payslips and salary registers — HR software connected to your accounts.",
    eyebrow: "HRMS & payroll software",
    headline: "HRMS and payroll software connected to the books",
    intro: [
      "ERPX keeps employee records, attendance and leave next to the finance data they affect, so HR does not need a second system.",
      "Run payroll with approval stages and issue payslips and salary registers from the same workspace. Employees can check in and managers can approve leave from the ERPX mobile app.",
    ],
    visual: {
      kind: "phone",
      src: "/mockups/product-hrms.png",
      alt: "ERPX mobile HRMS screen showing attendance and payroll",
    },
    capabilities: [
      {
        title: "Employee records",
        description: "Maintain a single record for each employee, organised by department.",
        points: ["Employee profiles", "Departments", "Role-based visibility"],
      },
      {
        title: "Attendance",
        description: "Track attendance, including check-ins from the ERPX mobile app.",
        points: ["Daily attendance", "Mobile check-in", "Activity review"],
      },
      {
        title: "Leave management",
        description: "Handle leave requests with approval workflows managers can action from their phone.",
        points: ["Leave requests", "Approval workflows", "Mobile approvals"],
      },
      {
        title: "Payroll",
        description: "Run payroll with approval stages, then issue payslips and salary registers.",
        points: ["Payroll runs", "Approval stages", "Payslips and salary registers"],
      },
    ],
    audience: [
      {
        title: "Growing teams",
        description: "Companies that have outgrown attendance and leave spreadsheets.",
      },
      {
        title: "HR and admin",
        description: "Teams that want approvals and payroll in one auditable place.",
      },
      {
        title: "Field and floor staff",
        description: "Employees who check in from the floor rather than from a desk.",
      },
    ],
    connections: [
      {
        title: "Accounting",
        description: "HR data lives in the same workspace as the books it affects.",
      },
      {
        title: "Approvals",
        description: "Leave and payroll follow approval stages with a full audit trail.",
      },
      {
        title: "Mobile app",
        description: "Attendance check-in and leave approvals work from the ERPX mobile app.",
      },
    ],
    comingSoon: [
      {
        label: "Payroll posting to accounting",
        note: "Automatic payroll journals are on the roadmap. Payroll runs themselves are available today.",
      },
    ],
    faqs: [
      {
        question: "Does ERPX include payroll?",
        answer:
          "Yes. You can run payroll with approval stages and generate payslips and salary registers.",
      },
      {
        question: "Can employees mark attendance from their phone?",
        answer: "Yes. The ERPX mobile app supports attendance check-in and lets managers approve leave.",
      },
      {
        question: "Does payroll post to accounting automatically?",
        answer:
          "Not yet. Automatic payroll journals are on the roadmap. Payroll runs, payslips and salary registers are available today.",
      },
      {
        question: "Can I restrict who sees salary information?",
        answer: "Yes. Role-based access controls which users can see and act on HR and payroll records.",
      },
    ],
  },
];

export function getSolution(slug: string): Solution | undefined {
  return SOLUTIONS.find((solution) => solution.slug === slug);
}
