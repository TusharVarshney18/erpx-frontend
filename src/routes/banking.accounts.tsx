import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  listWithMeta,
  bankingPath,
  type BankAccount,
  type BankAccountType,
  type BankingSummary,
  type BankTransaction,
  type Paginated,
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
  Trash2,
  Eye,
  Inbox,
  AlertCircle,
  Loader2,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@/components/banking/pagination";
import {
  formatMoney,
  formatDate,
  maskAccountNumber,
  accountTypeBadge,
  accountTypeLabel,
} from "@/components/banking/format";

export const Route = createFileRoute("/banking/accounts")({
  head: () => ({ meta: [{ title: "Bank Accounts — Acme ERP" }] }),
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

function Page() {
  const qc = useQueryClient();
  const { user, activeOrganizationId } = useAuth();
  const orgId = activeOrganizationId || user?.organization.id || null;

  const [rawSearch, setRawSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [viewing, setViewing] = useState<BankAccount | null>(null);
  const [confirmDel, setConfirmDel] = useState<BankAccount | null>(null);

  const search = useDebounce(rawSearch, 300);

  const basePath = orgId ? bankingPath(orgId) : "";
  const accountsKey = useMemo(
    () => ["banking-accounts", orgId, page, pageSize, search],
    [orgId, page, pageSize, search],
  );

  const summaryQuery = useQuery<BankingSummary>({
    queryKey: ["banking-summary", orgId],
    queryFn: async () => api.get<BankingSummary>(`${basePath}/summary`),
    enabled: !!orgId,
  });

  const accountsQuery = useQuery<Paginated<BankAccount>>({
    queryKey: accountsKey,
    queryFn: async () => {
      const params: Record<string, string> = { page: String(page), limit: String(pageSize) };
      if (search) params.search = search;
      return listWithMeta<BankAccount>(`${basePath}/accounts`, params);
    },
    enabled: !!orgId,
  });

  const accounts = accountsQuery.data?.data ?? [];
  const total = accountsQuery.data?.meta.total ?? 0;
  const totalPages = accountsQuery.data?.meta.totalPages ?? 1;

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["banking-accounts"] });
    qc.invalidateQueries({ queryKey: ["banking-summary"] });
  };

  const upsert = useMutation({
    mutationFn: async (values: Record<string, any>) => {
      if (editing) return api.patch(`${basePath}/accounts/${editing.id}`, values);
      return api.post(`${basePath}/accounts`, values);
    },
    onSuccess: () => {
      toast.success(editing ? "Account updated" : "Account created");
      setFormOpen(false);
      setEditing(null);
      invalidateAll();
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const del = useMutation({
    mutationFn: async (account: BankAccount) => api.delete(`${basePath}/accounts/${account.id}`),
    onSuccess: () => {
      toast.success("Account deleted");
      setConfirmDel(null);
      invalidateAll();
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  useEffect(() => {
    setPage(1);
  }, [search]);

  const summary = summaryQuery.data;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        title="Bank Accounts"
        subtitle={
          summaryQuery.isLoading
            ? "Loading\u2026"
            : `${total.toLocaleString("en-IN")} account${total === 1 ? "" : "s"} on file`
        }
        actions={
          <Button
            size="sm"
            className="gradient-primary text-white"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Account
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Total Balance"
          value={formatMoney(summary?.totalBalance)}
          icon={Wallet}
        />
        <KpiCard
          label="This Month In"
          value={formatMoney(summary?.thisMonthCredits)}
          icon={ArrowDownToLine}
          tone="success"
        />
        <KpiCard
          label="This Month Out"
          value={formatMoney(summary?.thisMonthDebits)}
          icon={ArrowUpFromLine}
          tone="destructive"
        />
        <KpiCard label="Accounts" value={String(summary?.accountCount ?? 0)} icon={Landmark} />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, bank or account number\u2026"
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
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => {
            accountsQuery.refetch();
            summaryQuery.refetch();
          }}
          disabled={accountsQuery.isFetching}
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${accountsQuery.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {accountsQuery.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : accountsQuery.error ? (
            <ErrorState
              message={(accountsQuery.error as Error)?.message ?? "Unknown error"}
              onRetry={() => accountsQuery.refetch()}
            />
          ) : accounts.length === 0 ? (
            <EmptyState
              onNew={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((a) => (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer"
                    onClick={() => setViewing(a)}
                  >
                    <TableCell>
                      <div className="font-medium">{a.accountName}</div>
                      <div className="text-xs text-muted-foreground">
                        {[a.branch, a.ifscCode].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </TableCell>
                    <TableCell>{a.bankName}</TableCell>
                    <TableCell className="font-mono text-xs">{maskAccountNumber(a.accountNumber)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={accountTypeBadge[a.accountType]}>
                        {accountTypeLabel[a.accountType] ?? a.accountType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(a.currentBalance, a.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={a.isActive ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}
                      >
                        {a.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewing(a)}>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(a);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDel(a)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
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

      <AccountFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        editing={editing}
        busy={upsert.isPending}
        onSubmit={(values) => upsert.mutate(values)}
      />

      <ViewAccountDialog
        orgId={orgId}
        account={viewing}
        onClose={() => setViewing(null)}
      />

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDel?.accountName} will be deactivated. This can be reversed later by editing the
              account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDel && del.mutate(confirmDel)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone?: "success" | "destructive";
}) {
  const iconCls =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "destructive"
        ? "bg-destructive/10 text-destructive"
        : "bg-accent text-accent-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className={`grid h-10 w-10 place-items-center rounded-xl ${iconCls}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="truncate text-xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function AccountFormDialog({
  open,
  onClose,
  editing,
  busy,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  editing: BankAccount | null;
  busy: boolean;
  onSubmit: (values: Record<string, any>) => void;
}) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setValues({
      accountName: editing?.accountName ?? "",
      bankName: editing?.bankName ?? "",
      accountNumber: editing?.accountNumber ?? "",
      ifscCode: editing?.ifscCode ?? "",
      branch: editing?.branch ?? "",
      accountType: editing?.accountType ?? "SAVINGS",
      openingBalance: editing ? Number(editing.openingBalance) : 0,
    });
    setErrors({});
  }, [open, editing]);

  const set = (key: string, val: any) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!values.accountName) next.accountName = "Account name is required";
    if (!values.bankName) next.bankName = "Bank name is required";
    if (!values.accountNumber) next.accountNumber = "Account number is required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload: Record<string, any> = {
      accountName: values.accountName,
      bankName: values.bankName,
      accountNumber: values.accountNumber,
      accountType: values.accountType as BankAccountType,
      openingBalance: Number(values.openingBalance ?? 0),
    };
    if (values.ifscCode) payload.ifscCode = values.ifscCode;
    if (values.branch) payload.branch = values.branch;
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Bank Account" : "New Bank Account"}</DialogTitle>
          <DialogDescription>Fill the account details below and save.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Account Name" required error={errors.accountName}>
            <Input
              value={values.accountName ?? ""}
              onChange={(e) => set("accountName", e.target.value)}
            />
          </Field>
          <Field label="Bank Name" required error={errors.bankName}>
            <Input value={values.bankName ?? ""} onChange={(e) => set("bankName", e.target.value)} />
          </Field>
          <Field label="Account Number" required error={errors.accountNumber}>
            <Input
              value={values.accountNumber ?? ""}
              onChange={(e) => set("accountNumber", e.target.value)}
            />
          </Field>
          <Field label="IFSC Code">
            <Input value={values.ifscCode ?? ""} onChange={(e) => set("ifscCode", e.target.value)} />
          </Field>
          <Field label="Branch">
            <Input value={values.branch ?? ""} onChange={(e) => set("branch", e.target.value)} />
          </Field>
          <Field label="Account Type" required>
            <Select value={String(values.accountType ?? "SAVINGS")} onValueChange={(v) => set("accountType", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select\u2026" />
              </SelectTrigger>
              <SelectContent>
                {(["SAVINGS", "CURRENT", "CASH", "LOAN", "OTHER"] as const).map((t) => (
                  <SelectItem key={t} value={t}>
                    {accountTypeLabel[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Opening Balance">
            <Input
              type="number"
              step="any"
              value={values.openingBalance ?? 0}
              onChange={(e) => set("openingBalance", e.target.value)}
            />
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

function ViewAccountDialog({
  orgId,
  account,
  onClose,
}: {
  orgId: string | null;
  account: BankAccount | null;
  onClose: () => void;
}) {
  const detailQuery = useQuery<BankAccount>({
    queryKey: ["banking-account", orgId, account?.id],
    queryFn: async () => api.get<BankAccount>(`${bankingPath(orgId!)}/accounts/${account!.id}`),
    enabled: !!orgId && !!account?.id,
  });

  const detail = detailQuery.data ?? account;

  return (
    <Dialog open={!!account} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{detail?.accountName ?? "Account"}</DialogTitle>
          <DialogDescription>
            {detail ? `${detail.bankName} · ${maskAccountNumber(detail.accountNumber)}` : ""}
          </DialogDescription>
        </DialogHeader>

        {detail && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <DetailStat label="Balance" value={formatMoney(detail.currentBalance, detail.currency)} />
            <DetailStat
              label="Opening Balance"
              value={formatMoney(detail.openingBalance, detail.currency)}
            />
            <DetailStat label="Transactions" value={String(detail.transactionCount ?? 0)} />
            <DetailStat
              label="Type"
              value={accountTypeLabel[detail.accountType] ?? detail.accountType}
            />
          </div>
        )}

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">
            Recent Transactions
          </div>
          {detailQuery.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (detail?.recentTransactions ?? []).length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No transactions yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(detail?.recentTransactions ?? []).map((t: BankTransaction) => (
                  <TableRow key={t.id}>
                    <TableCell>{formatDate(t.transactionDate)}</TableCell>
                    <TableCell className="max-w-[240px] truncate">
                      {t.description || t.category || "—"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        t.type === "DEBIT"
                          ? "text-destructive"
                          : t.type === "TRANSFER"
                            ? "text-primary"
                            : "text-success"
                      }`}
                    >
                      {t.type === "DEBIT" ? "−" : t.type === "TRANSFER" ? "⇄ " : "+"}
                      {formatMoney(t.amount, detail?.currency)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {t.balanceAfter != null
                        ? formatMoney(t.balanceAfter, detail?.currency)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="truncate text-base font-bold">{value}</div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="text-base font-semibold">Failed to load bank accounts</div>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      <Button size="sm" variant="outline" onClick={onRetry}>
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
      </Button>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
        <Inbox className="h-6 w-6" />
      </div>
      <div className="text-base font-semibold">No bank accounts yet</div>
      <p className="max-w-md text-sm text-muted-foreground">
        Get started by linking your first bank account.
      </p>
      <Button size="sm" className="gradient-primary text-white" onClick={onNew}>
        <Plus className="mr-1.5 h-3.5 w-3.5" /> New Account
      </Button>
    </div>
  );
}
