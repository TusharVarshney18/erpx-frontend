import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "@/lib/api/client";
import { RequireSuperAdmin } from "@/components/guards/RequireSuperAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  CreditCard,
  DollarSign,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Database,
  MemoryStick,
  Wallet,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

export const Route = createFileRoute("/super-admin/dashboard")({
  head: () => ({ meta: [{ title: "Super Admin Dashboard — ERPX" }] }),
  component: () => (
    <RequireSuperAdmin>
      <SuperAdminDashboard />
    </RequireSuperAdmin>
  ),
});

type GroupedCount = {
  [key: string]: string | number;
} & { _count: number };

type Stats = {
  organizations: {
    total: number;
    byStatus: GroupedCount[];
    byPlan: GroupedCount[];
  };
  users: { total: number; active: number };
  payments: { total: number; today: number; thisMonth: number; failed: number };
  revenue: { total: number; net: number; fees: number; mrr: number; arr: number };
};

type GrowthPoint = {
  createdAt: string;
  _sum: { amount: number } | null;
};

type Growth = {
  organizations: { total: number; thisMonth: number; previousMonth: number; growthPercent: number };
  users: { total: number; thisMonth: number; previousMonth: number; growthPercent: number };
  revenue: { total: number; thisMonth: number; previousMonth: number; growthPercent: number };
  subscriptions: { active: number };
  monthlyRevenue: GrowthPoint[];
};

type HealthStatus = {
  status: string;
  timestamp: string;
  uptime: number;
  uptimeHuman: string;
  responseTime: number;
  database: { status: string; latency: number };
  system: {
    memory: { heapUsed: number; heapTotal: number; rss: number };
    nodeVersion: string;
    platform: string;
  };
  counts: { organizations: number; users: number; activeSubscriptions: number };
};

function SuperAdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["super-admin-stats"],
    queryFn: () => api.get<Stats>("/super-admin/dashboard/stats"),
  });

  const { data: growth, isLoading: growthLoading } = useQuery({
    queryKey: ["super-admin-growth"],
    queryFn: () => api.get<Growth>("/super-admin/dashboard/growth"),
  });

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["super-admin-health"],
    queryFn: () => api.get<HealthStatus>("/super-admin/health"),
  });

  const chartData = useMemo(
    () =>
      (growth?.monthlyRevenue ?? []).map((m) => ({
        date: new Date(m.createdAt).toISOString(),
        revenue: m._sum?.amount ?? 0,
      })),
    [growth],
  );

  const kpis = [
    {
      label: "Total Organizations",
      value: stats?.organizations.total,
      icon: Building2,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Total Users",
      value: stats?.users.total,
      icon: Users,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      label: "Active Subscriptions",
      value: growth?.subscriptions.active,
      icon: CreditCard,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
    },
    {
      label: "Monthly Revenue",
      value: stats?.revenue.mrr,
      icon: DollarSign,
      prefix: "₹",
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
    },
  ];

  const growthChips = [
    { label: "Organizations", percent: growth?.organizations.growthPercent },
    { label: "Users", percent: growth?.users.growthPercent },
    { label: "Revenue", percent: growth?.revenue.growthPercent },
  ];

  const databaseServices = health
    ? [
        {
          name: "Database",
          status: health.database.status === "connected" ? "healthy" : "unhealthy",
          latency: health.database.latency,
        },
      ]
    : [];

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Super Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Platform-wide overview and system health.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                {statsLoading && kpi.value === undefined ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {kpi.label}
                      </p>
                      <p className="text-2xl font-bold">
                        {kpi.prefix ?? ""}
                        {kpi.value?.toLocaleString("en-IN") ?? "—"}
                      </p>
                    </div>
                    <div className={`grid place-items-center rounded-xl p-2.5 ${kpi.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {growthLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : chartData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No revenue data available.
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => format(new Date(v), "MMM dd")}
                    />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      labelFormatter={(v) => format(new Date(v), "MMM dd, yyyy")}
                      formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      fill="url(#revenue)"
                      strokeWidth={2}
                      name="Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !health ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center text-sm text-muted-foreground">
                <AlertTriangle className="h-8 w-8" />
                <p>Health data unavailable.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Overall</span>
                  </div>
                  <Badge
                    variant={health.status === "healthy" ? "default" : "destructive"}
                    className={
                      health.status === "healthy"
                        ? "bg-success/15 text-success"
                        : ""
                    }
                  >
                    {health.status === "healthy" ? "Healthy" : health.status === "degraded" ? "Degraded" : "Unhealthy"}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Uptime: {health.uptimeHuman}</p>
                  <p>Response: {health.responseTime}ms</p>
                  <p>Node: {health.system.nodeVersion}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Services
                  </p>
                  {databaseServices.map((svc) => (
                    <div
                      key={svc.name}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        {svc.status === "healthy" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
                        )}
                        <Database className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{svc.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {svc.latency}ms
                      </span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-border px-3 py-2">
                    <p className="text-muted-foreground">Heap Used</p>
                    <p className="font-medium">
                      <MemoryStick className="mr-1 inline h-3.5 w-3.5" />
                      {health.system.memory.heapUsed} MB
                    </p>
                  </div>
                  <div className="rounded-lg border border-border px-3 py-2">
                    <p className="text-muted-foreground">Active Subscriptions</p>
                    <p className="font-medium">{health.counts.activeSubscriptions}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Growth This Month</CardTitle>
          </CardHeader>
          <CardContent>
            {growthLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {growthChips.map((chip) => (
                  <div
                    key={chip.label}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{chip.label}</span>
                    </div>
                    {chip.percent !== undefined ? (
                      <span className="text-sm font-semibold">
                        {chip.percent > 0 ? "+" : ""}
                        {chip.percent}%
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Payments & Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border p-4">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Wallet className="h-3.5 w-3.5" /> Payments
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold">{stats?.payments.total?.toLocaleString("en-IN") ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Today</p>
                      <p className="font-semibold">{stats?.payments.today?.toLocaleString("en-IN") ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">This Month</p>
                      <p className="font-semibold">{stats?.payments.thisMonth?.toLocaleString("en-IN") ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Failed</p>
                      <p className="font-semibold text-destructive">{stats?.payments.failed?.toLocaleString("en-IN") ?? "—"}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" /> Revenue
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold">₹{stats?.revenue.total?.toLocaleString("en-IN") ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Net</p>
                      <p className="font-semibold">₹{stats?.revenue.net?.toLocaleString("en-IN") ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">MRR</p>
                      <p className="font-semibold">₹{stats?.revenue.mrr?.toLocaleString("en-IN") ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ARR</p>
                      <p className="font-semibold">₹{stats?.revenue.arr?.toLocaleString("en-IN") ?? "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
