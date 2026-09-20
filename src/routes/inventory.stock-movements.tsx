import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
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
import { ArrowDown, ArrowUp, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/inventory/stock-movements")({
  head: () => ({ meta: [{ title: "Stock Movements — Acme ERP" }] }),
  component: StockMovementsPage,
});

type StockLedgerEntry = {
  id: string;
  transactionType: string;
  referenceType: string;
  referenceId: string | null;
  quantity: number;
  previousQty: number;
  newQty: number;
  createdAt: string;
  product?: { id: string; name: string; sku: string } | null;
  warehouse?: { id: string; name: string; code: string } | null;
};

const TYPE_BADGE: Record<string, string> = {
  PURCHASE: "bg-success/15 text-success",
  SALE: "bg-primary/15 text-primary",
  TRANSFER_IN: "bg-info/15 text-info",
  TRANSFER_OUT: "bg-warning/15 text-warning",
  ADJUSTMENT: "bg-muted text-muted-foreground",
  RETURN: "bg-warning/15 text-warning",
  RESERVATION: "bg-muted text-muted-foreground",
  RELEASE: "bg-muted text-muted-foreground",
};

function StockMovementsPage() {
  const { activeOrganizationId } = useAuth();
  const orgId = activeOrganizationId;
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["stock-ledger", orgId, page],
    queryFn: () =>
      api.get<{ data: StockLedgerEntry[]; meta: { total: number } }>(
        `/inventory/organizations/${orgId}/stock/ledger`,
        { params: { page: String(page), limit: String(pageSize) }, keepMeta: true },
      ),
    enabled: !!orgId,
  });

  const rows = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <PageHeader
        title="Stock Movements"
        subtitle={`${total.toLocaleString("en-IN")} entr${total === 1 ? "y" : "ies"}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">
              No stock movements recorded yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(m.createdAt).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={TYPE_BADGE[m.transactionType]}>
                        {m.transactionType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{m.product?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{m.product?.sku ?? ""}</div>
                    </TableCell>
                    <TableCell className="text-sm">{m.warehouse?.name ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          m.quantity >= 0
                            ? "text-success inline-flex items-center gap-1"
                            : "text-destructive inline-flex items-center gap-1"
                        }
                      >
                        {m.quantity >= 0 ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                        {Math.abs(m.quantity)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{m.newQty}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {m.referenceType}
                      {m.referenceId ? ` · ${m.referenceId.slice(0, 8)}` : ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
