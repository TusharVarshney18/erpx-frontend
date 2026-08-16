import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useAccess } from "@/hooks/useAccess";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Send, Scale, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/accounting/vouchers")({
  head: () => ({ meta: [{ title: "Vouchers — Acme ERP" }] }),
  component: VouchersPage,
});

type Account = { id: string; accountCode: string; accountName: string; accountType: string };
type Line = { accountId: string; debit: string; credit: string; description: string };

const VOUCHER_TYPES = [
  { value: "journal", label: "Journal" },
  { value: "payment", label: "Payment" },
  { value: "receipt", label: "Receipt" },
  { value: "contra", label: "Contra" },
  { value: "credit-note", label: "Credit Note" },
  { value: "debit-note", label: "Debit Note" },
  { value: "opening", label: "Opening Balance" },
];

function VouchersPage() {
  const qc = useQueryClient();
  const { activeOrganizationId } = useAuth();
  const access = useAccess();
  const orgId = activeOrganizationId;

  const [type, setType] = useState("journal");
  const [postingDate, setPostingDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { accountId: "", debit: "", credit: "", description: "" },
    { accountId: "", debit: "", credit: "", description: "" },
  ]);
  const [showHistory, setShowHistory] = useState(false);

  const { data: accounts = [] } = useQuery({
    queryKey: ["voucher-accounts", orgId],
    queryFn: () => api.get<Account[]>(`/accounting/organizations/${orgId}/chart-of-accounts?limit=500`),
    enabled: !!orgId,
  });
  const accountsList = Array.isArray(accounts) ? accounts : (accounts as any)?.data ?? [];

  const { data: history = [] } = useQuery({
    queryKey: ["voucher-history", orgId],
    queryFn: () => api.get<any[]>(`/accounting/organizations/${orgId}/journal-entries?limit=25`),
    enabled: !!orgId && showHistory,
  });
  const historyList = Array.isArray(history) ? history : (history as any)?.data ?? [];

  const accountMap = useMemo(() => {
    const map = new Map<string, Account>();
    for (const a of accountsList) map.set(a.id, a);
    return map;
  }, [accountsList]);

  const totals = useMemo(() => {
    const debit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const credit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    return { debit, credit, balanced: debit === credit && debit > 0 };
  }, [lines]);

  /**
   * Standard journal convention: debited accounts first, credited accounts
   * below (indented, "To …"). Display is auto-sorted regardless of entry order.
   */
  const journalLines = useMemo(() => {
    const completed = lines.filter((l) => l.accountId && ((Number(l.debit) || 0) > 0 || (Number(l.credit) || 0) > 0));
    const debits = completed.filter((l) => (Number(l.debit) || 0) > 0);
    const credits = completed.filter((l) => (Number(l.credit) || 0) > 0);
    return [...debits, ...credits].map((l) => {
      const account = accountMap.get(l.accountId);
      return {
        ...l,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        accountCode: account?.accountCode ?? "",
        accountName: account?.accountName ?? "Unknown",
        isDebit: (Number(l.debit) || 0) > 0,
      };
    });
  }, [lines, accountMap]);

  const fmt = (n: number) => n.toLocaleString("en-IN");

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const post = useMutation({
    mutationFn: async () => {
      const payload = {
        postingDate,
        description: description.trim() || undefined,
        lines: lines.map((l) => ({
          accountId: l.accountId,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          description: l.description.trim() || undefined,
        })).filter((l) => l.accountId && (l.debit > 0 || l.credit > 0)),
      };
      return api.post(`/accounting/organizations/${orgId}/vouchers/${type}`, payload);
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["voucher-history"] });
      toast.success(`Voucher ${data?.journalNumber ?? ""} posted`);
      setLines([{ accountId: "", debit: "", credit: "", description: "" }, { accountId: "", debit: "", credit: "", description: "" }]);
      setDescription("");
    },
    onError: (e: any) => toast.error(e.message ?? "Posting failed"),
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader title="Vouchers" subtitle="Post double-entry transactions (Payment, Receipt, Contra, Notes, Opening)" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Scale className="h-4 w-4 text-primary" /> New Voucher</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Voucher Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VOUCHER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Posting Date</Label>
                <Input type="date" value={postingDate} onChange={(e) => setPostingDate(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-1 col-span-2">
                <Label>Description / Narration</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Narration" />
              </div>
            </div>

            <Card className="border-border/60">
              <CardContent className="p-0">
                {/* Standard journal format: Date | Particulars | L.F. | Debit | Credit */}
                <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted-foreground">
                  <span>Date: <b className="text-foreground">{postingDate}</b></span>
                  <span>Voucher: {type.replace("-", " ").toUpperCase()}</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="p-2 font-medium">Particulars</th>
                      <th className="w-16 p-2 font-medium">L.F.</th>
                      <th className="w-32 p-2 text-right font-medium">Debit</th>
                      <th className="w-32 p-2 text-right font-medium">Credit</th>
                      <th className="w-10 p-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, i) => {
                      const selected = accountMap.get(l.accountId);
                      const isDebit = (Number(l.debit) || 0) > 0;
                      const isCredit = (Number(l.credit) || 0) > 0;
                      return (
                        <tr key={i} className="border-b border-border/40 last:border-0 align-top">
                          <td className="p-1.5">
                            <div className="flex items-center gap-1">
                              {(isCredit) && <span className="w-6 text-xs text-muted-foreground">To</span>}
                              <Select value={l.accountId} onValueChange={(v) => setLine(i, { accountId: v })}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="Select account…" /></SelectTrigger>
                                <SelectContent className="max-h-80">
                                  {accountsList.map((a: Account) => (
                                    <SelectItem key={a.id} value={a.id}>{a.accountCode} · {a.accountName}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {isDebit && <span className="shrink-0 text-xs font-semibold text-foreground">Dr.</span>}
                            </div>
                            <Input value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} placeholder="Line narration" className="mt-1 h-7 text-xs" />
                          </td>
                          <td className="p-1.5 pt-3 font-mono text-xs text-muted-foreground">{selected?.accountCode ?? ""}</td>
                          <td className="p-1.5"><Input type="number" min={0} value={l.debit} onChange={(e) => setLine(i, { debit: e.target.value, credit: "" })} className="h-9 text-right" /></td>
                          <td className="p-1.5"><Input type="number" min={0} value={l.credit} onChange={(e) => setLine(i, { credit: e.target.value, debit: "" })} className="h-9 text-right" /></td>
                          <td className="p-1.5 text-center">
                            {lines.length > 1 && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Formatted journal entry preview (debits first, credits indented) */}
            {journalLines.length > 0 && (
              <Card className="border-border/60 bg-muted/30">
                <CardContent className="p-4 font-mono text-sm">
                  <div className="mb-2 flex items-center justify-between border-b border-border pb-1 text-xs text-muted-foreground">
                    <span className="font-semibold uppercase tracking-wide text-foreground">Journal Entry</span>
                    <span>Date: {postingDate}</span>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                        <th className="pb-1 font-medium">Particulars</th>
                        <th className="pb-1 text-right font-medium">Debit</th>
                        <th className="pb-1 text-right font-medium">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journalLines.map((l, idx) => (
                        <tr key={idx}>
                          <td className="py-0.5">
                            {l.isDebit
                              ? <span>{l.accountName} Dr.</span>
                              : <span className="pl-6">To {l.accountName}</span>}
                          </td>
                          <td className="py-0.5 text-right">{l.isDebit ? fmt(l.debit) : ""}</td>
                          <td className="py-0.5 text-right">{!l.isDebit ? fmt(l.credit) : ""}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-border">
                        <td className="py-0.5 font-semibold">Total</td>
                        <td className="py-0.5 text-right font-semibold">{fmt(totals.debit)}</td>
                        <td className="py-0.5 text-right font-semibold">{fmt(totals.credit)}</td>
                      </tr>
                    </tbody>
                  </table>
                  {description.trim() && (
                    <div className="mt-1 text-xs text-muted-foreground">({description.trim()})</div>
                  )}
                  {!totals.balanced && totals.debit + totals.credit > 0 && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-amber-600"><AlertCircle className="h-3.5 w-3.5" /> Debits must equal credits</div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" size="sm" onClick={() => setLines((prev) => [...prev, { accountId: "", debit: "", credit: "", description: "" }])}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Line
              </Button>
              <div className="flex items-center gap-4 text-sm">
                <span>Dr <b className={totals.debit > 0 ? "text-foreground" : "text-muted-foreground"}>{totals.debit.toLocaleString("en-IN")}</b></span>
                <span>Cr <b className={totals.credit > 0 ? "text-foreground" : "text-muted-foreground"}>{totals.credit.toLocaleString("en-IN")}</b></span>
                {!totals.balanced && totals.debit + totals.credit > 0 && (
                  <span className="flex items-center gap-1 text-xs text-amber-600"><AlertCircle className="h-3.5 w-3.5" /> Not balanced</span>
                )}
                <Button className="gradient-primary text-white" disabled={!totals.balanced || post.isPending} onClick={() => post.mutate()}>
                  {post.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />} Post Voucher
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Vouchers</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[420px] divide-y divide-border/50 overflow-y-auto">
              {historyList.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">No vouchers posted yet.</div>
              ) : historyList.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <div>
                    <div className="font-medium">{v.journalNumber}</div>
                    <div className="text-[11px] text-muted-foreground">{v.voucherType} · {new Date(v.postingDate).toLocaleDateString()}</div>
                  </div>
                  <div className="text-xs">{v.description ? v.description.slice(0, 30) : "—"}</div>
                  <button className="text-xs text-primary hover:underline" onClick={() => setShowHistory((s) => !s)}>view</button>
                </div>
              ))}
            </div>
            <div className="border-t border-border p-3 text-center">
              <button className="text-xs text-primary hover:underline" onClick={() => setShowHistory(true)}>Refresh history</button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Journal Entries / Vouchers</DialogTitle><DialogDescription>Posted vouchers for this organization.</DialogDescription></DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card text-left text-[11px] uppercase text-muted-foreground">
                <tr><th className="p-2">Number</th><th className="p-2">Type</th><th className="p-2">Date</th><th className="p-2">Description</th><th className="p-2">Status</th></tr>
              </thead>
              <tbody>
                {historyList.map((v: any) => (
                  <tr key={v.id} className="border-t border-border/40">
                    <td className="p-2 font-medium">{v.journalNumber}</td>
                    <td className="p-2">{v.voucherType}</td>
                    <td className="p-2">{new Date(v.postingDate).toLocaleDateString()}</td>
                    <td className="p-2 text-muted-foreground">{v.description ?? "—"}</td>
                    <td className="p-2">{v.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowHistory(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
