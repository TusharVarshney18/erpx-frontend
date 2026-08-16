import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/inventory/low-stock")({
  head: () => ({ meta: [{ title: "Low Stock — Acme ERP" }] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const orgId = user?.organization.id;

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["low-stock", orgId],
    queryFn: async () => {
      const [products, stock] = await Promise.all([
        api.get<any[]>(`/business-data/organizations/${orgId}/products`),
        api.get<any[]>(`/business-data/organizations/${orgId}/stock`),
      ]);
      const productMap = new Map(products.map((p: any) => [p.id, p]));
      return stock
        .filter((s: any) => s.reorderLevel > 0 && s.availableQty <= s.reorderLevel)
        .map((s: any) => ({
          ...s,
          productSku: productMap.get(s.productId)?.sku ?? "--",
          productName: productMap.get(s.productId)?.name ?? "--",
        }));
    },
    enabled: !!orgId,
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Low Stock Alerts"
        subtitle={`${data.length} item${data.length === 1 ? "" : "s"} at or below reorder level`}
      />
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold">Failed to load stock data</div>
              <p className="text-sm text-muted-foreground">{(error as Error)?.message ?? "Unknown error"}</p>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-success/10 text-success">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold">All stock levels healthy</div>
              <p className="text-sm text-muted-foreground">Nothing is below reorder level.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse ID</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right">Reorder Lvl</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.productSku}</TableCell>
                    <TableCell className="font-medium">{s.productName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.warehouseId?.slice(0, 8)}</TableCell>
                    <TableCell className="text-right">{s.availableQty}</TableCell>
                    <TableCell className="text-right">{s.reorderLevel}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-destructive/15 text-destructive">
                        Reorder
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
