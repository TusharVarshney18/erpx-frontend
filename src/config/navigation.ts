import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BookOpen,
  ShoppingCart,
  Package,
  Users2,
  Briefcase,
  BarChart3,
  Settings2,
  Bell,
  Landmark,
  Workflow,
  ShieldCheck,
  Fingerprint,
  Shield,
  Sparkles,
  type LucideProps,
} from "lucide-react";
import type { Permission } from "@/lib/access";
import type { FeatureId } from "@/lib/featureAccess";

export type NavItem = {
  title: string;
  url?: string;
  icon?: LucideIcon | ((props: LucideProps) => React.ReactNode);
  /** Read-level RBAC permission(s). Visibility uses ANY-of when an array. */
  permission?: Permission | Permission[];
  /** Premium feature gate (applied only after RBAC passes). */
  featureKey?: FeatureId;
  /** Only visible to organization administrators (or users with the permission). */
  adminOnly?: boolean;
  /** Only visible to platform Super Admins. */
  superAdminOnly?: boolean;
  children?: NavItem[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

const createItems = (): NavGroup[] => [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard, permission: "dashboard:read" },
      { title: "Notifications", url: "/notifications", icon: Bell },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        title: "Accounting",
        icon: BookOpen,
        children: [
          { title: "Chart of Accounts", url: "/accounting/chart-of-accounts", permission: "chart_of_account:read" },
          { title: "Account Groups", url: "/accounting/account-groups", permission: "chart_of_account:read" },
          { title: "Cost Centres", url: "/accounting/cost-centres", permission: "chart_of_account:read" },
          { title: "Vouchers", url: "/accounting/vouchers", permission: "journal_entry:read" },
          { title: "Ledgers", url: "/accounting/ledgers", permission: "ledger:read" },
          { title: "Journal Entries", url: "/accounting/journal-entries", permission: "journal_entry:read" },
          { title: "Statutory Books", url: "/accounting/books", permission: "accounting_report:read" },
          { title: "Fiscal Years", url: "/accounting/fiscal-years", permission: "fiscal_year:read" },
          { title: "Receivables & Payables", url: "/accounting/receivables", permission: "accounting_report:read" },
          { title: "Cash Flow", url: "/accounting/cash-flow", permission: "accounting_report:read" },
          { title: "Trial Balance", url: "/accounting/trial-balance", permission: "trial_balance:read" },
          { title: "Profit & Loss", url: "/accounting/profit-loss", permission: "profit_and_loss:read" },
          { title: "Balance Sheet", url: "/accounting/balance-sheet", permission: "balance_sheet:read" },
        ],
      },
      {
        title: "Banking",
        icon: Landmark,
        featureKey: "banking",
        children: [
          { title: "Accounts", url: "/banking/accounts", permission: "banking:read" },
          { title: "Transactions", url: "/banking/transactions", permission: "banking:read" },
          { title: "Statements", url: "/banking/statements", permission: "banking:read" },
        ],
      },
    ],
  },
  {
    label: "Commerce",
    items: [
      {
        title: "Sales",
        icon: ShoppingCart,
        children: [
          { title: "Customers", url: "/sales/customers", permission: ["customer:read", "company:read"] },
          { title: "Quotations", url: "/sales/quotations", permission: "quotation:read" },
          { title: "Sales Orders", url: "/sales/sales-orders", permission: "sales_order:read" },
          { title: "Invoices", url: "/sales/invoices", permission: "invoice:read" },
          { title: "Payments", url: "/sales/payments", permission: "payment:read" },
        ],
      },
      {
        title: "Purchases",
        icon: ShoppingCart,
        children: [
          { title: "Vendors", url: "/purchases/vendors", permission: "vendor:read" },
          { title: "Purchase Orders", url: "/purchases/purchase-orders", permission: "purchase_order:read" },
          { title: "Bills", url: "/purchases/bills", permission: "bill:read" },
          { title: "Expenses", url: "/purchases/expenses", permission: "expense:read" },
        ],
      },
      {
        title: "Inventory",
        icon: Package,
        children: [
          { title: "Products", url: "/inventory/products", permission: "product:read" },
          { title: "Categories", url: "/inventory/categories", permission: "category:read" },
          { title: "Warehouses", url: "/inventory/warehouses", permission: "warehouse:read" },
          { title: "Stock Movements", url: "/inventory/stock-movements", permission: ["stock_movement:read", "stock:read"] },
          { title: "Low Stock Alerts", url: "/inventory/low-stock", permission: "product:read" },
        ],
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        title: "CRM",
        icon: Users2,
        children: [
          { title: "Leads", url: "/crm/leads", permission: "lead:read" },
          { title: "Opportunities", url: "/crm/opportunities", permission: "deal:read" },
          { title: "Activities", url: "/crm/activities", permission: "activity:read" },
        ],
      },
      {
        title: "HRMS",
        icon: Briefcase,
        children: [
          { title: "Employees", url: "/hrms/employees", permission: "employee:read" },
          { title: "Attendance", url: "/hrms/attendance", permission: "attendance:read" },
          { title: "Leaves", url: "/hrms/leaves", permission: "leave:read" },
          { title: "Payroll", url: "/hrms/payroll", permission: "payroll:read" },
        ],
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        title: "Reports",
        icon: BarChart3,
        children: [
          { title: "Financial Reports", url: "/reports/financial", permission: ["financial_report:read", "report:read"], featureKey: "advancedReports" },
          { title: "GST Reports", url: "/reports/gst", permission: ["gst_report:read", "report:read"], featureKey: "advancedReports" },
          { title: "Sales Reports", url: "/reports/sales", permission: ["sales_report:read", "report:read"] },
          { title: "Inventory Reports", url: "/reports/inventory", permission: ["inventory_report:read", "report:read"] },
        ],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Workflows", url: "/operations/workflows", icon: Workflow, permission: "workflow:read", featureKey: "automation" },
      { title: "Compliance", url: "/operations/compliance", icon: ShieldCheck, permission: "compliance:read" },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "Administration",
        icon: Settings2,
        adminOnly: true,
        children: [
          { title: "Users", url: "/admin/users", permission: "user:read" },
          { title: "Roles & Permissions", url: "/admin/roles", permission: "role:read" },
          { title: "Departments", url: "/admin/departments", permission: "department:read" },
          { title: "Teams", url: "/admin/teams", permission: "team:read" },
          { title: "Integrations", url: "/admin/integrations", permission: "integration:read", featureKey: "integrations" },
          { title: "API Keys", url: "/admin/api-keys", permission: "api_key:read", featureKey: "apiKeys" },
          { title: "Billing", url: "/admin/billing", permission: "billing:read", featureKey: "billing" },
          { title: "Audit Log", url: "/admin/audit-log", permission: "audit_log:read" },
          { title: "Company Settings", url: "/admin/settings", permission: "setting:read" },
        ],
      },
      {
        title: "Security",
        icon: Fingerprint,
        adminOnly: true,
        children: [
          { title: "Active Sessions", url: "/security/sessions", permission: "session:read" },
          { title: "Two-Factor Auth", url: "/security/mfa", permission: "session:read" },
        ],
      },
    ],
  },
];

