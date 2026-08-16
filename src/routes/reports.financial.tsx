import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Download, TrendingUp, IndianRupee, Percent, Wallet, AlertCircle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageShell";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api/client";

export const Route = createFileRoute("/reports/financial")({
  head: () => ({ meta: [{ title: "Financial Reports — Acme ERP" }] }),
  component: () => (
    <PremiumGate feature="advancedReports">
      <Page />
    </PremiumGate>
  ),
});

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-muted-foreground)",
];

type ExecutiveDashboard = {
  kpis: { label: string; value: number; change: number; trend: string }[];
  charts: {
    revenueTrend: { labels: string[]; datasets: { label: string; data: number[] }[] };
  };
};

type ProfitLoss = {
  revenues: { accounts: { accountCode: string; accountName: string; balance: number }[]; total: number };
  expenses: { accounts: { accountCode: string; accountName: string; balance: number }[]; total: number };
  netProfit: number;
};

function Page() {
  const { activeOrganizationId } = useAuth();
  const orgId = activeOrganizationId;

  const exec = useQuery({
    queryKey: ["report-financial-exec", orgId],
    queryFn: () => api.get<ExecutiveDashboard>(`/reports/organizations/${orgId}/dashboard/executive`),
    enabled: !!orgId,
  });

  const pnl = useQuery({
    queryKey: ["report-financial-pnl", orgId],
    queryFn: () => api.get<ProfitLoss>(`/reports/organizations/${orgId}/profit-loss`),
    enabled: !!orgId,
  });

  const loading = exec.isLoading || pnl.isLoading;
  const error = exec.isError || pnl.isError;

  const kpis = exec.data?.kpis ?? [];
  const revenueTrend = exec.data?.charts?.revenueTrend;
  const profitData = pnl.data
    ? pnl.data.revenues.accounts
        .map((r) => ({ m: r.accountName, profit: r.balance }))
        .concat(pnl.data.expenses.accounts.map((e) => ({ m: e.accountName, profit: -e.balance })))
    : [];
  const expenseBreakdown = pnl.data?.expenses.accounts.map((e) => ({
    name: e.accountName,
    value: e.balance,
  })) ?? [];

  const fmtINR = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

  const kpiCards = [
    { l: "Revenue", v: fmtINR(kpis.find((k) => k.label === "Revenue")?.value ?? 0), i: IndianRupee },
    {
      l: "Net Profit",
      v: fmtINR(pnl.data?.netProfit ?? 0),
      i: TrendingUp,
      delta: pnl.data?.netProfit && pnl.data.netProfit < 0 ? "-" : "+",
    },
    {
      l: "Revenue — Expenses",
      v: `${((pnl.data?.revenues.total ?? 0) - (pnl.data?.expenses.total ?? 0)).toLocaleString("en-IN")}`,
      i: Percent,
    },
    {
      l: "Outstanding Invoices",
      v: fmtINR(kpis.find((k) => k.label === "Outstanding Invoices")?.value ?? 0),
      i: Wallet,
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Financial Reports"
        subtitle="P&L, expenses, revenue trend and key ratios"
        actions={
          <Button variant="outline" size="sm" disabled>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export PDF
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
          <Skeleton className="h-[280px] w-full rounded-xl" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="font-semibold">Failed to load financial reports</p>
          <p className="text-sm text-muted-foreground">Post journal entries to see your P&amp;L.</p>
          <Button variant="outline" size="sm" onClick={() => { exec.refetch(); pnl.refetch(); }}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      ) : kpis.length === 0 && !pnl.data ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Wallet className="h-8 w-8 text-muted-foreground" />
          <p className="font-semibold">No financial data yet</p>
          <p className="text-sm text-muted-foreground">Post journal entries to generate financial reports.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {kpiCards.map((s) => (
              <Card key={s.l}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                      <s.i className="h-4 w-4" />
                    </div>
                    {s.delta && (
                      <Badge variant="secondary" className={s.delta === "-" ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}>
                        {s.delta}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">{s.l}</div>
                  <div className="truncate text-xl font-bold">{s.v}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(revenueTrend?.labels ?? []).map((l, i) => ({ m: l, revenue: revenueTrend?.datasets?.[0]?.data?.[i] ?? 0 }))}>
                    <defs>
                      <linearGradient id="gProf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                    <Tooltip
                      contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => `₹${(v / 100000).toFixed(2)} L`}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="var(--color-success)" strokeWidth={2} fill="url(#gProf)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Expense Breakdown</CardTitle>
                <CardDescription>By expense account</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                {expenseBreakdown.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No expenses recorded</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                        {expenseBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number) => `₹${(v / 100000).toFixed(1)}L`}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profit &amp; Loss by Account</CardTitle>
              <CardDescription>Revenue and expenses per account</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              {profitData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No posted journal entries yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                    <Tooltip
                      contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => `₹${(v / 100000).toFixed(2)} L`}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="profit" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
