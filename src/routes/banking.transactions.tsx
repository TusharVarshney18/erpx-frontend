import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  listWithMeta,
  bankingPath,
  type BankAccount,
  type BankTransaction,
  type BankTransactionStatus,
} from "@/lib/api/banking";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageShell";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  RefreshCw,
  X,
  MoreHorizontal,
  Pencil,
  Undo2,
  Inbox,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@/components/banking/pagination";
import {
  formatMoney,
  formatDate,
  transactionTypeBadge,
  transactionTypeLabel,
  transactionStatusBadge,
  transactionStatusLabel,
} from "@/components/banking/format";

export const Route = createFileRoute("/banking/transactions")({
  head: () => ({ meta: [{ title: "Bank Transactions — Acme ERP" }] }),
  component: () => (
    <PremiumGate feature="banking">
      <Page />
    </PremiumGate>
  ),
});

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function Page() {
  const qc = useQueryClient();
  const { user, activeOrganizationId } = useAuth();
  const orgId = activeOrganizationId || user?.organization.id || null;

  const [rawSearch, setRawSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [recordOpen, setRecordOpen] = useState(false);
  const [editing, setEditing] = useState<BankTransaction | null>(null);
  const [confirmReverse, setConfirmReverse] = useState<BankTransaction | null>(null);

  const search = useDebounce(rawSearch, 300);

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

  const transactionsKey = useMemo(
    () => ["banking-transactions", orgId, page, pageSize, search, typeFilter, accountFilter],
    [orgId, page, pageSize, search, typeFilter, accountFilter],
  );

  const transactionsQuery = useQuery({
    queryKey: transactionsKey,
    queryFn: async () => {
      const params: Record<string, string> = { page: String(page), limit: String(pageSize) };
      if (search) params.search = search;
      if (typeFilter && typeFilter !== "all") params.type = typeFilter;
      if (accountFilter && accountFilter !== "all") params.accountId = accountFilter;
      return listWithMeta<BankTransaction>(`${basePath}/transactions`, params);
    },
    enabled: !!orgId,
  });

  const transactions = transactionsQuery.data?.data ?? [];
  const total = transactionsQuery.data?.meta.total ?? 0;
  const totalPages = transactionsQuery.data?.meta.totalPages ?? 1;

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["banking-transactions"] });
    qc.invalidateQueries({ queryKey: ["banking-accounts"] });
    qc.invalidateQueries({ queryKey: ["banking-summary"] });
    qc.invalidateQueries({ queryKey: ["banking-accounts-select"] });
  };

  const create = useMutation({
    mutationFn: async (values: Record<string, any>) =>
      api.post(`${basePath}/accounts/${values.accountId}/transactions`, values),
    onSuccess: () => {
      toast.success("Transaction recorded");
      setRecordOpen(false);
      invalidateAll();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to record transaction"),
  });

  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, any> }) =>
      api.patch(`${basePath}/transactions/${id}`, values),
    onSuccess: () => {
      toast.success("Transaction updated");
      setEditing(null);
      invalidateAll();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to update transaction"),
  });

  const reverse = useMutation({
    mutationFn: async (tx: BankTransaction) => api.delete(`${basePath}/transactions/${tx.id}`),
    onSuccess: () => {
      toast.success("Transaction reversed");
      setConfirmReverse(null);
      invalidateAll();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to reverse transaction"),
  });

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, accountFilter]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        title="Bank Transactions"
        subtitle={
          transactionsQuery.isLoading
            ? "Loading\u2026"
            : `${total.toLocaleString("en-IN")} transaction${total === 1 ? "" : "s"}`
        }
        actions={
          <Button
            size="sm"
            className="gradient-primary text-white"
            onClick={() => setRecordOpen(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Record Transaction
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search description, reference, counterparty\u2026"
            className="h-9 border-0 bg-muted/50 pl-9 pr-9"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
          />
          {rawSearch && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setRawSearch("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select value={accountFilter} onValueChange={setAccountFilter}>
          <SelectTrigger className="h-9 w-48">
            <SelectValue placeholder="All accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.accountName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="CREDIT">Credit</SelectItem>
            <SelectItem value="DEBIT">Debit</SelectItem>
            <SelectItem value="TRANSFER">Transfer</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => transactionsQuery.refetch()}
          disabled={transactionsQuery.isFetching}
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${transactionsQuery.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {transactionsQuery.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : transactionsQuery.error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold">Failed to load transactions</div>
              <p className="max-w-md text-sm text-muted-foreground">
                {(transactionsQuery.error as Error)?.message ?? "Unknown error"}
              </p>
              <Button size="sm" variant="outline" onClick={() => transactionsQuery.refetch()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Inbox className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold">No transactions yet</div>
              <p className="max-w-md text-sm text-muted-foreground">
                Record your first transaction to start tracking money in and out.
              </p>
              <Button size="sm" className="gradient-primary text-white" onClick={() => setRecordOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Record Transaction
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(t.transactionDate)}</TableCell>
                    <TableCell className="max-w-[180px]">
                      <div className="truncate font-medium">{t.bankAccount?.accountName ?? "—"}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={transactionTypeBadge[t.type]}>
                        {transactionTypeLabel[t.type] ?? t.type}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`whitespace-nowrap text-right font-medium ${
                        t.type === "DEBIT"
                          ? "text-destructive"
                          : t.type === "TRANSFER"
                            ? "text-primary"
                            : "text-success"
                      }`}
                    >
                      {t.type === "DEBIT" ? "−" : t.type === "TRANSFER" ? "⇄ " : "+"}
                      {formatMoney(t.amount, t.bankAccount?.currency)}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">{t.counterparty ?? "—"}</TableCell>
                    <TableCell className="max-w-[140px] truncate">{t.category ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={transactionStatusBadge[t.status]}>
                        {transactionStatusLabel[t.status] ?? t.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditing(t)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setConfirmReverse(t)}
                            disabled={t.status === "REVERSED"}
                          >
                            <Undo2 className="mr-2 h-4 w-4" /> Reverse
                          </DropdownMenuItem>
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

      <RecordTransactionDialog
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        accounts={accounts}
        busy={create.isPending}
        onSubmit={(values) => create.mutate(values)}
      />

      <EditTransactionDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        transaction={editing}
        busy={update.isPending}
        onSubmit={(values) => editing && update.mutate({ id: editing.id, values })}
      />

      <AlertDialog open={!!confirmReverse} onOpenChange={(o) => !o && setConfirmReverse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverse transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will undo the balance effect of the {transactionTypeLabel[confirmReverse?.type ?? ""] ?? ""}{" "}
              transaction of {confirmReverse ? formatMoney(confirmReverse.amount) : ""} and mark it as
              reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmReverse && reverse.mutate(confirmReverse)}
              className="bg-destructive text-destructive-foreground"
            >
              Reverse
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RecordTransactionDialog({
  open,
  onClose,
  accounts,
  busy,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  accounts: BankAccount[];
  busy: boolean;
  onSubmit: (values: Record<string, any>) => void;
}) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setValues({
      accountId: accounts[0]?.id ?? "",
      type: "DEBIT",
      amount: "",
      transactionDate: today(),
      description: "",
      counterparty: "",
      category: "",
      reference: "",
      status: "CLEARED",
      toAccountId: "",
    });
    setErrors({});
  }, [open, accounts]);

  const set = (key: string, val: any) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!values.accountId) next.accountId = "Account is required";
    if (!values.type) next.type = "Type is required";
    if (values.amount === "" || Number(values.amount) <= 0) next.amount = "Enter an amount greater than zero";
    if (values.type === "TRANSFER" && !values.toAccountId) next.toAccountId = "Destination account is required";
    if (values.type === "TRANSFER" && values.toAccountId === values.accountId) {
      next.toAccountId = "Destination must differ from source account";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload: Record<string, any> = {
      accountId: values.accountId,
      type: values.type,
      amount: Number(values.amount),
      transactionDate: values.transactionDate,
      status: values.status,
    };
    if (values.description) payload.description = values.description;
    if (values.counterparty) payload.counterparty = values.counterparty;
    if (values.category) payload.category = values.category;
    if (values.reference) payload.reference = values.reference;
    if (values.type === "TRANSFER") payload.toAccountId = values.toAccountId;
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Transaction</DialogTitle>
          <DialogDescription>Record a credit, debit or transfer between accounts.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Account" required error={errors.accountId}>
            <Select value={String(values.accountId ?? "")} onValueChange={(v) => set("accountId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select account\u2026" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.accountName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Type" required error={errors.type}>
            <Select value={String(values.type ?? "DEBIT")} onValueChange={(v) => set("type", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select\u2026" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CREDIT">Credit</SelectItem>
                <SelectItem value="DEBIT">Debit</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {values.type === "TRANSFER" && (
            <Field label="To Account" required error={errors.toAccountId}>
              <Select value={String(values.toAccountId ?? "")} onValueChange={(v) => set("toAccountId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination\u2026" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((a) => a.id !== values.accountId)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.accountName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field label="Amount" required error={errors.amount}>
            <Input
              type="number"
              step="any"
              min="0.01"
              value={values.amount ?? ""}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="0.00"
            />
          </Field>
          <Field label="Transaction Date" required>
            <Input
              type="date"
              value={values.transactionDate ?? today()}
              onChange={(e) => set("transactionDate", e.target.value)}
            />
          </Field>
          <Field label="Description">
            <Input
              value={values.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
          <Field label="Counterparty">
            <Input
              value={values.counterparty ?? ""}
              onChange={(e) => set("counterparty", e.target.value)}
            />
          </Field>
          <Field label="Category">
            <Input value={values.category ?? ""} onChange={(e) => set("category", e.target.value)} />
          </Field>
          <Field label="Reference">
            <Input value={values.reference ?? ""} onChange={(e) => set("reference", e.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={String(values.status ?? "CLEARED")} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLEARED">Cleared</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy} className="gradient-primary text-white">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {busy ? "Recording\u2026" : "Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditTransactionDialog({
  open,
  onClose,
  transaction,
  busy,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  transaction: BankTransaction | null;
  busy: boolean;
  onSubmit: (values: Record<string, any>) => void;
}) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!transaction) return;
    setValues({
      description: transaction.description ?? "",
      category: transaction.category ?? "",
      reference: transaction.reference ?? "",
      counterparty: transaction.counterparty ?? "",
      status: transaction.status,
    });
    setErrors({});
  }, [transaction]);

  const set = (key: string, val: any) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = {
      description: values.description || null,
      category: values.category || null,
      reference: values.reference || null,
      counterparty: values.counterparty || null,
      status: values.status as BankTransactionStatus,
    };
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update details or change the status of the transaction.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Description">
            <Input
              value={values.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
          <Field label="Category">
            <Input value={values.category ?? ""} onChange={(e) => set("category", e.target.value)} />
          </Field>
          <Field label="Reference">
            <Input value={values.reference ?? ""} onChange={(e) => set("reference", e.target.value)} />
          </Field>
          <Field label="Counterparty">
            <Input
              value={values.counterparty ?? ""}
              onChange={(e) => set("counterparty", e.target.value)}
            />
          </Field>
          <Field label="Status" error={errors.status}>
            <Select
              value={String(values.status ?? "CLEARED")}
              onValueChange={(v) => set("status", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLEARED">Cleared</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy} className="gradient-primary text-white">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {busy ? "Saving\u2026" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
