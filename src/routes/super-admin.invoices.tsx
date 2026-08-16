import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { RequireSuperAdmin } from "@/components/guards/RequireSuperAdmin";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Search, AlertCircle, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/super-admin/invoices")({
  head: () => ({ meta: [{ title: "Invoices — Super Admin — Acme ERP" }] }),
  component: () => (
    <RequireSuperAdmin>
      <SuperAdminInvoices />
    </RequireSuperAdmin>
  ),
});

type Invoice = {
  id: string;
  invoiceNumber: string;
  amount: number;
  totalAmount: number;
  currency: string;
  status: string;
  dueAt: string | null;
  paidAt: string | null;
  createdAt: string;
  organization: { id: string; name: string; code: string } | null;
};

const STATUS_VARIANT: Record<string, string> = {
  PAID: "default",
  ISSUED: "default",
  DRAFT: "secondary",
  OVERDUE: "destructive",
  CANCELED: "secondary",
  REFUNDED: "secondary",
};

function SuperAdminInvoices() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["super-admin-invoices", page, search],
    queryFn: () =>
      api.get<{ data: Invoice[]; meta: { total: number; page: number; totalPages: number } }>("/super-admin/invoices", {
        params: { page: String(page), limit: "25", search },
      }),
  });

  const invoices = data?.data ?? [];
  const meta = data?.meta;

  const fmt = (n: number, c: string) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: c || "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader title="Invoices" subtitle="All platform billing invoices" />

      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-9 pl-9" placeholder="Search invoice number or org…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="font-semibold">Failed to load invoices</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry</Button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground"><FileText className="mx-auto mb-2 h-6 w-6" />No invoices found</TableCell></TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell className="text-sm">{inv.organization?.name ?? "—"}</TableCell>
                      <TableCell className="font-medium">{fmt(inv.totalAmount ?? inv.amount, inv.currency)}</TableCell>
                      <TableCell>
                        <Badge variant={(STATUS_VARIANT[inv.status] ?? "secondary") as any} className="text-[10px]">{inv.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {inv.paidAt
                          ? `Paid ${new Date(inv.paidAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}`
                          : inv.dueAt
                            ? new Date(inv.dueAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
                            : "—"}
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
          <span>{meta.total} invoices</span>
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
