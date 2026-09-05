import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { RequireSuperAdmin } from "@/components/guards/RequireSuperAdmin";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, AlertCircle, RefreshCw, Wallet, TrendingUp, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/super-admin/payments")({
  head: () => ({ meta: [{ title: "Payments — Super Admin — Acme ERP" }] }),
  component: () => (
    <RequireSuperAdmin>
      <SuperAdminPayments />
    </RequireSuperAdmin>
  ),
});

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  providerPaymentId: string | null;
  paidAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  createdAt: string;
  organization: { id: string; name: string; code: string } | null;
};

const STATUS_VARIANT: Record<string, string> = {
  SUCCEEDED: "default",
  PENDING: "secondary",
  FAILED: "destructive",
  REFUNDED: "secondary",
  PARTIALLY_REFUNDED: "secondary",
};

function SuperAdminPayments() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["super-admin-payments", page],
    queryFn: () =>
      api.get<{ data: Payment[]; meta: { total: number; page: number; totalPages: number } }>("/super-admin/payments", {
        params: { page: String(page), limit: "25" },
        keepMeta: true,
      }),
  });

  const revenue = useQuery({
    queryKey: ["super-admin-revenue"],
    queryFn: () => api.get<{ totalRevenue: number; totalNetRevenue: number; totalFees: number; transactionCount: number }>("/super-admin/payments/revenue"),
  });

  const mrr = useQuery({
    queryKey: ["super-admin-mrr"],
    queryFn: () => api.get<{ mrr: number; subscriptionCount: number }>("/super-admin/payments/mrr"),
  });

  const arr = useQuery({
    queryKey: ["super-admin-arr"],
    queryFn: () => api.get<{ arr: number; monthlyMrr: number; subscriptionCount: number }>("/super-admin/payments/arr"),
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const payments = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader title="Payments" subtitle="Platform payment & revenue overview" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle><Wallet className="h-4 w-4 text-primary" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(revenue.data?.totalRevenue ?? 0)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Net Revenue</CardTitle><TrendingUp className="h-4 w-4 text-success" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(revenue.data?.totalNetRevenue ?? 0)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle><TrendingUp className="h-4 w-4 text-primary" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(mrr.data?.mrr ?? 0)}</p><p className="text-xs text-muted-foreground">{mrr.data?.subscriptionCount ?? 0} active subs</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">ARR</CardTitle><TrendingDown className="h-4 w-4 text-success" /></CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(arr.data?.arr ?? 0)}</p></CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="font-semibold">Failed to load payments</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry</Button>
        </div>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">All Payments</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground"><CreditCard className="mx-auto mb-2 h-6 w-6" />No payments yet</TableCell></TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{p.organization?.name ?? "—"}</TableCell>
                      <TableCell className="font-medium">{fmt(p.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={(STATUS_VARIANT[p.status] ?? "secondary") as any} className="text-[10px]">{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm capitalize">{p.provider}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : new Date(p.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{meta.total} payments</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="px-2 py-1.5">Page {meta.page} of {meta.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
