import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CalendarRange, Download, Loader2 } from "lucide-react";

export const Route = createFileRoute("/accounting/books")({
  head: () => ({ meta: [{ title: "Day / Cash / Bank Books — ERPX" }] }),
  component: BooksPage,
});

type BookRow = {
  id: string;
  voucherNumber: string;
  voucherType: string;
  postingDate: string;
  description: string | null;
  debit: number;
  credit: number;
  runningBalance?: number;
  accountCode?: string;
  accountName?: string;
};

type DayEntry = {
  id: string;
  journalNumber: string;
  voucherType: string;
  voucherTypeName: string;
  postingDate: string;
  description: string | null;
  totalDebit: number;
  totalCredit: number;
  lines: { id: string; accountCode: string; accountName: string; debit: number; credit: number }[];
};

function startOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmt(n: number): string {
  return (n ?? 0).toLocaleString("en-IN");
}

const voucherBadge: Record<string, string> = {
  JOURNAL: "bg-muted text-muted-foreground",
  PAYMENT: "bg-destructive/15 text-destructive",
  RECEIPT: "bg-success/15 text-success",
  CONTRA: "bg-primary/15 text-primary",
  CREDIT_NOTE: "bg-warning/15 text-warning",
  DEBIT_NOTE: "bg-destructive/15 text-destructive",
  OPENING: "bg-info/15 text-info",
};

function BooksPage() {
  const { activeOrganizationId } = useAuth();
  const orgId = activeOrganizationId;
  const [dateFrom, setDateFrom] = useState(startOfMonth());
  const [dateTo, setDateTo] = useState(today());

  const params = { dateFrom, dateTo };

  const { data: dayBook, isLoading: dayLoading, isError: dayError, refetch: refetchDay } = useQuery({
    queryKey: ["day-book", orgId, dateFrom, dateTo],
    queryFn: () =>
      api.get<DayEntry[]>(`/accounting/organizations/${orgId}/reports/day-book`, { params }),
    enabled: !!orgId,
  });

  const { data: cashBook, isLoading: cashLoading, isError: cashError, refetch: refetchCash } = useQuery({
    queryKey: ["cash-book", orgId, dateFrom, dateTo],
    queryFn: () =>
      api.get<{ rows: BookRow[]; totalDebit: number; totalCredit: number; closingBalance: number }>(
        `/accounting/organizations/${orgId}/reports/cash-book`,
        { params },
      ),
    enabled: !!orgId,
  });

  const { data: bankBook, isLoading: bankLoading, isError: bankError, refetch: refetchBank } = useQuery({
    queryKey: ["bank-book", orgId, dateFrom, dateTo],
    queryFn: () =>
      api.get<{ rows: BookRow[]; totalDebit: number; totalCredit: number; closingBalance: number }>(
        `/accounting/organizations/${orgId}/reports/bank-book`,
        { params },
      ),
    enabled: !!orgId,
  });

  const exportCsv = (rows: BookRow[], title: string) => {
    const header = ["Voucher #", "Type", "Date", "Description", "Debit", "Credit", "Running"];
    const csv = [header.join(",")];
    rows.forEach((r) =>
      csv.push(
        [r.voucherNumber, r.voucherType, r.postingDate, `"${(r.description ?? "").replace(/"/g, '""')}"`, r.debit, r.credit, r.runningBalance ?? ""].join(","),
      ),
    );
    const blob = new Blob([csv.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const LoadingState = () => (
    <div className="space-y-2 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );

  const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load this book.</p>
      <Button size="sm" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader title="Statutory Books" subtitle="Day Book, Cash Book and Bank Book from posted ledgers" />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="space-y-1.5">
            <Label className="text-xs">From</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">To</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9" />
          </div>
          <Button size="sm" variant="outline" className="h-9 gap-1.5">
            <CalendarRange className="h-4 w-4" /> {dateFrom} → {dateTo}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="day">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="day">Day Book</TabsTrigger>
          <TabsTrigger value="cash">Cash Book</TabsTrigger>
          <TabsTrigger value="bank">Bank Book</TabsTrigger>
        </TabsList>

        <TabsContent value="day" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {dayLoading ? (
                <LoadingState />
              ) : dayError ? (
                <ErrorState onRetry={() => refetchDay()} />
              ) : !dayBook || dayBook.length === 0 ? (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  No vouchers posted in this period.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Voucher #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Narration</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead>Accounts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dayBook.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-xs">{entry.journalNumber}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={voucherBadge[entry.voucherType] ?? ""}>
                            {entry.voucherTypeName ?? entry.voucherType}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(entry.postingDate).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell className="max-w-[220px] truncate">{entry.description ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(entry.totalDebit)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(entry.totalCredit)}</TableCell>
                        <TableCell>
                          <div className="flex max-w-[260px] flex-wrap gap-1">
                            {entry.lines.map((l) => (
                              <span key={l.id} className="truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                                {l.accountCode} · {l.accountName}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {(["cash", "bank"] as const).map((book) => {
          const data = book === "cash" ? cashBook : bankBook;
          const loading = book === "cash" ? cashLoading : bankLoading;
          const error = book === "cash" ? cashError : bankError;
          const refetch = book === "cash" ? refetchCash : refetchBank;
          return (
            <TabsContent key={book} value={book} className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between border-b border-border px-4 py-2">
                    <p className="text-sm text-muted-foreground capitalize">
                      {book === "cash" ? "Cash accounts" : "Bank accounts"} · postings in period
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5"
                      disabled={!data?.rows?.length}
                      onClick={() => data && exportCsv(data.rows, `${book}-book`)}
                    >
                      <Download className="h-3.5 w-3.5" /> Export CSV
                    </Button>
                  </div>
                  {loading ? (
                    <LoadingState />
                  ) : error ? (
                    <ErrorState onRetry={() => refetch()} />
                  ) : !data?.rows?.length ? (
                    <div className="py-16 text-center text-sm text-muted-foreground">
                      No {book === "cash" ? "cash" : "bank"} postings in this period.
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Voucher #</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.rows.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-mono text-xs">{r.voucherNumber}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={voucherBadge[r.voucherType] ?? ""}>
                                  {r.voucherType}
                                </Badge>
                              </TableCell>
                              <TableCell>{new Date(r.postingDate).toLocaleDateString("en-IN")}</TableCell>
                              <TableCell className="max-w-[220px] truncate">{r.description ?? "—"}</TableCell>
                              <TableCell className="text-right tabular-nums">{fmt(r.debit)}</TableCell>
                              <TableCell className="text-right tabular-nums">{fmt(r.credit)}</TableCell>
                              <TableCell className="text-right tabular-nums">{fmt(r.runningBalance ?? 0)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="grid grid-cols-3 gap-3 border-t border-border p-4 text-sm">
                        <div>
                          <span className="text-xs text-muted-foreground uppercase">Total Debit</span>
                          <p className="font-bold tabular-nums">{fmt(data.totalDebit)}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground uppercase">Total Credit</span>
                          <p className="font-bold tabular-nums">{fmt(data.totalCredit)}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground uppercase">Closing Balance</span>
                          <p className="font-bold tabular-nums">{fmt(data.closingBalance)}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
