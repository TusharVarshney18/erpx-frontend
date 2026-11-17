import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Download,
  FileText,
  Info,
  Landmark,
  Receipt,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageShell";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { stateName, toStateCode } from "@/components/invoices/gst";

export const Route = createFileRoute("/reports/gst")({
  head: () => ({ meta: [{ title: "GST Returns — ERPX" }] }),
  component: () => (
    <PremiumGate feature="advancedReports">
      <GstReturnsPage />
    </PremiumGate>
  ),
});

// ─── API shapes (from /accounting/organizations/:orgId/statutory/*) ──────────

type Heads = { cgst: number; sgst: number; igst: number; cess: number };
type Valued = Heads & { taxableValue: number };
interface Gstr3b {
  outward: Valued;
  creditNotes: Valued;
  itc: Heads;
  itcReduced: Heads;
  netPayable: Heads;
  itcUtilised: Record<keyof Heads, Heads>;
  itcBalance: Heads;
}
interface B2bRow extends Valued {
  invoiceNumber: string;
  invoiceDate: string;
  buyerGstin: string;
  placeOfSupply: string | null;
  invoiceValue: number;
}
interface B2cRow extends Valued {
  placeOfSupply: string | null;
  supplyType: string | null;
}
interface NoteRow extends Valued {
  noteNumber: string;
  noteDate: string;
  originalDocumentNumber: string | null;
  partyGstin: string | null;
  placeOfSupply: string | null;
  noteValue: number;
}
interface HsnRow extends Valued {
  hsnSac: string | null;
  gstRate: number;
  totalValue: number;
}
interface Gstr1 {
  b2b: B2bRow[];
  b2c: B2cRow[];
  creditNotes: NoteRow[];
  hsnSummary: HsnRow[];
  totals: Valued;
  netTotals: Valued;
}
interface GstException {
  type: "MISSING_HSN" | "MISSING_GSTIN" | "INVALID_GSTIN" | "RATE_MISMATCH" | "UNBALANCED_RCM";
  reference: string;
  detail: string;
}
interface MonthRow {
  period: string;
  outwardSupply: number;
  outputTax: number;
  inputTaxCredit: number;
  taxPayable: number;
  dueDate: string;
  status: "NIL" | "IN_PROGRESS" | "READY_TO_FILE" | "DUE_DATE_PASSED";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const HEADS: { key: keyof Heads; label: string }[] = [
  { key: "igst", label: "IGST" },
  { key: "cgst", label: "CGST" },
  { key: "sgst", label: "SGST" },
  { key: "cess", label: "Cess" },
];
const amt = (n: number | null | undefined) => formatINR(n ?? 0, { decimals: 2 });
const sumHeads = (h?: Heads) => (h ? h.cgst + h.sgst + h.igst + h.cess : 0);
const periodLabel = (p: string) => {
  const [y, m] = p.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};
const dateLabel = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const pos = (v: string | null) => {
  const code = toStateCode(v);
  return code ? `${code}-${stateName(code)}` : v || "—";
};
/** Return due on the 20th of the month after the period. */
const dueDateOf = (p: string) => {
  const [y, m] = p.split("-").map(Number);
  return new Date(y, m, 20);
};

function lastMonths(n: number) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const EXCEPTION_HELP: Record<GstException["type"], { label: string; fix: string }> = {
  MISSING_HSN: {
    label: "Missing HSN/SAC",
    fix: "Add the HSN/SAC code to the product, then edit the invoice line.",
  },
  MISSING_GSTIN: {
    label: "Missing GSTIN",
    fix: "Add the customer's GSTIN, or treat the supply as B2C.",
  },
  INVALID_GSTIN: {
    label: "Invalid GSTIN",
    fix: "Correct the GSTIN on the customer record (15 characters, state code first).",
  },
  RATE_MISMATCH: {
    label: "Rate mismatch",
    fix: "The tax charged doesn't match the GST rate. Check the line's rate and amounts.",
  },
  UNBALANCED_RCM: {
    label: "Reverse charge",
    fix: "Reverse-charge supply needs matching liability and credit entries.",
  },
};

// ─── Page ────────────────────────────────────────────────────────────────────

function GstReturnsPage() {
  const { activeOrganizationId: orgId } = useAuth();
  const months = useMemo(() => lastMonths(12), []);
  // Default to last month — the return that is usually being prepared.
  const [period, setPeriod] = useState(months[1]);
  const [tab, setTab] = useState("gstr3b");
  const base = `/accounting/organizations/${orgId}/statutory`;

  const q3b = useQuery({
    queryKey: ["gstr3b", orgId, period],
    queryFn: () => api.get<Gstr3b>(`${base}/gstr3b`, { params: { period } }),
    enabled: !!orgId,
  });
  const q1 = useQuery({
    queryKey: ["gstr1", orgId, period],
    queryFn: () => api.get<Gstr1>(`${base}/gstr1`, { params: { period } }),
    enabled: !!orgId,
  });
  const qEx = useQuery({
    queryKey: ["gst-exceptions", orgId, period],
    queryFn: () => api.get<GstException[]>(`${base}/exceptions`, { params: { period } }),
    enabled: !!orgId,
  });
  const qSummary = useQuery({
    queryKey: ["gst-summary", orgId],
    queryFn: () => api.get<MonthRow[]>(`${base}/summary`),
    enabled: !!orgId,
  });

  const g3 = q3b.data;
  const g1 = q1.data;
  const exceptions = qEx.data ?? [];
  const error = q3b.error ?? q1.error;
  const forbidden = !!error && /forbidden|permission|403/i.test((error as Error).message);

  const due = dueDateOf(period);
  const cash = sumHeads(g3?.netPayable);
  const duePassed = new Date() > due;

  const exportCurrent = () => {
    if (tab === "gstr3b" && g3) {
      downloadCsv(
        `GSTR-3B_${period}.csv`,
        ["Section", "Taxable value", "IGST", "CGST", "SGST", "Cess"],
        [
          [
            "3.1 Outward supplies (net)",
            g3.outward.taxableValue,
            g3.outward.igst,
            g3.outward.cgst,
            g3.outward.sgst,
            g3.outward.cess,
          ],
          [
            "Less: credit notes",
            g3.creditNotes.taxableValue,
            g3.creditNotes.igst,
            g3.creditNotes.cgst,
            g3.creditNotes.sgst,
            g3.creditNotes.cess,
          ],
          ["4 ITC available (net)", "", g3.itc.igst, g3.itc.cgst, g3.itc.sgst, g3.itc.cess],
          [
            "Less: debit notes",
            "",
            g3.itcReduced.igst,
            g3.itcReduced.cgst,
            g3.itcReduced.sgst,
            g3.itcReduced.cess,
          ],
          [
            "6.1 Tax payable in cash",
            "",
            g3.netPayable.igst,
            g3.netPayable.cgst,
            g3.netPayable.sgst,
            g3.netPayable.cess,
          ],
          [
            "ITC carried forward",
            "",
            g3.itcBalance.igst,
            g3.itcBalance.cgst,
            g3.itcBalance.sgst,
            g3.itcBalance.cess,
          ],
        ],
      );
    } else if (tab === "gstr1" && g1) {
      downloadCsv(
        `GSTR-1_${period}.csv`,
        [
          "Table",
          "Document",
          "Date",
          "GSTIN",
          "Place of supply",
          "Taxable value",
          "IGST",
          "CGST",
          "SGST",
          "Cess",
          "Value",
        ],
        [
          ...g1.b2b.map((r) => [
            "B2B",
            r.invoiceNumber,
            dateLabel(r.invoiceDate),
            r.buyerGstin,
            pos(r.placeOfSupply),
            r.taxableValue,
            r.igst,
            r.cgst,
            r.sgst,
            r.cess,
            r.invoiceValue,
          ]),
          ...g1.b2c.map((r) => [
            "B2C",
            "",
            "",
            "",
            pos(r.placeOfSupply),
            r.taxableValue,
            r.igst,
            r.cgst,
            r.sgst,
            r.cess,
            r.taxableValue + sumHeads(r),
          ]),
          ...g1.creditNotes.map((r) => [
            "CDN",
            `${r.noteNumber} (against ${r.originalDocumentNumber ?? "—"})`,
            dateLabel(r.noteDate),
            r.partyGstin ?? "",
            pos(r.placeOfSupply),
            -r.taxableValue,
            -r.igst,
            -r.cgst,
            -r.sgst,
            -r.cess,
            -r.noteValue,
          ]),
          ...g1.hsnSummary.map((r) => [
            "HSN",
            `${r.hsnSac ?? "—"} @ ${r.gstRate}%`,
            "",
            "",
            "",
            r.taxableValue,
            r.igst,
            r.cgst,
            r.sgst,
            r.cess,
            r.totalValue,
          ]),
        ],
      );
    } else if (tab === "checks") {
      downloadCsv(
        `GST-checks_${period}.csv`,
        ["Issue", "Document", "Detail", "How to fix"],
        exceptions.map((e) => [
          EXCEPTION_HELP[e.type]?.label ?? e.type,
          e.reference,
          e.detail,
          EXCEPTION_HELP[e.type]?.fix ?? "",
        ]),
      );
    } else if (tab === "history" && qSummary.data) {
      downloadCsv(
        "GSTR-3B_12-months.csv",
        [
          "Month",
          "Outward taxable value",
          "Output tax",
          "Input tax credit",
          "Cash payable",
          "Due date",
          "Status",
        ],
        qSummary.data.map((r) => [
          periodLabel(r.period),
          r.outwardSupply,
          r.outputTax,
          r.inputTaxCredit,
          r.taxPayable,
          dateLabel(r.dueDate),
          r.status,
        ]),
      );
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        title="GST Returns"
        subtitle={`GSTR-1 and GSTR-3B for ${periodLabel(period)}, prepared from your books`}
        actions={
          <>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-10 w-[190px]" aria-label="Return period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m} value={m}>
                    {periodLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="h-10"
              onClick={exportCurrent}
              disabled={!g3 && !g1}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </>
        }
      />

      <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info/[0.06] px-4 py-3 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
        <p className="text-muted-foreground">
          Figures come from posted invoices, bills and vouchers. ERPX prepares the returns; review
          them, then file on the GST portal (gst.gov.in).
        </p>
      </div>

      {forbidden ? (
        <Card className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <ShieldCheck className="h-8 w-8 text-muted-foreground" />
          <div className="font-semibold">You need the “GST report” permission</div>
          <p className="max-w-md text-sm text-muted-foreground">
            Ask an administrator to add <span className="font-mono">gst_report:read</span> to your
            role.
          </p>
        </Card>
      ) : error ? (
        <Card className="flex flex-col items-center gap-2 px-6 py-14 text-center text-destructive">
          <AlertTriangle className="h-8 w-8" />
          <div className="font-semibold">Couldn't load GST data</div>
          <p className="text-sm">{(error as Error).message}</p>
        </Card>
      ) : (
        <>
          {/* Summary figures */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Figure
              icon={FileText}
              label="Outward taxable value"
              value={g3?.outward.taxableValue}
              loading={q3b.isLoading}
              note="Net of credit notes"
            />
            <Figure
              icon={Receipt}
              label="Output tax"
              value={sumHeads(g3?.outward)}
              loading={q3b.isLoading}
              note="IGST + CGST + SGST + Cess"
            />
            <Figure
              icon={Landmark}
              label="Input tax credit"
              value={sumHeads(g3?.itc)}
              loading={q3b.isLoading}
              note="Net of debit notes"
            />
            <Figure
              icon={Wallet}
              label="Tax to pay in cash"
              value={cash}
              loading={q3b.isLoading}
              emphasis
              note={
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    cash > 0 && duePassed ? "text-destructive" : "",
                  )}
                >
                  <CalendarClock className="h-3.5 w-3.5" />
                  {cash > 0
                    ? `${duePassed ? "Due date passed" : "Due"} ${due.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                    : "Nothing to pay this month"}
                </span>
              }
            />
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="gstr3b">GSTR-3B</TabsTrigger>
              <TabsTrigger value="gstr1">GSTR-1</TabsTrigger>
              <TabsTrigger value="checks" className="gap-1.5">
                Checks
                {exceptions.length > 0 && (
                  <span className="rounded-full bg-warning/15 px-1.5 text-[11px] font-semibold text-warning">
                    {exceptions.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">12-month view</TabsTrigger>
            </TabsList>

            <TabsContent value="gstr3b" className="mt-4 space-y-4">
              {q3b.isLoading || !g3 ? (
                <Skeleton className="h-80 w-full rounded-2xl" />
              ) : (
                <Gstr3bView g={g3} />
              )}
            </TabsContent>
            <TabsContent value="gstr1" className="mt-4 space-y-4">
              {q1.isLoading || !g1 ? (
                <Skeleton className="h-80 w-full rounded-2xl" />
              ) : (
                <Gstr1View g={g1} />
              )}
            </TabsContent>
            <TabsContent value="checks" className="mt-4">
              <ChecksView items={exceptions} loading={qEx.isLoading} />
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <HistoryView
                rows={qSummary.data ?? []}
                loading={qSummary.isLoading}
                onOpen={(p) => {
                  setPeriod(p);
                  setTab("gstr3b");
                }}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

// ─── Building blocks ─────────────────────────────────────────────────────────

function Figure({
  icon: Icon,
  label,
  value,
  note,
  loading,
  emphasis,
}: {
  icon: typeof FileText;
  label: string;
  value?: number;
  note: ReactNode;
  loading?: boolean;
  emphasis?: boolean;
}) {
  return (
    <Card className={cn("p-5", emphasis && "border-primary/30 bg-primary/[0.03]")}>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-32" />
      ) : (
        <div className="mt-2 font-display text-2xl font-bold tracking-tight tabular-nums">
          {amt(value)}
        </div>
      )}
      <div className="mt-1.5 text-xs text-muted-foreground">{note}</div>
    </Card>
  );
}

function Section({
  title,
  hint,
  children,
  count,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  count?: number;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/70 px-5 py-4">
        <div>
          <h3 className="font-display text-[15px] font-semibold tracking-tight">
            {title}
            {count !== undefined && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">({count})</span>
            )}
          </h3>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </Card>
  );
}

const th =
  "h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground whitespace-nowrap";
const thNum = cn(th, "text-right");
const td = "px-4 py-2.5 whitespace-nowrap";
const tdNum = cn(td, "text-right tabular-nums");

function HeadCells({ v, negative }: { v: Partial<Heads>; negative?: boolean }) {
  return (
    <>
      {HEADS.map((h) => (
        <td key={h.key} className={tdNum}>
          {negative && (v[h.key] ?? 0) !== 0 ? `(${amt(v[h.key])})` : amt(v[h.key])}
        </td>
      ))}
    </>
  );
}

function Gstr3bView({ g }: { g: Gstr3b }) {
  const grossOut: Valued = {
    taxableValue: g.outward.taxableValue + g.creditNotes.taxableValue,
    igst: g.outward.igst + g.creditNotes.igst,
    cgst: g.outward.cgst + g.creditNotes.cgst,
    sgst: g.outward.sgst + g.creditNotes.sgst,
    cess: g.outward.cess + g.creditNotes.cess,
  };
  const grossItc: Heads = {
    igst: g.itc.igst + g.itcReduced.igst,
    cgst: g.itc.cgst + g.itcReduced.cgst,
    sgst: g.itc.sgst + g.itcReduced.sgst,
    cess: g.itc.cess + g.itcReduced.cess,
  };
  const row = "border-t border-border/60";
  const total = "border-t-2 border-border bg-muted/40 font-semibold";

  return (
    <>
      <Section
        title="3.1 Outward taxable supplies"
        hint="Sales invoices and sales vouchers, less credit notes"
      >
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className={th}>Particulars</th>
              <th className={thNum}>Taxable value</th>
              {HEADS.map((h) => (
                <th key={h.key} className={thNum}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className={row}>
              <td className={td}>Outward supplies</td>
              <td className={tdNum}>{amt(grossOut.taxableValue)}</td>
              <HeadCells v={grossOut} />
            </tr>
            <tr className={row}>
              <td className={cn(td, "text-muted-foreground")}>Less: credit notes</td>
              <td className={tdNum}>
                {g.creditNotes.taxableValue ? `(${amt(g.creditNotes.taxableValue)})` : amt(0)}
              </td>
              <HeadCells v={g.creditNotes} negative />
            </tr>
            <tr className={total}>
              <td className={td}>Net outward supplies</td>
              <td className={tdNum}>{amt(g.outward.taxableValue)}</td>
              <HeadCells v={g.outward} />
            </tr>
          </tbody>
        </table>
      </Section>

      <Section
        title="4. Eligible input tax credit"
        hint="Posted purchase bills and purchase vouchers, less debit notes"
      >
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className={th}>Particulars</th>
              {HEADS.map((h) => (
                <th key={h.key} className={thNum}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className={row}>
              <td className={td}>ITC available</td>
              <HeadCells v={grossItc} />
            </tr>
            <tr className={row}>
              <td className={cn(td, "text-muted-foreground")}>Less: debit notes</td>
              <HeadCells v={g.itcReduced} negative />
            </tr>
            <tr className={total}>
              <td className={td}>Net ITC available</td>
              <HeadCells v={g.itc} />
            </tr>
          </tbody>
        </table>
      </Section>

      <Section
        title="6.1 Payment of tax"
        hint="Credit is set off in the order the law requires: IGST credit first, then CGST and SGST. CGST credit never pays SGST, and vice versa."
      >
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className={th}>Tax</th>
              <th className={thNum}>Payable</th>
              {HEADS.map((h) => (
                <th key={h.key} className={thNum}>
                  Paid via {h.label} credit
                </th>
              ))}
              <th className={thNum}>Paid in cash</th>
            </tr>
          </thead>
          <tbody>
            {HEADS.map((liab) => {
              const payable = Math.max(0, g.outward[liab.key]);
              return (
                <tr key={liab.key} className={row}>
                  <td className={cn(td, "font-medium")}>{liab.label}</td>
                  <td className={tdNum}>{amt(payable)}</td>
                  {HEADS.map((from) => {
                    const v = g.itcUtilised[from.key]?.[liab.key] ?? 0;
                    return (
                      <td
                        key={from.key}
                        className={cn(tdNum, v === 0 && "text-muted-foreground/50")}
                      >
                        {v === 0 ? "—" : amt(v)}
                      </td>
                    );
                  })}
                  <td
                    className={cn(
                      tdNum,
                      "font-semibold",
                      g.netPayable[liab.key] > 0 && "text-foreground",
                    )}
                  >
                    {amt(g.netPayable[liab.key])}
                  </td>
                </tr>
              );
            })}
            <tr className={total}>
              <td className={td}>Total</td>
              <td className={tdNum}>
                {amt(HEADS.reduce((s, h) => s + Math.max(0, g.outward[h.key]), 0))}
              </td>
              {HEADS.map((from) => (
                <td key={from.key} className={tdNum}>
                  {amt(sumHeads(g.itcUtilised[from.key]))}
                </td>
              ))}
              <td className={tdNum}>{amt(sumHeads(g.netPayable))}</td>
            </tr>
          </tbody>
        </table>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/70 bg-muted/20 px-5 py-3 text-sm">
          <span className="font-medium">Credit carried forward to next month:</span>
          {HEADS.map((h) => (
            <span key={h.key} className="tabular-nums text-muted-foreground">
              {h.label}{" "}
              <span className="font-semibold text-foreground">{amt(g.itcBalance[h.key])}</span>
            </span>
          ))}
        </div>
      </Section>
    </>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="px-5 py-10 text-center text-sm text-muted-foreground">{children}</div>;
}

function Gstr1View({ g }: { g: Gstr1 }) {
  const row = "border-t border-border/60";
  const foot = "border-t-2 border-border bg-muted/40 font-semibold";
  const sum = <T extends Valued>(rows: T[]) =>
    rows.reduce(
      (s, r) => ({
        taxableValue: s.taxableValue + r.taxableValue,
        igst: s.igst + r.igst,
        cgst: s.cgst + r.cgst,
        sgst: s.sgst + r.sgst,
        cess: s.cess + r.cess,
      }),
      { taxableValue: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 },
    );
  const b2bT = sum(g.b2b);
  const b2cT = sum(g.b2c);
  const cnT = sum(g.creditNotes);

  return (
    <>
      <Section
        title="4A. B2B invoices"
        hint="Supplies to registered customers (with GSTIN)"
        count={g.b2b.length}
      >
        {g.b2b.length === 0 ? (
          <Empty>No B2B invoices in this period.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className={th}>Invoice</th>
                <th className={th}>Date</th>
                <th className={th}>Customer GSTIN</th>
                <th className={th}>Place of supply</th>
                <th className={thNum}>Taxable value</th>
                {HEADS.map((h) => (
                  <th key={h.key} className={thNum}>
                    {h.label}
                  </th>
                ))}
                <th className={thNum}>Invoice value</th>
              </tr>
            </thead>
            <tbody>
              {g.b2b.map((r) => (
                <tr key={r.invoiceNumber} className={row}>
                  <td className={cn(td, "font-medium")}>{r.invoiceNumber}</td>
                  <td className={td}>{dateLabel(r.invoiceDate)}</td>
                  <td className={cn(td, "font-mono text-xs")}>{r.buyerGstin}</td>
                  <td className={td}>{pos(r.placeOfSupply)}</td>
                  <td className={tdNum}>{amt(r.taxableValue)}</td>
                  <HeadCells v={r} />
                  <td className={cn(tdNum, "font-medium")}>{amt(r.invoiceValue)}</td>
                </tr>
              ))}
              <tr className={foot}>
                <td className={td} colSpan={4}>
                  Total
                </td>
                <td className={tdNum}>{amt(b2bT.taxableValue)}</td>
                <HeadCells v={b2bT} />
                <td className={tdNum}>{amt(b2bT.taxableValue + sumHeads(b2bT))}</td>
              </tr>
            </tbody>
          </table>
        )}
      </Section>

      <Section
        title="7. B2C supplies"
        hint="Unregistered customers, summarised by place of supply"
        count={g.b2c.length}
      >
        {g.b2c.length === 0 ? (
          <Empty>No B2C supplies in this period.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className={th}>Place of supply</th>
                <th className={th}>Type</th>
                <th className={thNum}>Taxable value</th>
                {HEADS.map((h) => (
                  <th key={h.key} className={thNum}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {g.b2c.map((r, i) => (
                <tr key={i} className={row}>
                  <td className={td}>{pos(r.placeOfSupply)}</td>
                  <td className={td}>
                    <Badge variant="secondary">
                      {r.supplyType === "INTER" ? "Inter-state" : "Intra-state"}
                    </Badge>
                  </td>
                  <td className={tdNum}>{amt(r.taxableValue)}</td>
                  <HeadCells v={r} />
                </tr>
              ))}
              <tr className={foot}>
                <td className={td} colSpan={2}>
                  Total
                </td>
                <td className={tdNum}>{amt(b2cT.taxableValue)}</td>
                <HeadCells v={b2cT} />
              </tr>
            </tbody>
          </table>
        )}
      </Section>

      <Section
        title="9B. Credit notes"
        hint="Notes issued to customers — these reduce your outward tax"
        count={g.creditNotes.length}
      >
        {g.creditNotes.length === 0 ? (
          <Empty>No credit notes in this period.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className={th}>Note</th>
                <th className={th}>Date</th>
                <th className={th}>Against invoice</th>
                <th className={th}>GSTIN</th>
                <th className={thNum}>Taxable value</th>
                {HEADS.map((h) => (
                  <th key={h.key} className={thNum}>
                    {h.label}
                  </th>
                ))}
                <th className={thNum}>Note value</th>
              </tr>
            </thead>
            <tbody>
              {g.creditNotes.map((r) => (
                <tr key={r.noteNumber} className={row}>
                  <td className={cn(td, "font-medium")}>{r.noteNumber}</td>
                  <td className={td}>{dateLabel(r.noteDate)}</td>
                  <td className={td}>{r.originalDocumentNumber ?? "—"}</td>
                  <td className={cn(td, "font-mono text-xs")}>{r.partyGstin ?? "Unregistered"}</td>
                  <td className={tdNum}>{amt(r.taxableValue)}</td>
                  <HeadCells v={r} />
                  <td className={cn(tdNum, "font-medium")}>{amt(r.noteValue)}</td>
                </tr>
              ))}
              <tr className={foot}>
                <td className={td} colSpan={4}>
                  Total
                </td>
                <td className={tdNum}>{amt(cnT.taxableValue)}</td>
                <HeadCells v={cnT} />
                <td className={tdNum}>{amt(cnT.taxableValue + sumHeads(cnT))}</td>
              </tr>
            </tbody>
          </table>
        )}
      </Section>

      <Section title="12. HSN-wise summary" hint="Net of credit notes" count={g.hsnSummary.length}>
        {g.hsnSummary.length === 0 ? (
          <Empty>No HSN data in this period.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className={th}>HSN / SAC</th>
                <th className={thNum}>Rate</th>
                <th className={thNum}>Taxable value</th>
                {HEADS.map((h) => (
                  <th key={h.key} className={thNum}>
                    {h.label}
                  </th>
                ))}
                <th className={thNum}>Total value</th>
              </tr>
            </thead>
            <tbody>
              {g.hsnSummary.map((r) => (
                <tr key={`${r.hsnSac}-${r.gstRate}`} className={row}>
                  <td className={cn(td, "font-mono text-xs", !r.hsnSac && "text-warning")}>
                    {r.hsnSac ?? "Missing"}
                  </td>
                  <td className={tdNum}>{r.gstRate}%</td>
                  <td className={tdNum}>{amt(r.taxableValue)}</td>
                  <HeadCells v={r} />
                  <td className={cn(tdNum, "font-medium")}>{amt(r.totalValue)}</td>
                </tr>
              ))}
              <tr className={foot}>
                <td className={td} colSpan={2}>
                  Net total
                </td>
                <td className={tdNum}>{amt(g.netTotals.taxableValue)}</td>
                <HeadCells v={g.netTotals} />
                <td className={tdNum}>{amt(g.netTotals.taxableValue + sumHeads(g.netTotals))}</td>
              </tr>
            </tbody>
          </table>
        )}
      </Section>
    </>
  );
}

function ChecksView({ items, loading }: { items: GstException[]; loading: boolean }) {
  if (loading) return <Skeleton className="h-48 w-full rounded-2xl" />;
  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 px-6 py-14 text-center">
        <CheckCircle2 className="h-9 w-9 text-success" />
        <div className="font-semibold">No problems found</div>
        <p className="max-w-md text-sm text-muted-foreground">
          Every document in this period has an HSN/SAC code, a valid GSTIN where needed, and tax
          that matches its rate.
        </p>
      </Card>
    );
  }
  return (
    <Section
      title="Fix before filing"
      hint="These would be rejected or flagged on the GST portal"
      count={items.length}
    >
      <ul className="divide-y divide-border/60">
        {items.map((e, i) => {
          const help = EXCEPTION_HELP[e.type];
          return (
            <li
              key={i}
              className="flex flex-col gap-1.5 px-5 py-3.5 sm:flex-row sm:items-start sm:gap-4"
            >
              <Badge
                variant="outline"
                className="w-fit shrink-0 border-warning/30 bg-warning/10 text-warning"
              >
                <AlertTriangle className="h-3 w-3" /> {help?.label ?? e.type}
              </Badge>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{e.reference}</div>
                <div className="text-sm text-muted-foreground">{e.detail}</div>
                {help && (
                  <div className="mt-1 text-xs text-muted-foreground">How to fix: {help.fix}</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

const STATUS: Record<MonthRow["status"], { label: string; cls: string }> = {
  NIL: { label: "No activity", cls: "border-border bg-muted text-muted-foreground" },
  IN_PROGRESS: { label: "Month in progress", cls: "border-info/25 bg-info/10 text-info" },
  READY_TO_FILE: { label: "Ready to file", cls: "border-primary/25 bg-primary/10 text-primary" },
  DUE_DATE_PASSED: {
    label: "Due date passed",
    cls: "border-warning/30 bg-warning/10 text-warning",
  },
};

function HistoryView({
  rows,
  loading,
  onOpen,
}: {
  rows: MonthRow[];
  loading: boolean;
  onOpen: (p: string) => void;
}) {
  if (loading) return <Skeleton className="h-80 w-full rounded-2xl" />;
  return (
    <Section
      title="GSTR-3B — last 12 months"
      hint="Status shows where each month stands against its due date (20th of the next month). ERPX can't see what you've filed on the portal."
    >
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className={th}>Month</th>
            <th className={thNum}>Outward taxable value</th>
            <th className={thNum}>Output tax</th>
            <th className={thNum}>Input tax credit</th>
            <th className={thNum}>Cash payable</th>
            <th className={th}>Due date</th>
            <th className={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.period}
              className="cursor-pointer border-t border-border/60 transition-colors hover:bg-primary/[0.03]"
              onClick={() => onOpen(r.period)}
            >
              <td className={cn(td, "font-medium text-primary")}>{periodLabel(r.period)}</td>
              <td className={tdNum}>{amt(r.outwardSupply)}</td>
              <td className={tdNum}>{amt(r.outputTax)}</td>
              <td className={tdNum}>{amt(r.inputTaxCredit)}</td>
              <td className={cn(tdNum, "font-semibold")}>{amt(r.taxPayable)}</td>
              <td className={td}>{dateLabel(r.dueDate)}</td>
              <td className={td}>
                <Badge variant="outline" className={STATUS[r.status]?.cls}>
                  {STATUS[r.status]?.label ?? r.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}
