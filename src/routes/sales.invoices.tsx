import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useAccess } from "@/hooks/useAccess";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Plus, MoreHorizontal, Pencil, Trash2, Send, Printer, Copy, RefreshCw, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { InvoiceEditor } from "@/components/invoices/InvoiceEditor";
import { InvoicePrint } from "@/components/invoices/InvoicePrint";

export const Route = createFileRoute("/sales/invoices")({
  head: () => ({ meta: [{ title: "Invoices - ERPX" }] }),
  component: InvoicesPage,
});

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-primary/15 text-primary",
  VIEWED: "bg-primary/15 text-primary",
  PARTIALLY_PAID: "bg-warning/15 text-warning",
  PAID: "bg-success/15 text-success",
  VOID: "bg-destructive/15 text-destructive",
};

const fmt = (v: unknown) => (Number(v ?? 0) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function InvoicesPage() {
  const qc = useQueryClient();
  const { activeOrganizationId } = useAuth();
  const access = useAccess();
  const orgId = activeOrganizationId;

  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [printData, setPrintData] = useState<any | null>(null);
  const [voidTarget, setVoidTarget] = useState<any | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [search, setSearch] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["org-settings", orgId],
    queryFn: () => api.get<any>(`/organizations/${orgId}/settings`),
    enabled: !!orgId,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["invoices", orgId, search],
    queryFn: () =>
      api.get<any>(`/sales/organizations/${orgId}/invoices`, {
        params: { limit: "50", ...(search ? { search } : {}) },
        keepMeta: true,
      }),
    enabled: !!orgId,
  });
  const list: any[] = (data as any)?.data ?? [];
  const meta = (data as any)?.meta;

  const canCreate = access.canAny(["invoice:create"]);
  const canUpdate = access.canAny(["invoice:update"]);
  const canSend = access.canAny(["invoice:send", "invoice:update"]);
  const canDelete = access.canAny(["invoice:delete"]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["invoices", orgId] });

  const sendMut = useMutation({
    mutationFn: (id: string) => api.post(`/sales/organizations/${orgId}/invoices/${id}/send`),
    onSuccess: () => { invalidate(); toast.success("Invoice posted to ledger"); },
    onError: (e: any) => toast.error(e.message ?? "Send failed"),
  });
  const duplicateMut = useMutation({
    mutationFn: (id: string) => api.post(`/sales/organizations/${orgId}/invoices/${id}/duplicate`),
    onSuccess: () => { invalidate(); toast.success("Invoice duplicated"); },
    onError: (e: any) => toast.error(e.message ?? "Duplicate failed"),
  });
  const voidMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/sales/organizations/${orgId}/invoices/${id}/void`, { reason: reason || undefined }),
    onSuccess: () => { invalidate(); toast.success("Invoice voided"); setVoidTarget(null); setVoidReason(""); },
    onError: (e: any) => toast.error(e.message ?? "Void failed"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/sales/organizations/${orgId}/invoices/${id}`),
    onSuccess: () => { invalidate(); toast.success("Invoice deleted"); },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  const openPrint = async (id: string) => {
    try {
      const res = await api.get<any>(`/sales/organizations/${orgId}/invoices/${id}/print`);
      setPrintData(res);
    } catch (e: any) {
      toast.error(e.message ?? "Could not load print data");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Sales Invoices"
        subtitle="GST tax invoices with line items, CGST/SGST or IGST, and Tally-style print"
        actions={
          canCreate ? (
            <Button size="sm" className="gradient-primary text-white" onClick={() => { setEditId(null); setEditorOpen(true); }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New Invoice
            </Button>
          ) : undefined
        }
      />

      <div className="flex items-center gap-2">
        <Input className="h-9 max-w-sm" placeholder="Search invoice number..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button variant="outline" size="sm" className="h-9" onClick={() => refetch()}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">No invoices yet</p>
              <p className="text-sm text-muted-foreground">Create your first GST invoice.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Taxable</TableHead>
                  <TableHead className="text-right">GST</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-sm">{inv.company?.name ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(inv.issueDate).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(inv.taxableAmount)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(Number(inv.totalCgst) + Number(inv.totalSgst) + Number(inv.totalIgst) + Number(inv.totalCess))}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">{fmt(inv.grandTotal)}</TableCell>
                    <TableCell><Badge variant="secondary" className={STATUS_BADGE[inv.status] ?? ""}>{inv.status}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openPrint(inv.id)}><Printer className="mr-2 h-3.5 w-3.5" /> Print / Preview</DropdownMenuItem>
                          {canUpdate && inv.status === "DRAFT" && (
                            <DropdownMenuItem onClick={() => { setEditId(inv.id); setEditorOpen(true); }}><Pencil className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                          )}
                          {canSend && inv.status === "DRAFT" && (
                            <DropdownMenuItem onClick={() => sendMut.mutate(inv.id)}><Send className="mr-2 h-3.5 w-3.5" /> Send &amp; Post</DropdownMenuItem>
                          )}
                          {canCreate && (
                            <DropdownMenuItem onClick={() => duplicateMut.mutate(inv.id)}><Copy className="mr-2 h-3.5 w-3.5" /> Duplicate</DropdownMenuItem>
                          )}
                          {canUpdate && inv.status !== "VOID" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => setVoidTarget(inv)}>Void</DropdownMenuItem>
                            </>
                          )}
                          {canDelete && (
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteMut.mutate(inv.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {meta && meta.total > 0 && (
        <div className="text-sm text-muted-foreground">{meta.total} invoice{meta.total === 1 ? "" : "s"}</div>
      )}

      <InvoiceEditor
        open={editorOpen}
        onOpenChange={(o) => { setEditorOpen(o); if (!o) setEditId(null); }}
        orgId={orgId ?? ""}
        invoiceId={editId}
        sellerStateCode={settings?.stateCode}
        onSaved={() => invalidate()}
      />

      {printData && (
        <InvoicePrint
          data={printData}
          initialFormat={(printData.invoice?.printFormat as any) ?? "VERTICAL"}
          onClose={() => setPrintData(null)}
        />
      )}

      <AlertDialog open={!!voidTarget} onOpenChange={(o) => { if (!o) { setVoidTarget(null); setVoidReason(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void invoice {voidTarget?.invoiceNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              Voiding does not reverse a posted invoice yet. Provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input placeholder="Reason" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => voidTarget && voidMut.mutate({ id: voidTarget.id, reason: voidReason })}>
              {voidMut.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null} Void
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
