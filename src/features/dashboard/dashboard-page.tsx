"use client";

import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { WelcomeHeader } from "./components/welcome-header";
import { KPICards } from "./components/kpi-cards";
import { ActivityTimeline } from "./components/activity-timeline";
import { RevenuePerformance, type MonthPoint } from "./components/revenue-performance";
import { MoneyPosition, type OwnerKpis } from "./components/money-position";
import { TopProducts, OrderStatus, type NamedValue } from "./components/sales-breakdown";
import { Highlights, buildHighlights } from "./components/highlights";
import { QuickActions } from "./components/quick-actions";
import { PageTransition, StaggerContainer, StaggerItem } from "@/design-system";
import { formatINR, formatINRCompact } from "@/lib/format";
import {
  AlertCircle,
  RefreshCw,
  UserPlus,
  FileText,
  ShoppingCart,
  Package,
  Briefcase,
  Scale,
  ReceiptText,
  Users,
  Building2,
  ArrowUpRight,
  Clock,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import { useAccess } from "@/hooks/useAccess";
import type { KPI, TimelineEvent } from "./data";

interface BackendKPI {
  label: string;
  value: number;
  change: number;
  trend: "up" | "down" | "neutral";
}

interface ExecutiveDashboard {
  kpis: BackendKPI[];
  charts: {
    revenueTrend: {
      labels: string[];
      datasets: { label: string; data: number[]; backgroundColor?: string; borderColor?: string }[];
    };
  };
}

interface ChartSeries {
  labels?: string[];
  datasets?: { label: string; data: number[] }[];
}

interface SalesDashboardResponse {
  charts?: {
    salesByStatus?: ChartSeries;
    topProducts?: ChartSeries;
  };
}

const KPI_META: Record<string, { id: string; description: string; drillHref?: string }> = {
  Revenue: {
    id: "revenue",
    description: "Total revenue this period",
    drillHref: "/reports/financial",
  },
  "Outstanding Invoices": {
    id: "invoices",
    description: "Unpaid customer invoices",
    drillHref: "/sales/invoices",
  },
  "Inventory Value": {
    id: "inventory",
    description: "Total inventory valuation",
    drillHref: "/inventory/products",
  },
  "Purchase Spend": {
    id: "purchases",
    description: "Total procurement spend",
    drillHref: "/purchases/purchase-orders",
  },
  "Active Employees": {
    id: "employees",
    description: "Currently active employees",
    drillHref: "/hrms/employees",
  },
};

const KPI_DRILL_FALLBACK: Record<string, string> = {
  revenue: "/reports/financial",
  cashflow: "/accounting/cash-flow",
  profit: "/accounting/profit-loss",
  expenses: "/accounting/profit-loss",
  customers: "/sales/customers",
  deals: "/crm/opportunities",
  inventory: "/inventory/products",
  employees: "/hrms/employees",
};

function formatKpiValue(label: string, value: number): string {
  if (label === "Active Employees" || label === "Employees") return value.toLocaleString("en-IN");
  return formatINRCompact(value);
}

function formatKpiInsight(label: string, value: number): string {
  if (label === "Active Employees" || label === "Employees")
    return `${value} employees currently active`;
  return `Current ${label.toLowerCase()}: ${formatINR(value)}`;
}

function mapKpi(kpi: BackendKPI): KPI {
  const meta = KPI_META[kpi.label] ?? {
    id: kpi.label.toLowerCase().replace(/\s+/g, "-"),
    description: kpi.label,
  };
  const id = meta.id;
  return {
    id,
    label: kpi.label,
    value: formatKpiValue(kpi.label, kpi.value),
    rawValue: kpi.value,
    change: kpi.change,
    trend: kpi.trend,
    description: meta.description,
    insight: formatKpiInsight(kpi.label, kpi.value),
    drillHref: meta.drillHref ?? KPI_DRILL_FALLBACK[id],
  };
}

const EVENT_LABELS: Record<string, string> = {
  "journal_entry.created": "Journal entry created",
  "journal_entry.updated": "Journal entry updated",
  "journal_entry.reversed": "Journal entry reversed",
  "user.invited": "User invited",
  "user.created": "User created",
  "user.deactivated": "User deactivated",
  "invoice.created": "Invoice created",
  "invoice.sent": "Invoice sent",
  "invoice.paid": "Invoice paid",
  "payment.received": "Payment received",
  "purchase_order.created": "Purchase order created",
  "sales_order.created": "Sales order created",
  "quotation.created": "Quotation created",
  "lead.created": "Lead created",
  "customer.created": "Customer created",
  "product.created": "Product created",
  "employee.created": "Employee created",
};

/** Turn a raw audit event key into a readable label. */
function formatEventLabel(raw: unknown): string {
  const key = typeof raw === "string" ? raw.trim() : "";
  if (!key) return "Activity";
  const known = EVENT_LABELS[key.toLowerCase()];
  if (known) return known;
  const words = key.replace(/[._]+/g, " ").replace(/\s+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function mapAuditLog(event: Record<string, unknown>): TimelineEvent {
  const resource = String(event.resource ?? "").toUpperCase();
  const typeMap: Record<string, TimelineEvent["type"]> = {
    INVOICE: "invoice",
    PAYMENT: "payment",
    SALES_ORDER: "order",
    PURCHASE_ORDER: "order",
    APPROVAL: "approval",
    EMPLOYEE: "employee",
    AI: "ai",
    ALERT: "alert",
  };
  const actorName = event.actorName as string | undefined;
  const initials = actorName
    ? actorName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "S";
  return {
    id: event.id as string,
    time: formatRelativeTime(event.createdAt as string),
    title: formatEventLabel(event.event ?? event.action),
    description:
      (event.details as Record<string, string>)?.description ??
      `${event.action} on ${event.resource}`,
    type: typeMap[resource] ?? "approval",
    user: actorName ? { name: actorName, initials } : undefined,
  };
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// Permission required per executive KPI label (backend /auth/me permissions).
const KPI_PERMISSION: Record<string, string[]> = {
  Revenue: ["invoice:read", "payment:read"],
  "Outstanding Invoices": ["invoice:read"],
  "Inventory Value": ["product:read", "stock:read"],
  "Purchase Spend": ["purchase_order:read"],
  "Active Employees": ["employee:read"],
};

export function DashboardPage() {
  const { user } = useAuth();
  const access = useAccess();
  const orgId = user?.organization?.id;

  const canSeeKpis = access.canAny([
    "invoice:read",
    "product:read",
    "purchase_order:read",
    "employee:read",
  ]);
  const canSeeAudit = access.hasPermission("audit_log:read");
  const canSeeAnalytics = access.canAny(["sales_report:read", "report:read", "invoice:read"]);
  const canSeeMoney = access.canAny(["report:dashboard", "invoice:read"]);

  const {
    data: execData,
    isLoading: execLoading,
    isError: execError,
    refetch: refetchExec,
  } = useQuery({
    queryKey: ["executive-dashboard", orgId],
    queryFn: () =>
      api.get<ExecutiveDashboard>(`/reports/organizations/${orgId}/dashboard/executive`),
    enabled: !!orgId && canSeeKpis,
    retry: 2,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: ownerData } = useQuery({
    queryKey: ["owner-dashboard", orgId],
    queryFn: () => api.get<OwnerKpis>(`/reports/organizations/${orgId}/dashboard/owner`),
    enabled: !!orgId && canSeeKpis && canSeeMoney,
    retry: 1,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: auditData } = useQuery({
    queryKey: ["audit-logs", orgId],
    queryFn: () =>
      api.get<{ data: Record<string, unknown>[] }>("/audit-logs", {
        params: { limit: "7", sortBy: "createdAt", sortOrder: "desc" },
      }),
    enabled: !!orgId && canSeeAudit,
    retry: 1,
    staleTime: 30_000,
  });

  const { data: salesDashboard } = useQuery({
    queryKey: ["sales-dashboard", orgId],
    queryFn: () =>
      api.get<SalesDashboardResponse>(`/reports/organizations/${orgId}/dashboard/sales`),
    enabled: !!orgId && canSeeAnalytics,
    retry: 1,
    staleTime: 60_000,
  });

  const visibleKpis = useMemo<BackendKPI[]>(
    () =>
      (execData?.kpis ?? []).filter((kpi) => {
        const perms = KPI_PERMISSION[kpi.label];
        return !perms || perms.some((p) => access.hasPermission(p));
      }),
    [execData, access],
  );
  const kpis = useMemo<KPI[]>(() => visibleKpis.map(mapKpi), [visibleKpis]);

  // No transactions yet → show a setup checklist instead of empty ₹0 KPIs.
  const hasTransactions = useMemo(() => kpis.some((kpi) => Number(kpi.rawValue) > 0), [kpis]);

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const logs = Array.isArray(auditData) ? auditData : auditData?.data;
    if (!logs?.length) return [];
    return logs.slice(0, 7).map(mapAuditLog);
  }, [auditData]);

  const trend = useMemo<MonthPoint[]>(() => {
    const rt = execData?.charts?.revenueTrend;
    const data = rt?.datasets?.[0]?.data ?? [];
    return (rt?.labels ?? []).map((month, i) => ({ month, value: Number(data[i] ?? 0) }));
  }, [execData]);

  const toSeries = (chart?: ChartSeries): NamedValue[] => {
    const labels = Array.isArray(chart?.labels) ? chart.labels : [];
    const values = chart?.datasets?.[0]?.data ?? [];
    return labels.map((name, i) => ({ name, value: Number(values[i] ?? 0) }));
  };
  const orderStatus = useMemo(() => toSeries(salesDashboard?.charts?.salesByStatus), [salesDashboard]);
  const topProducts = useMemo(() => toSeries(salesDashboard?.charts?.topProducts), [salesDashboard]);

  const highlights = useMemo(
    () => buildHighlights({ owner: ownerData, trend, topProducts }),
    [ownerData, trend, topProducts],
  );

  // Permission-filtered quick-create actions.
  const quickActions = useMemo(() => {
    const can = access.hasPermission;
    const items: { id: string; label: string; icon: LucideIcon; color: string; to?: string }[] = [];
    const add = (id: string, label: string, icon: LucideIcon, to: string, perms: string[]) => {
      if (perms.some((p) => can(p))) items.push({ id, label, icon, color: "primary", to });
    };
    add("invoice", "Create invoice", ReceiptText, "/sales/invoices", ["invoice:create"]);
    add("customer", "Add customer", Users, "/sales/customers", [
      "customer:create",
      "company:create",
    ]);
    add("order", "Sales order", ShoppingCart, "/sales/sales-orders", ["sales_order:create"]);
    add("quotation", "Quotation", FileText, "/sales/quotations", ["quotation:create"]);
    add("lead", "New lead", UserPlus, "/crm/leads", ["lead:create"]);
    add("product", "Add product", Package, "/inventory/products", ["product:create"]);
    add("journal", "Journal entry", Scale, "/accounting/journal-entries", [
      "journal_entry:create",
    ]);
    add("employee", "Add employee", Briefcase, "/hrms/employees", ["employee:create"]);
    return items.slice(0, 8);
  }, [access]);

  const ready = canSeeKpis && !execLoading && hasTransactions;

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1440px] space-y-6">
        <WelcomeHeader
          userName={user?.firstName ?? "there"}
          organization={user?.organization?.name ?? "your business"}
          onAIAssistant={() => window.dispatchEvent(new Event("erpx:open-ai-copilot"))}
        />

        {canSeeKpis && execError && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Couldn&apos;t load dashboard data.</span>
            <button
              onClick={() => refetchExec()}
              className="ml-auto flex items-center gap-1 text-xs font-semibold hover:underline"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        )}

        <StaggerContainer className="space-y-6">
          <StaggerItem>
            {canSeeKpis ? (
              execLoading ? (
                <DashboardSkeleton />
              ) : execData && !hasTransactions ? (
                <SetupChecklist />
              ) : (
                <KPICards data={kpis} />
              )
            ) : (
              <EmptyDashboard />
            )}
          </StaggerItem>

          {ready && (
            <>
              <StaggerItem>
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                  <div className={ownerData ? "xl:col-span-2" : "xl:col-span-3"}>
                    <RevenuePerformance points={trend} />
                  </div>
                  {ownerData && <MoneyPosition data={ownerData} />}
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                  {canSeeAnalytics && <TopProducts items={topProducts} />}
                  {canSeeAnalytics && <OrderStatus items={orderStatus} />}
                  <div className="lg:col-span-2 xl:col-span-1">
                    <Highlights items={highlights} />
                  </div>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                  {quickActions.length > 0 && (
                    <div className={canSeeAudit ? "xl:col-span-2" : "xl:col-span-3"}>
                      <QuickActions actions={quickActions} />
                    </div>
                  )}
                  {canSeeAudit && <ActivityTimeline events={timelineEvents} />}
                </div>
              </StaggerItem>
            </>
          )}
        </StaggerContainer>
      </div>
    </PageTransition>
  );
}

const SETUP_STEPS: { title: string; description: string; to: string; icon: LucideIcon }[] = [
  {
    title: "Complete company details",
    description: "Add your legal name, GSTIN, address and financial year.",
    to: "/admin/settings",
    icon: Building2,
  },
  {
    title: "Create your first ledger",
    description: "Set up the accounts you post transactions against.",
    to: "/accounting/chart-of-accounts",
    icon: Scale,
  },
  {
    title: "Create your first invoice",
    description: "Bill a customer and get paid.",
    to: "/sales/invoices",
    icon: ReceiptText,
  },
  {
    title: "Invite a teammate",
    description: "Bring your team in with the right roles.",
    to: "/admin/users",
    icon: Users,
  },
];

function SetupChecklist() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-card sm:p-7">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mb-6">
        <span className="text-label text-primary">Getting started</span>
        <h2 className="mt-1.5 font-display text-xl font-bold tracking-tight">Get set up in a few steps</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your organization has no transactions yet. Complete these steps to get started.
        </p>
      </div>
      <ul className="relative grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SETUP_STEPS.map((step, i) => (
          <li key={step.title}>
            <Link
              to={step.to as never}
              className="group flex h-full flex-col gap-4 rounded-xl border border-border/80 bg-gradient-to-b from-card to-muted/40 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <span className="flex items-center justify-between">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-primary text-white shadow-glow">
                  <step.icon className="h-[18px] w-[18px]" />
                </span>
                <span className="font-mono text-[11px] font-medium text-muted-foreground">0{i + 1}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{step.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {step.description}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Start <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/80 bg-card px-6 py-16 text-center shadow-card">
      <div className="font-display text-xl font-bold tracking-tight">Welcome to ERPX</div>
      <p className="max-w-md text-sm text-muted-foreground">
        Mark your attendance and manage your leave below. Company modules appear here once your
        admin gives your account a role with access to them.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Link
          to="/hrms/my-attendance"
          className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
        >
          <Clock className="h-4 w-4" /> Check in / My Attendance
        </Link>
        <Link
          to="/hrms/my-leave"
          className="inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-card shadow-card px-4 py-2.5 text-sm font-semibold shadow-xs hover:bg-muted"
        >
          <CalendarDays className="h-4 w-4" /> My Leave
        </Link>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/80 bg-card p-5 shadow-card animate-pulse">
          <div className="mb-4 h-10 w-10 rounded-xl bg-muted" />
          <div className="h-3 w-20 bg-muted rounded mb-3" />
          <div className="h-7 w-28 bg-muted rounded mb-2" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}
