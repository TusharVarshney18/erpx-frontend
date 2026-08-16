import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AlertCircle, ArrowDownCircle, ArrowUpCircle, Scale } from "lucide-react";

export const Route = createFileRoute("/accounting/cash-flow")({
  head: () => ({ meta: [{ title: "Cash Flow — Acme ERP" }] }),
  component: CashFlowPage,
});

function CashFlowPage() {
  const { activeOrganizationId } = useAuth();
  const orgId = activeOrganizationId;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["cash-flow", orgId],
    queryFn: () => api.get<any>(`/accounting/organizations/${orgId}/reports/cash-flow`),
    enabled: !!orgId,
  });

  if (isLoading) return <div className="space-y-4"><PageHeader title="Cash Flow" /><Skeleton className="h-40 w-full" /><Skeleton className="h-80 w-full" /></div>;
  if (isError) return <div className="flex flex-col items-center gap-3 py-16 text-center"><AlertCircle className="h-10 w-10 text-destructive" /><button className="text-sm text-primary hover:underline" onClick={() => refetch()}>Retry</button></div>;

  const chart = (data?.monthly ?? []).map((m: any) => ({ month: m.month, Inflows: m.inflows, Outflows: m.outflows }));

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader title="Cash Flow" subtitle="From Bank and Cash ledger postings" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-success"><ArrowUpCircle className="h-4 w-4" /> Total Inflows</div><div className="text-xl font-bold">{(data?.inflows ?? 0).toLocaleString("en-IN")}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-destructive"><ArrowDownCircle className="h-4 w-4" /> Total Outflows</div><div className="text-xl font-bold">{(data?.outflows ?? 0).toLocaleString("en-IN")}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground"><Scale className="h-4 w-4" /> Net Cash Flow</div><div className="text-xl font-bold">{(data?.net ?? 0).toLocaleString("en-IN")}</div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Monthly Cash Flow</CardTitle></CardHeader>
        <CardContent className="h-[360px]">
          {chart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No cash/bank postings yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => `₹${(v / 100000).toFixed(2)}L`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Inflows" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Outflows" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
