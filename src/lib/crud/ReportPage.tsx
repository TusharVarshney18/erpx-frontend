import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, AlertCircle, Inbox } from "lucide-react";

export type ReportColumn = {
  key: string;
  label: string;
  type?: "text" | "number" | "date";
  sortable?: boolean;
  format?: (v: any) => React.ReactNode;
  badge?: Record<string, string>;
};

type ReportPageProps = {
  title: string;
  subtitle?: string;
  endpoint: string;
  columns: ReportColumn[];
};

function orgPath(orgId: string, endpoint: string): string {
  return endpoint.replace("{orgId}", orgId);
}

function formatCell(v: any, col: ReportColumn) {
  if (v == null || v === "") return <span className="text-muted-foreground">—</span>;
  if (col.format) return col.format(v);
  if (col.badge && v != null) {
    const cls = col.badge[String(v)] ?? "bg-muted text-muted-foreground";
    return <Badge variant="secondary" className={cls}>{String(v)}</Badge>;
  }
  if (col.type === "number") return Number(v).toLocaleString("en-IN");
  if (col.type === "date") return new Date(v).toLocaleDateString();
  return String(v);
}

export function ReportPage({ title, subtitle, endpoint, columns }: ReportPageProps) {
  const { activeOrganizationId } = useAuth();
  const orgId = activeOrganizationId;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const queryKey = useMemo(() => [title, orgId, page, search, sortBy, sortOrder], [title, orgId, page, search, sortBy, sortOrder]);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!orgId) return { data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 1 } };
      const params: Record<string, string> = { page: String(page), limit: "50" };
      if (sortBy) params.sortBy = sortBy;
      params.sortOrder = sortOrder;
      if (search) params.search = search;
      const path = orgPath(orgId, endpoint);
      const res = await api.get<any>(path, { params });
      if (res?.data && res?.meta) return res;
      if (Array.isArray(res)) return { data: res, meta: { total: res.length, page: 1, limit: 50, totalPages: 1 } };
      const rawRows = res?.rows ?? (Array.isArray(res?.data) ? res.data : res) ?? [];
      return {
        data: Array.isArray(rawRows) ? rawRows : [],
        meta: res?.meta ?? { total: (Array.isArray(rawRows) ? rawRows.length : 0), page: 1, limit: 50, totalPages: 1 },
      };
    },
    enabled: !!orgId,
  });

  const rows = (data as any)?.data ?? (data as any)?.rows ?? [];
  const meta = (data as any)?.meta;

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={title}
        subtitle={subtitle ?? `${meta?.total ?? rows.length} record${rows.length === 1 ? "" : "s"}`}
        actions={
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <Input
          placeholder="Search…"
          className="h-9 border-0 bg-muted/50"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

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
              <div className="text-base font-semibold">Failed to load data</div>
              <p className="text-sm text-muted-foreground">{(error as Error)?.message ?? "Unknown error"}</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Inbox className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold">No data</div>
              <p className="text-sm text-muted-foreground">No records found for this report.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead
                      key={col.key}
                      className={col.sortable ? "cursor-pointer select-none" : ""}
                      onClick={() => col.sortable && handleSort(col.key)}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {sortBy === col.key && (
                          <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row: any, i: number) => (
                  <TableRow key={row.id ?? i}>
                    {columns.map((col) => {
                      const keys = col.key.split(".");
                      let v = row;
                      for (const k of keys) v = v?.[k];
                      return <TableCell key={col.key}>{formatCell(v, col)}</TableCell>;
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {meta.page} of {meta.totalPages} ({meta.total} records)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function BalanceSheetPage() {
  const { activeOrganizationId: orgId } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["balance-sheet", orgId],
    queryFn: () => orgId ? api.get<any>(`/reports/organizations/${orgId}/balance-sheet`) : Promise.resolve(null),
    enabled: !!orgId,
  });

  if (isLoading) return <div className="space-y-4"><PageHeader title="Balance Sheet" subtitle="Loading..." /><Skeleton className="h-96 w-full" /></div>;
  if (error) return <div className="space-y-4"><PageHeader title="Balance Sheet" /><Card><CardContent className="flex flex-col items-center py-16 text-destructive"><AlertCircle className="h-8 w-8 mb-2" />Failed to load: {(error as Error).message}</CardContent></Card></div>;

  const formatAmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-4">
      <PageHeader title="Balance Sheet" subtitle="Assets, liabilities and equity snapshot" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BalanceSheetSection title="Assets" items={data?.assets?.accounts ?? []} total={data?.assets?.total ?? 0} formatFn={formatAmt} />
        <BalanceSheetSection title="Liabilities" items={data?.liabilities?.accounts ?? []} total={data?.liabilities?.total ?? 0} formatFn={formatAmt} />
        <BalanceSheetSection title="Equity" items={data?.equity?.accounts ?? []} total={data?.equity?.total ?? 0} formatFn={formatAmt} netIncome={data?.netIncome} />
      </div>
      {data?.totalLiabilitiesEquity != null && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <span className="font-semibold">Total Liabilities & Equity</span>
            <span className="text-lg font-bold">{formatAmt(data.totalLiabilitiesEquity)}</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BalanceSheetSection({ title, items, total, formatFn, netIncome }: { title: string; items: any[]; total: number; formatFn: (n: number) => string; netIncome?: number }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-3 border-b border-border font-semibold text-sm">{title}</div>
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No accounts</div>
        ) : (
          <div className="divide-y divide-border/50">
            {items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{item.accountName} <span className="text-xs text-muted-foreground">({item.accountCode})</span></span>
                <span className="font-medium">{formatFn(item.balance)}</span>
              </div>
            ))}
          </div>
        )}
        {netIncome != null && title === "Equity" && (
          <div className="flex items-center justify-between px-3 py-2 text-sm border-t border-border/50 bg-muted/30">
            <span>Net Income (Current Period)</span>
            <span className="font-medium">{formatFn(netIncome)}</span>
          </div>
        )}
        <div className="flex items-center justify-between px-3 py-2 text-sm font-bold border-t border-border bg-muted/50">
          <span>Total {title}</span>
          <span>{formatFn(total + (netIncome && title === "Equity" ? netIncome : 0))}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfitLossPage() {
  const { activeOrganizationId: orgId } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["profit-loss", orgId],
    queryFn: () => orgId ? api.get<any>(`/reports/organizations/${orgId}/profit-loss`) : Promise.resolve(null),
    enabled: !!orgId,
  });

  const formatAmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  if (isLoading) return <div className="space-y-4"><PageHeader title="Profit & Loss" subtitle="Loading..." /><Skeleton className="h-96 w-full" /></div>;
  if (error) return <div className="space-y-4"><PageHeader title="Profit & Loss" /><Card><CardContent className="flex flex-col items-center py-16 text-destructive"><AlertCircle className="h-8 w-8 mb-2" />Failed to load: {(error as Error).message}</CardContent></Card></div>;

  return (
    <div className="space-y-4">
      <PageHeader title="Profit & Loss Statement" subtitle="Revenue, expenses and net profit" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-0">
            <div className="p-3 border-b border-border font-semibold text-sm bg-success/5">Revenue</div>
            {(data?.revenues?.accounts ?? []).length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No revenue accounts</div>
            ) : (
              <div className="divide-y divide-border/50">
                {data?.revenues?.accounts?.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>{a.accountName} <span className="text-xs text-muted-foreground">({a.accountCode})</span></span>
                    <span className="font-medium">{formatAmt(a.balance)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between px-3 py-2 text-sm font-bold border-t border-border bg-success/10">
              <span>Total Revenue</span>
              <span>{formatAmt(data?.revenues?.total ?? 0)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <div className="p-3 border-b border-border font-semibold text-sm bg-destructive/5">Expenses</div>
            {(data?.expenses?.accounts ?? []).length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No expense accounts</div>
            ) : (
              <div className="divide-y divide-border/50">
                {data?.expenses?.accounts?.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>{a.accountName} <span className="text-xs text-muted-foreground">({a.accountCode})</span></span>
                    <span className="font-medium">{formatAmt(a.balance)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between px-3 py-2 text-sm font-bold border-t border-border bg-destructive/10">
              <span>Total Expenses</span>
              <span>{formatAmt(data?.expenses?.total ?? 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className={`${data?.netProfit >= 0 ? "bg-success/5 border-success/30" : "bg-destructive/5 border-destructive/30"}`}>
        <CardContent className="flex items-center justify-between p-4">
          <span className="font-bold text-lg">Net Profit / (Loss)</span>
          <span className={`text-xl font-bold ${data?.netProfit >= 0 ? "text-success" : "text-destructive"}`}>
            {formatAmt(Math.abs(data?.netProfit ?? 0))} {data?.netProfit >= 0 ? "Profit" : "Loss"}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}

export function TrialBalancePage() {
  const { activeOrganizationId: orgId } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["trial-balance", orgId],
    queryFn: () => orgId ? api.get<any>(`/reports/organizations/${orgId}/trial-balance`) : Promise.resolve(null),
    enabled: !!orgId,
  });

  const formatAmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  if (isLoading) return <div className="space-y-4"><PageHeader title="Trial Balance" subtitle="Loading..." /><Skeleton className="h-96 w-full" /></div>;
  if (error) return <div className="space-y-4"><PageHeader title="Trial Balance" /><Card><CardContent className="flex flex-col items-center py-16 text-destructive"><AlertCircle className="h-8 w-8 mb-2" />Failed to load: {(error as Error).message}</CardContent></Card></div>;

  const rows = data?.rows ?? [];

  return (
    <div className="space-y-4">
      <PageHeader title="Trial Balance" subtitle={`${rows.length} accounts — Verify debits equal credits`} />
      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground"><Inbox className="h-8 w-8 mb-2" /><span>No data</span></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row: any) => (
                  <TableRow key={row.account?.id ?? row.accountCode}>
                    <TableCell className="font-mono text-xs">{row.account?.accountCode}</TableCell>
                    <TableCell className="font-medium">{row.account?.accountName}</TableCell>
                    <TableCell><Badge variant="secondary">{row.account?.accountType}</Badge></TableCell>
                    <TableCell className="text-right">{row.totalDebit > 0 ? formatAmt(row.totalDebit) : "—"}</TableCell>
                    <TableCell className="text-right">{row.totalCredit > 0 ? formatAmt(row.totalCredit) : "—"}</TableCell>
                    <TableCell className={`text-right font-medium ${row.balance >= 0 ? "" : "text-destructive"}`}>{formatAmt(Math.abs(row.balance))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {data?.totalDebit != null && (
        <div className="flex items-center justify-end gap-6 text-sm">
          <span className="font-semibold">Total Debit: <span className="text-base">{formatAmt(data.totalDebit)}</span></span>
          <span className="font-semibold">Total Credit: <span className="text-base">{formatAmt(data.totalCredit)}</span></span>
          <Badge variant={data.totalDebit === data.totalCredit ? "default" : "destructive"}>
            {data.totalDebit === data.totalCredit ? "Balanced ✓" : "Imbalanced ✗"}
          </Badge>
        </div>
      )}
    </div>
  );
}