const superAdminGroups = (): NavGroup[] => [
  {
    label: "Platform",
    items: [
      {
        title: "Super Admin",
        icon: Shield,
        children: [
          { title: "Dashboard", url: "/super-admin/dashboard", superAdminOnly: true },
          { title: "Organizations", url: "/super-admin/organizations", superAdminOnly: true },
          { title: "Users", url: "/super-admin/users", superAdminOnly: true },
          { title: "Subscriptions", url: "/super-admin/subscriptions", superAdminOnly: true },
          { title: "Roles", url: "/super-admin/roles", superAdminOnly: true },
          { title: "Permissions", url: "/super-admin/permissions", superAdminOnly: true },
          { title: "Payments", url: "/super-admin/payments", superAdminOnly: true },
          { title: "Invoices", url: "/super-admin/invoices", superAdminOnly: true },
          { title: "Coupons", url: "/super-admin/coupons", superAdminOnly: true },
          { title: "Announcements", url: "/super-admin/announcements", superAdminOnly: true },
          { title: "System Health", url: "/super-admin/system-health", superAdminOnly: true },
          { title: "Audit Logs", url: "/super-admin/audit-logs", superAdminOnly: true },
          { title: "Settings", url: "/super-admin/settings", superAdminOnly: true },
        ],
      },
    ],
  },
];

/** Ordered group labels used to keep the sidebar stable. */
const groupOrder = [
  "Overview",
  "Finance",
  "Commerce",
  "People",
  "Insights",
  "Operations",
  "System",
  "Platform",
];

export function getNavigation(): { tenant: NavGroup[]; platform: NavGroup[] } {
  return { tenant: createItems(), platform: superAdminGroups() };
}

export { groupOrder, Sparkles };
