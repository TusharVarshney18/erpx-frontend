import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  listWithMeta,
  bankingPath,
  type BankAccount,
  type BankStatement,
} from "@/lib/api/banking";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageShell";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  RefreshCw,
  Loader2,
  Inbox,
  AlertCircle,
  CalendarRange,
} from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@/components/banking/pagination";
import { formatMoney, formatDate } from "@/components/banking/format";

export const Route = createFileRoute("/banking/statements")({
  head: () => ({ meta: [{ title: "Bank Statements — Acme ERP" }] }),
  component: () => (
    <PremiumGate feature="banking">
      <Page />
    </PremiumGate>
  ),
});

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function Page() {
  const qc = useQueryClient();
  const { user, activeOrganizationId } = useAuth();
  const orgId = activeOrganizationId || user?.organization.id || null;

  const [accountId, setAccountId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [genOpen, setGenOpen] = useState(false);

  const basePath = orgId ? bankingPath(orgId) : "";

  const accountsQuery = useQuery<BankAccount[]>({
    queryKey: ["banking-accounts-select", orgId],
    queryFn: async () => {
      const res = await listWithMeta<BankAccount>(`${basePath}/accounts`, { limit: "100" });
      return res.data;
    },
    enabled: !!orgId,
  });
  const accounts = accountsQuery.data ?? [];
  const selectedAccount = accounts.find((a) => a.id === accountId);

  const statementsKey = useMemo(
    () => ["banking-statements", orgId, accountId, page, pageSize],
    [orgId, accountId, page, pageSize],
  );

  const statementsQuery = useQuery({
    queryKey: statementsKey,
    queryFn: async () => {
      const params: Record<string, string> = { page: String(page), limit: String(pageSize) };
      return listWithMeta<BankStatement>(`${basePath}/accounts/${accountId}/statements`, params);
    },
    enabled: !!orgId && !!accountId,
  });

  const statements = statementsQuery.data?.data ?? [];
  const total = statementsQuery.data?.meta.total ?? 0;
  const totalPages = statementsQuery.data?.meta.totalPages ?? 1;

  const generate = useMutation({
    mutationFn: async (values: { startDate: string; endDate: string }) =>
      api.post(`${basePath}/accounts/${accountId}/statements/generate`, values),
    onSuccess: () => {
      toast.success("Statement generated");
      setGenOpen(false);
      qc.invalidateQueries({ queryKey: ["banking-statements"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to generate statement"),
  });

  const selectAccount = (id: string) => {
    setAccountId(id);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        title="Bank Statements"
        subtitle="Review generated statements per account"
        actions={
          <Button
            size="sm"
            className="gradient-primary text-white"
            onClick={() => setGenOpen(true)}
            disabled={!accountId}
          >
            <CalendarRange className="mr-1.5 h-3.5 w-3.5" /> Generate Statement
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <Select value={accountId} onValueChange={selectAccount}>
          <SelectTrigger className="h-9 w-64">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.accountName} — {a.bankName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => statementsQuery.refetch()}
          disabled={!accountId || statementsQuery.isFetching}
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${statementsQuery.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {!accountId ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <FileText className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold">Select an account</div>
              <p className="max-w-md text-sm text-muted-foreground">
                Choose a bank account above to view its statements.
              </p>
            </div>
          ) : statementsQuery.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : statementsQuery.error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold">Failed to load statements</div>
              <p className="max-w-md text-sm text-muted-foreground">
                {(statementsQuery.error as Error)?.message ?? "Unknown error"}
              </p>
              <Button size="sm" variant="outline" onClick={() => statementsQuery.refetch()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : statements.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <FileText className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold">No statements yet</div>
              <p className="max-w-md text-sm text-muted-foreground">
                Generate a statement for {selectedAccount?.accountName} to see opening and closing
                balances.
              </p>
              <Button
                size="sm"
                className="gradient-primary text-white"
                onClick={() => setGenOpen(true)}
              >
                <CalendarRange className="mr-1.5 h-3.5 w-3.5" /> Generate Statement
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Opening</TableHead>
                  <TableHead className="text-right">Closing</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="text-right">Debits</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statements.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap font-medium">
                      {formatDate(s.periodStart)} — {formatDate(s.periodEnd)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(s.openingBalance, selectedAccount?.currency)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(s.closingBalance, selectedAccount?.currency)}
                    </TableCell>
                    <TableCell className="text-right text-success">
                      +{formatMoney(s.totalCredits, selectedAccount?.currency)}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      −{formatMoney(s.totalDebits, selectedAccount?.currency)}
                    </TableCell>
                    <TableCell className="text-right">{s.transactionCount}</TableCell>
                    <TableCell className="capitalize">{s.source}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {total > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
      )}

      <GenerateStatementDialog
        open={genOpen}
        accountName={selectedAccount?.accountName}
        busy={generate.isPending}
        onClose={() => setGenOpen(false)}
        onSubmit={(values) => generate.mutate(values)}
      />
    </div>
  );
}

function GenerateStatementDialog({
  open,
  accountName,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean;
  accountName?: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: { startDate: string; endDate: string }) => void;
}) {
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError("Both dates are required");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date must be on or before end date");
      return;
    }
    setError("");
    onSubmit({ startDate, endDate });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Statement</DialogTitle>
          <DialogDescription>
            {accountName
              ? `Generate a statement for ${accountName}.`
              : "Select an account and generate its statement."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="space-y-1.5">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy} className="gradient-primary text-white">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {busy ? "Generating\u2026" : "Generate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
