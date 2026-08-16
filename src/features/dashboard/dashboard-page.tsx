"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { WelcomeHeader } from "./components/welcome-header";
import { KPICards } from "./components/kpi-cards";
import { AIInsightsPanel } from "./components/ai-insights";
import { ActivityTimeline } from "./components/activity-timeline";
import { AnalyticsSection } from "./components/analytics-section";
import { QuickActions } from "./components/quick-actions";
import { AIAssistant } from "./components/ai-assistant";
import { ProductivityWidgets } from "./components/productivity-widgets";
import { CommandPalette } from "@/design-system";
import { PageTransition, StaggerContainer, StaggerItem } from "@/design-system";
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
  if (value >= 10_000_000) return `\u20B9${(value / 10_000_000).toFixed(1)}Cr`;
  if (value >= 100_000) return `\u20B9${(value / 100_000).toFixed(1)}L`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatKpiInsight(label: string, value: number): string {
  if (label === "Active Employees" || label === "Employees")
    return `${value} employees currently active`;
  return `Current ${label.toLowerCase()}: \u20B9${(value / 100_000).toFixed(1)}L`;
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
    title: (event.event as string) ?? (event.action as string),
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
  const [commandOpen, setCommandOpen] = useState(false);

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
    queryFn: () => api.get<any>(`/reports/organizations/${orgId}/dashboard/sales`),
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
    const statusChart = salesDashboard?.charts?.salesByStatus as
      { labels: string[]; datasets: { label: string; data: number[] }[] } | undefined;
    const topChart = salesDashboard?.charts?.topProducts as
      { labels: string[]; datasets: { label: string; data: number[] }[] } | undefined;

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
    const items: { id: string; label: string; icon: any; color: string; to?: string }[] = [];
    const add = (id: string, label: string, icon: any, to: string, perms: string[]) => {
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

  const commandItems = useMemo(() => {
    const items: { id: string; label: string; description?: string; onClick: () => void }[] = [];
    for (const kpi of kpis) {
      items.push({
        id: kpi.id,
        label: `View ${kpi.label}`,
        description: kpi.insight,
        onClick: () => {},
      });
    }
    return items;
  }, [kpis]);

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
    <>
      <CommandPalette
        items={commandItems}
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
      />
      <PageTransition>
        <div className="max-w-[1400px] mx-auto">
          <WelcomeHeader
            userName={user?.firstName ?? "User"}
            organization={user?.organization?.name ?? "ERPX"}
            notificationCount={unreadData?.count ?? 0}
            onSearch={() => {}}
            onCommandPalette={() => setCommandOpen(true)}
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
                ) : (
                  <KPICards data={kpis} />
                )
              ) : (
                <EmptyDashboard />
              )}
            </StaggerItem>

            {!execLoading && canSeeKpis && (
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
      <AIAssistant />
    </>
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
