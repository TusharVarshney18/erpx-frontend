import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useAccess } from "@/hooks/useAccess";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Power, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Ledger } from "@/components/accounting/ledger-types";
import { LedgerFormModal } from "@/components/accounting/LedgerFormModal";

export const Route = createFileRoute("/accounting/chart-of-accounts")({
  head: () => ({ meta: [{ title: "Chart of Accounts � Acme ERP" }] }),
  component: ChartOfAccountsPage,
});

const TYPE_BADGE: Record<string, string> = {
  ASSET: "bg-primary/15 text-primary",
  LIABILITY: "bg-warning/15 text-warning",
  EQUITY: "bg-success/15 text-success",
  REVENUE: "bg-info/15 text-info",
  EXPENSE: "bg-destructive/15 text-destructive",
};

function ChartOfAccountsPage() {
  const qc = useQueryClient();
  const { activeOrganizationId } = useAuth();
  const access = useAccess();
  const orgId = activeOrganizationId;

  const canCreate = access.canAny(["chart_of_account:create"]);
  const canUpdate = access.canAny(["chart_of_account:update"]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Ledger | null>(null);
  const [deactivating, setDeactivating] = useState<Ledger | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ledgers", orgId, search, page],
    queryFn: () =>
      api.get<{ data: Ledger[]; meta: { total: number } }>(
        `/accounting/organizations/${orgId}/chart-of-accounts`,
        {
          params: {
            search,
            page: String(page),
            limit: String(pageSize),
            sortBy: "accountCode",
            sortOrder: "asc",
          },
          keepMeta: true,
        },
      ),
    enabled: !!orgId,
  });

  const rows = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const deactivate = useMutation({
    mutationFn: (ledger: Ledger) =>
      api.patch(`/accounting/organizations/${orgId}/chart-of-accounts/${ledger.id}/deactivate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ledgers", orgId] });
      toast.success("Ledger deactivated");
      setDeactivating(null);
    },
    onError: (e: unknown) => toast.error((e as Error)?.message ?? "Deactivate failed"),
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <PageHeader
        title="Chart of Accounts"
        subtitle={`${total.toLocaleString("en-IN")} ledger${total === 1 ? "" : "s"}`}
        actions={
          canCreate ? (
            <Button
              size="sm"
              className="gradient-primary text-white"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New Ledger
            </Button>
          ) : undefined
        }
      />

      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or code�"
            className="h-9 border-0 bg-muted/50 pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">
              No ledgers found. Create your first ledger to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Ledger Name</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Opening</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.accountCode}</TableCell>
                    <TableCell className="font-medium">{l.accountName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {l.accountGroup?.name ?? "�"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={TYPE_BADGE[l.accountType]}>
                        {l.accountType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(l.openingBalance || 0).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      {l.isActive ? (
                        <span className="text-success">Active</span>
                      ) : (
                        <span className="text-muted-foreground">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Edit ledger"
                            onClick={() => {
                              setEditing(l);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canUpdate && l.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            aria-label="Deactivate ledger"
                            onClick={() => setDeactivating(l)}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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

      <LedgerFormModal
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        orgId={orgId}
        initial={editing}
        onSaved={() => qc.invalidateQueries({ queryKey: ["ledgers", orgId] })}
      />

      <AlertDialog open={!!deactivating} onOpenChange={(o) => !o && setDeactivating(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate ledger?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deactivating?.accountName}</strong> will be hidden from new postings. Its
              history is kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deactivating && deactivate.mutate(deactivating)}
            >
              {deactivate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
