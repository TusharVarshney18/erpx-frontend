import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/accounting/receivables")({
  head: () => ({ meta: [{ title: "Receivables & Payables — Acme ERP" }] }),
  component: ReceivablesPage,
});

type AgeingRow = { id: string; invoiceNumber: string; poNumber?: string; customer?: string; vendor?: string; amount: number; paid?: number; balanceDue?: number; dueDate: string; ageDays: number; bucket: string };

function AgeingTable({ data }: { data: AgeingRow[] }) {
  const bucketBadge: Record<string, string> = {
    current: "bg-success/15 text-success",
    "1-30": "bg-primary/15 text-primary",
    "31-60": "bg-warning/15 text-warning",
    "61-90": "bg-amber-600/15 text-amber-600",
    "90+": "bg-destructive/15 text-destructive",
  };
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reference</TableHead>
          <TableHead>Party</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Due</TableHead>
          <TableHead className="text-right">Age</TableHead>
          <TableHead>Bucket</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No outstanding items</TableCell></TableRow>
        ) : data.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">{r.invoiceNumber ?? r.poNumber}</TableCell>
            <TableCell>{r.customer ?? r.vendor ?? "—"}</TableCell>
            <TableCell className="text-right font-medium">{(r.balanceDue ?? r.amount).toLocaleString("en-IN")}</TableCell>
            <TableCell className="text-muted-foreground">{new Date(r.dueDate).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">{r.ageDays}d</TableCell>
            <TableCell><Badge variant="secondary" className={bucketBadge[r.bucket]}>{r.bucket}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function BucketCards({ buckets, total }: { buckets: Record<string, number>; total: number }) {
  const labels: [string, string][] = [["current", "Current"], ["1-30", "1–30 days"], ["31-60", "31–60 days"], ["61-90", "61–90 days"], ["90+", "90+ days"]];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Card><CardContent className="p-4"><div className="text-[11px] uppercase tracking-wide text-muted-foreground">Total Outstanding</div><div className="text-xl font-bold">{total.toLocaleString("en-IN")}</div></CardContent></Card>
      {labels.map(([k, label]) => (
        <Card key={k}><CardContent className="p-4"><div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div><div className="text-lg font-bold">{(buckets[k] ?? 0).toLocaleString("en-IN")}</div></CardContent></Card>
      ))}
    </div>
  );
}

function ReceivablesPage() {
  const { activeOrganizationId } = useAuth();
  const orgId = activeOrganizationId;

  const ar = useQuery({
    queryKey: ["ar-ageing", orgId],
    queryFn: () => api.get<any>(`/accounting/organizations/${orgId}/reports/receivables`),
    enabled: !!orgId,
  });
  const ap = useQuery({
    queryKey: ["ap-ageing", orgId],
    queryFn: () => api.get<any>(`/accounting/organizations/${orgId}/reports/payables`),
    enabled: !!orgId,
  });

  if (ar.isLoading || ap.isLoading) return <div className="space-y-4"><PageHeader title="Receivables & Payables" /><Skeleton className="h-40 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (ar.isError || ap.isError) return <div className="flex flex-col items-center gap-3 py-16 text-center"><AlertCircle className="h-10 w-10 text-destructive" /><Button onClick={() => { ar.refetch(); ap.refetch(); }}><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry</Button></div>;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader title="Receivables & Payables" subtitle="Bill-wise outstanding and ageing (AR / AP)" />
      <Tabs defaultValue="ar">
        <TabsList>
          <TabsTrigger value="ar">Accounts Receivable</TabsTrigger>
          <TabsTrigger value="ap">Accounts Payable</TabsTrigger>
        </TabsList>
        <TabsContent value="ar" className="mt-4 space-y-4">
          <BucketCards buckets={ar.data?.buckets ?? {}} total={ar.data?.totalOutstanding ?? 0} />
          <Card><CardContent className="p-0"><AgeingTable data={ar.data?.rows ?? []} /></CardContent></Card>
        </TabsContent>
        <TabsContent value="ap" className="mt-4 space-y-4">
          <BucketCards buckets={ap.data?.buckets ?? {}} total={ap.data?.totalOutstanding ?? 0} />
          <Card><CardContent className="p-0"><AgeingTable data={ap.data?.rows ?? []} /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
