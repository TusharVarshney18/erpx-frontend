"use client";

import { useState, useCallback, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { WelcomeHeader } from "./components/welcome-header";
import { KPICards } from "./components/kpi-cards";
import { AIInsightsPanel } from "./components/ai-insights";
import { ActivityTimeline } from "./components/activity-timeline";
import { AnalyticsSection } from "./components/analytics-section";
import { QuickActions } from "./components/quick-actions";
import { PageTransition, StaggerContainer, StaggerItem } from "@/design-system";
import { formatINR } from "@/lib/format";
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
  type LucideIcon,
} from "lucide-react";
import { useAccess } from "@/hooks/useAccess";
import { notificationsApi } from "@/lib/api/notifications";
import type { KPI, AIInsight, TimelineEvent } from "./data";

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
  return formatINR(value);
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

function generateInsights(kpis: BackendKPI[]): AIInsight[] {
  return kpis.map((kpi) => {
    const isUp = kpi.trend === "up" && kpi.change > 0;
    const isDown = kpi.trend === "down" && kpi.change > 0;
    const type: AIInsight["type"] = isUp ? "positive" : isDown ? "warning" : "info";
    const valueStr = formatKpiValue(kpi.label, kpi.value);
    return {
      id: `insight-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`,
      type,
      title: isUp
        ? `${kpi.label} up ${kpi.change}%`
        : isDown
          ? `${kpi.label} declined ${kpi.change}%`
          : `${kpi.label}: ${valueStr}`,
      description: isUp
        ? `${kpi.label} is trending upward at ${valueStr}.`
        : isDown
          ? `${kpi.label} decreased by ${kpi.change}% to ${valueStr}.`
          : `${kpi.label} is currently at ${valueStr}.`,
      action: { label: "View Details" },
    };
  });
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

function deriveChartData(
  labels: string[],
  data: number[],
): { month: string; revenue: number; expenses: number; profit: number }[] {
  return labels.map((month, i) => {
    const revenue = data[i] ?? 0;
    const expenses = Math.round(revenue * 0.6);
    return { month, revenue, expenses, profit: revenue - expenses };
  });
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

  const { data: unreadData } = useQuery({
    queryKey: ["dashboard-unread", orgId],
    queryFn: () => notificationsApi.unreadCount(),
    enabled: !!orgId,
    refetchInterval: 60_000,
  });

  const kpis = useMemo<KPI[]>(() => {
    if (!execData?.kpis?.length) return [];
    return execData.kpis
      .filter((kpi) => {
        const perms = KPI_PERMISSION[kpi.label];
        if (!perms) return true;
        return perms.some((p) => access.hasPermission(p));
      })
      .map(mapKpi);
  }, [execData, access]);

  // No transactions yet → show a setup checklist instead of empty ₹0 KPIs.
  const hasTransactions = useMemo(() => kpis.some((kpi) => Number(kpi.rawValue) > 0), [kpis]);

  const insights = useMemo<AIInsight[]>(() => {
    if (!execData?.kpis?.length) return [];
    return generateInsights(
      execData.kpis.filter((kpi) => {
        const perms = KPI_PERMISSION[kpi.label];
        if (!perms) return true;
        return perms.some((p) => access.hasPermission(p));
      }),
    );
  }, [execData, access]);

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const logs = Array.isArray(auditData) ? auditData : auditData?.data;
    if (!logs?.length) return [];
    return logs.slice(0, 7).map(mapAuditLog);
  }, [auditData]);

  const chartData = useMemo(() => {
    const rt = execData?.charts?.revenueTrend;
    if (!rt?.labels?.length || !rt?.datasets?.[0]?.data?.length) return null;
    return deriveChartData(rt.labels, rt.datasets[0].data);
  }, [execData]);

  // Real analytics data (no mock). Empty datasets are hidden by the component.
  // The dashboard endpoints return chart data in { labels, datasets } shape.
  const analytics = useMemo(() => {
    const statusChart = salesDashboard?.charts?.salesByStatus;
    const topChart = salesDashboard?.charts?.topProducts;

    const statusLabels = Array.isArray(statusChart?.labels) ? statusChart.labels : [];
    const statusValues = statusChart?.datasets?.[0]?.data;
    const salesByCategory = statusLabels.map((name, i) => ({
      name,
      value: Array.isArray(statusValues) ? (statusValues[i] ?? 0) : 0,
    }));

    const topLabels = Array.isArray(topChart?.labels) ? topChart.labels : [];
    const topValues = topChart?.datasets?.[0]?.data;
    const weeklySales = topLabels.map((day, i) => ({
      day,
      orders: 0,
      revenue: Array.isArray(topValues) ? (topValues[i] ?? 0) : 0,
    }));

    return {
      salesByCategory,
      weeklySales,
      customerGrowth: [] as { month: string; customers: number; new: number }[],
    };
  }, [salesDashboard]);

  // Permission-filtered quick-create actions.
  const quickActions = useMemo(() => {
    const can = access.hasPermission;
    const items: { id: string; label: string; icon: LucideIcon; color: string; to?: string }[] = [];
    const add = (id: string, label: string, icon: LucideIcon, to: string, perms: string[]) => {
      if (perms.some((p) => can(p))) items.push({ id, label, icon, color: "primary", to });
    };
    add("invoice", "Create Invoice", ReceiptText, "/sales/invoices", ["invoice:create"]);
    add("customer", "Add Customer", Users, "/sales/customers", [
      "customer:create",
      "company:create",
    ]);
    add("lead", "Create Lead", UserPlus, "/crm/leads", ["lead:create"]);
    add("quotation", "Create Quotation", FileText, "/sales/quotations", ["quotation:create"]);
    add("product", "Add Product", Package, "/inventory/products", ["product:create"]);
    add("employee", "Create Employee", Briefcase, "/hrms/employees", ["employee:create"]);
    add("account", "New Account", Scale, "/accounting/chart-of-accounts", [
      "chart_of_account:create",
    ]);
    add("journal", "Journal Entry", FileText, "/accounting/journal-entries", [
      "journal_entry:create",
    ]);
    add("order", "Sales Order", ShoppingCart, "/sales/sales-orders", ["sales_order:create"]);
    return items;
  }, [access]);

  const handleAction = useCallback(
    (id: string) => {
      const action = quickActions.find((a) => a.id === id);
      if (action) {
        // Navigate handled by QuickActions via window.location for simplicity
      }
    },
    [quickActions],
  );

  return (
    <PageTransition>
      <div className="max-w-[1400px] mx-auto">
        <WelcomeHeader
          userName={user?.firstName ?? "User"}
          organization={user?.organization?.name ?? "ERPX"}
          notificationCount={unreadData?.count ?? 0}
          onAIAssistant={() => window.dispatchEvent(new Event("erpx:open-ai-copilot"))}
          onNotifications={() => {}}
        />
        <StaggerContainer className="space-y-8">
          <StaggerItem>
            {canSeeKpis && execError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Failed to load dashboard data.</span>
                <button
                  onClick={() => refetchExec()}
                  className="ml-auto flex items-center gap-1 text-xs font-medium hover:underline"
                >
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              </div>
            )}
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

          {!execLoading && canSeeKpis && hasTransactions && (
            <>
              <StaggerItem>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <AIInsightsPanel insights={insights} />
                  </div>
                  {canSeeAudit && (
                    <div>
                      <ActivityTimeline events={timelineEvents} />
                    </div>
                  )}
                </div>
              </StaggerItem>

              {canSeeAnalytics && (
                <StaggerItem>
                  <AnalyticsSection
                    revenueData={chartData ?? []}
                    salesByCategory={analytics.salesByCategory}
                    weeklySales={analytics.weeklySales}
                    customerGrowth={analytics.customerGrowth}
                  />
                </StaggerItem>
              )}

              {quickActions.length > 0 && (
                <StaggerItem>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                      <QuickActions actions={quickActions} onAction={handleAction} />
                    </div>
                  </div>
                </StaggerItem>
              )}
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
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight">Get set up in a few steps</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your organization has no transactions yet. Complete these steps to get started.
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SETUP_STEPS.map((step) => (
          <li key={step.title}>
            <Link
              to={step.to as never}
              className="group flex h-full items-start gap-3 rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <step.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{step.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {step.description}
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-16 text-center">
      <div className="text-base font-semibold">Welcome to ERPX</div>
      <p className="max-w-md text-sm text-muted-foreground">
        Your account has access to the dashboard. Widgets will appear as your permissions grant
        access to each module.
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
          <div className="h-3 w-20 bg-muted rounded mb-3" />
          <div className="h-7 w-28 bg-muted rounded mb-2" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}
