import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Loader2, RotateCcw, Send, Search, Eye, AlertCircle, RefreshCw, Scale } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/accounting/journal-entries")({
  head: () => ({ meta: [{ title: "Journal Entries — Acme ERP" }] }),
  component: JournalEntriesPage,
});

type Entry = {
  id: string;
  journalNumber: string;
  voucherType: string;
  postingDate: string;
  description: string | null;
  status: string;
  _count?: { lines: number };
};

type EntryLine = {
  id: string;
  debit: number;
  credit: number;
  description: string | null;
  account: { id: string; accountCode: string; accountName: string; accountType: string };
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  POSTED: "bg-success/15 text-success",
  REVERSED: "bg-warning/15 text-warning",
};

const fmt = (n: number) => n.toLocaleString("en-IN");

function JournalEntriesPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const { activeOrganizationId } = useAuth();
  const access = useAccess();
  const orgId = activeOrganizationId;

  const canPost = access.canAny(["journal_entry:create", "journal_entry:update"]);
  const canReverse = access.hasPermission("journal_entry:update");

  const [search, setSearch] = useState("");
  const [voucherFilter, setVoucherFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["journal-register", orgId, page, search, voucherFilter],
    queryFn: () =>
      api.get<any>(`/accounting/organizations/${orgId}/journal-entries`, {
        params: {
          page: String(page),
          limit: "25",
          ...(search ? { search } : {}),
          ...(voucherFilter !== "all" ? { status: voucherFilter } : {}),
        },
      }),
    enabled: !!orgId,
  });
  const list = Array.isArray(data) ? data : (data as any)?.data ?? [];
  const meta = (data as any)?.meta;

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["journal-detail", orgId, selected?.id],
    queryFn: () => api.get<{ lines: EntryLine[]; description: string | null; postingDate: string; journalNumber: string; status: string; voucherType: string }>(`/accounting/organizations/${orgId}/journal-entries/${selected?.id}`),
    enabled: !!orgId && !!selected?.id,
  });

  const detailLines = detail?.lines ?? [];
  const debitLines = detailLines.filter((l) => l.debit > 0);
  const creditLines = detailLines.filter((l) => l.credit > 0);
  const totalDr = detailLines.reduce((s, l) => s + l.debit, 0);
  const totalCr = detailLines.reduce((s, l) => s + l.credit, 0);

  const postEntry = useMutation({
    mutationFn: () => api.post(`/accounting/organizations/${orgId}/journal-entries/${selected?.id}/post`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["journal-register"] }); toast.success("Entry posted to ledger"); setSelected(null); },
    onError: (e: any) => toast.error(e.message ?? "Post failed"),
  });

  const reverseEntry = useMutation({
    mutationFn: () => api.post(`/accounting/organizations/${orgId}/journal-entries/${selected?.id}/reverse`, { reason: reason || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["journal-register"] }); toast.success("Entry reversed"); setSelected(null); setReason(""); },
    onError: (e: any) => toast.error(e.message ?? "Reverse failed"),
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Journal Entries"
        subtitle="Journal register — posted vouchers and their double-entry lines"
        actions={canPost ? (
          <Button size="sm" className="gradient-primary text-white" onClick={() => nav({ to: "/accounting/vouchers" })}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Journal Entry
          </Button>
        ) : undefined}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-9 pl-9" placeholder="Search entry number…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={voucherFilter} onValueChange={(v) => { setVoucherFilter(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="DRAFT">DRAFT</SelectItem>
            <SelectItem value="POSTED">POSTED</SelectItem>
            <SelectItem value="REVERSED">REVERSED</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-9" onClick={() => refetch()}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry</Button>
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Scale className="h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">No journal entries</p>
              <p className="text-sm text-muted-foreground">Post vouchers from the Vouchers screen to see them here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entry #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Narration</TableHead>
                  <TableHead className="text-center">Lines</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((e: Entry) => (
                  <TableRow key={e.id} className="cursor-pointer" onClick={() => setSelected(e)}>
                    <TableCell className="font-medium">{e.journalNumber}</TableCell>
                    <TableCell className="text-sm">{e.voucherType}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(e.postingDate).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">{e.description ?? "—"}</TableCell>
                    <TableCell className="text-center text-sm">{e._count?.lines ?? 0}</TableCell>
                    <TableCell><Badge variant="secondary" className={STATUS_BADGE[e.status] ?? ""}>{e.status}</Badge></TableCell>
                    <TableCell onClick={(ev) => ev.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(e)}><Eye className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {meta.page} of {meta.totalPages} ({meta.total} entries)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setReason(""); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Scale className="h-4 w-4 text-primary" /> {detail?.journalNumber ?? selected?.journalNumber}</DialogTitle>
            <DialogDescription>
              {detail?.voucherType ?? selected?.voucherType} · {detail?.postingDate ? new Date(detail.postingDate).toLocaleDateString() : ""} · <span className="font-medium">{detail?.status ?? selected?.status}</span>
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" /></div>
          ) : (
            <div className="font-mono text-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                    <th className="pb-1 font-medium">Particulars</th>
                    <th className="w-16 pb-1 font-medium">L.F.</th>
                    <th className="pb-1 text-right font-medium">Debit</th>
                    <th className="pb-1 text-right font-medium">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {debitLines.map((l) => (
                    <tr key={l.id}>
                      <td className="py-0.5">{l.account.accountName} Dr.</td>
                      <td className="py-0.5 font-mono text-xs text-muted-foreground">{l.account.accountCode}</td>
                      <td className="py-0.5 text-right">{fmt(l.debit)}</td>
                      <td className="py-0.5 text-right" />
                    </tr>
                  ))}
                  {creditLines.map((l) => (
                    <tr key={l.id}>
                      <td className="py-0.5 pl-6">To {l.account.accountName}</td>
                      <td className="py-0.5 font-mono text-xs text-muted-foreground">{l.account.accountCode}</td>
                      <td className="py-0.5 text-right" />
                      <td className="py-0.5 text-right">{fmt(l.credit)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-border">
                    <td className="py-0.5 font-semibold">Total</td>
                    <td className="py-0.5" />
                    <td className="py-0.5 text-right font-semibold">{fmt(totalDr)}</td>
                    <td className="py-0.5 text-right font-semibold">{fmt(totalCr)}</td>
                  </tr>
                </tbody>
              </table>
              {detail?.description && <div className="mt-2 text-xs text-muted-foreground">({detail.description})</div>}
            </div>
          )}

          {detail?.status === "REVERSED" && (
            <div className="flex items-center gap-1 text-xs text-amber-600"><RotateCcw className="h-3.5 w-3.5" /> This entry has been reversed.</div>
          )}

          <DialogFooter className="gap-2">
            {detail?.status === "DRAFT" && canPost && (
              <Button className="gradient-primary text-white" disabled={postEntry.isPending} onClick={() => postEntry.mutate()}>
                {postEntry.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />} Post to Ledger
              </Button>
            )}
            {detail?.status === "POSTED" && canReverse && (
              <div className="flex w-full items-center gap-2">
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reversal reason" className="h-9 flex-1" />
                <Button variant="destructive" disabled={reverseEntry.isPending} onClick={() => reverseEntry.mutate()}>
                  {reverseEntry.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-1.5 h-4 w-4" />} Reverse
                </Button>
              </div>
            )}
            <Button variant="outline" onClick={() => { setSelected(null); setReason(""); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
