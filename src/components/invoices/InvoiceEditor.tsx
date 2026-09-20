import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2, Save, Columns2, Rows3, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { GST_STATES } from "./gst";

type Customer = {
  id: string;
  name: string;
  gstNumber?: string | null;
  state?: string | null;
  stateCode?: string | null;
};
type Product = {
  id: string;
  name: string;
  sku: string;
  hsnSac?: string | null;
  sellingPrice?: number | string;
  taxRate?: number | string;
  cessRate?: number | string;
};
type Line = {
  productId: string;
  description: string;
  hsnSac: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  cessRate: number;
};

const num = (v: unknown): number => (typeof v === "number" ? v : Number(v ?? 0) || 0);
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const fmt = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const emptyLine = (): Line => ({
  productId: "",
  description: "",
  hsnSac: "",
  unit: "",
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  taxRate: 18,
  cessRate: 0,
});

export type InvoiceEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  invoiceId?: string | null;
  sellerStateCode?: string | null;
  onSaved?: (invoice: any) => void;
};

export function InvoiceEditor({
  open,
  onOpenChange,
  orgId,
  invoiceId,
  sellerStateCode,
  onSaved,
}: InvoiceEditorProps) {
  const qc = useQueryClient();
  const isEdit = Boolean(invoiceId);

  const [companyId, setCompanyId] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  );
  const [currency, setCurrency] = useState("INR");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [reverseCharge, setReverseCharge] = useState(false);
  const [transportMode, setTransportMode] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [lrNumber, setLrNumber] = useState("");
  const [ewayBillNumber, setEwayBillNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [layout, setLayout] = useState<"VERTICAL" | "HORIZONTAL">("HORIZONTAL");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);

  const { data: customers = [] } = useQuery({
    queryKey: ["inv-customers", orgId],
    queryFn: () => api.get<Customer[]>(`/business-data/organizations/${orgId}/customers`, { params: { limit: "500" } }),
    enabled: open && !!orgId,
  });
  const { data: products = [] } = useQuery({
    queryKey: ["inv-products", orgId],
    queryFn: () => api.get<Product[]>(`/business-data/organizations/${orgId}/products`, { params: { limit: "1000" } }),
    enabled: open && !!orgId,
  });

  const { data: existing } = useQuery({
    queryKey: ["inv-edit", orgId, invoiceId],
    queryFn: () => api.get<any>(`/sales/organizations/${orgId}/invoices/${invoiceId}`),
    enabled: open && !!invoiceId,
  });

  useEffect(() => {
    if (!existing) return;
    setCompanyId(existing.companyId ?? "");
    setIssueDate(existing.issueDate?.slice(0, 10) ?? issueDate);
    setDueDate(existing.dueDate?.slice(0, 10) ?? dueDate);
    setCurrency(existing.currency ?? "INR");
    setPlaceOfSupply(existing.placeOfSupply ?? "");
    setReverseCharge(Boolean(existing.reverseCharge));
    setTransportMode(existing.transportMode ?? "");
    setVehicleNumber(existing.vehicleNumber ?? "");
    setLrNumber(existing.lrNumber ?? "");
    setEwayBillNumber(existing.ewayBillNumber ?? "");
    setNotes(existing.notes ?? "");
    setTerms(existing.terms ?? "");
    setLayout((existing.printFormat as any) ?? "HORIZONTAL");
    setLines(
      (existing.items ?? []).map((it: any) => ({
        productId: it.productId,
        description: it.description ?? "",
        hsnSac: it.hsnSac ?? "",
        unit: it.unit ?? "",
        quantity: it.quantity,
        unitPrice: num(it.unitPrice),
        discount: num(it.discount),
        taxRate: num(it.taxRate),
        cessRate: num(it.cessRate),
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  const customer = customers.find((c) => c.id === companyId);
  useEffect(() => {
    if (customer && !placeOfSupply) {
      setPlaceOfSupply(customer.stateCode || customer.state || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const interState = Boolean(
    sellerStateCode && placeOfSupply && sellerStateCode.trim() !== placeOfSupply.trim(),
  );

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const pickProduct = (i: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    setLine(i, {
      productId,
      description: p ? p.name : "",
      hsnSac: p?.hsnSac ?? "",
      unitPrice: p ? num(p.sellingPrice) : 0,
      taxRate: p ? num(p.taxRate) : 18,
      cessRate: p ? num(p.cessRate) : 0,
    });
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    let taxable = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let cess = 0;
    for (const l of lines) {
      const gross = l.quantity * l.unitPrice;
      const disc = round2(gross * (l.discount / 100));
      const net = round2(gross - disc);
      subtotal += gross;
      discount += disc;
      taxable += net;
      const gst = net * (l.taxRate / 100);
      if (interState) igst += gst;
      else {
        cgst += gst / 2;
        sgst += gst / 2;
      }
      cess += net * (l.cessRate / 100);
    }
    const taxTotal = cgst + sgst + igst + cess;
    const raw = taxable + taxTotal;
    const grand = Math.round(raw);
    return {
      subtotal: round2(subtotal),
      discount: round2(discount),
      taxable: round2(taxable),
      cgst: round2(cgst),
      sgst: round2(sgst),
      igst: round2(igst),
      cess: round2(cess),
      taxTotal: round2(taxTotal),
      roundOff: round2(grand - raw),
      grand,
    };
  }, [lines, interState]);

  const save = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Select a customer");
      const valid = lines.filter((l) => l.productId && l.quantity > 0);
      if (valid.length === 0) throw new Error("Add at least one item");
      const payload = {
        companyId,
        issueDate,
        dueDate,
        currency,
        placeOfSupply: placeOfSupply || undefined,
        reverseCharge,
        transportMode: transportMode || undefined,
        vehicleNumber: vehicleNumber || undefined,
        lrNumber: lrNumber || undefined,
        ewayBillNumber: ewayBillNumber || undefined,
        printFormat: layout,
        notes: notes || undefined,
        terms: terms || undefined,
        items: valid.map((l) => ({
          productId: l.productId,
          description: l.description || undefined,
          hsnSac: l.hsnSac || undefined,
          unit: l.unit || undefined,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discount: l.discount,
          taxRate: l.taxRate,
          cessRate: l.cessRate,
        })),
      };
      if (isEdit) {
        return api.patch(`/sales/organizations/${orgId}/invoices/${invoiceId}`, payload);
      }
      return api.post(`/sales/organizations/${orgId}/invoices`, payload);
    },
    onSuccess: (invoice: any) => {
      qc.invalidateQueries({ queryKey: ["invoices", orgId] });
      toast.success(isEdit ? "Invoice updated" : "Invoice created");
      onSaved?.(invoice);
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Invoice" : "New Invoice"}</DialogTitle>
          <DialogDescription>
            GST invoice with line items. CGST+SGST or IGST is decided by the place of supply.
          </DialogDescription>
        </DialogHeader>

        {/* Header */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 space-y-1.5">
            <Label>Customer *</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent className="max-h-80">
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}{c.gstNumber ? ` · ${c.gstNumber}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Invoice Date</Label>
            <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Due Date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
          </div>
          <div className="space-y-1.5">
            <Label>Place of Supply</Label>
            <Select value={placeOfSupply} onValueChange={setPlaceOfSupply}>
              <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
              <SelectContent className="max-h-80">
                {GST_STATES.map((s) => (
                  <SelectItem key={s.code} value={s.code}>{s.code} · {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Badge variant="secondary" className={interState ? "bg-primary/15 text-primary" : "bg-success/15 text-success"}>
              {interState ? "Inter-state · IGST" : "Intra-state · CGST+SGST"}
            </Badge>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={reverseCharge} onChange={(e) => setReverseCharge(e.target.checked)} />
              Reverse charge
            </label>
          </div>
        </div>

        {/* Layout toggle */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Line Items</div>
          <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
            <Button variant={layout === "HORIZONTAL" ? "secondary" : "ghost"} size="sm" className="h-7" onClick={() => setLayout("HORIZONTAL")}>
              <Columns2 className="mr-1 h-3.5 w-3.5" /> Horizontal
            </Button>
            <Button variant={layout === "VERTICAL" ? "secondary" : "ghost"} size="sm" className="h-7" onClick={() => setLayout("VERTICAL")}>
              <Rows3 className="mr-1 h-3.5 w-3.5" /> Vertical
            </Button>
          </div>
        </div>

        {layout === "HORIZONTAL" ? (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase text-muted-foreground">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="w-24 p-2">HSN/SAC</th>
                  <th className="w-20 p-2">Qty</th>
                  <th className="w-24 p-2">Rate</th>
                  <th className="w-20 p-2">Disc %</th>
                  <th className="w-20 p-2">GST %</th>
                  <th className="w-24 p-2 text-right">Taxable</th>
                  <th className="w-24 p-2 text-right">CGST</th>
                  <th className="w-24 p-2 text-right">SGST</th>
                  <th className="w-24 p-2 text-right">IGST</th>
                  <th className="w-10 p-2" />
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => {
                  const gross = l.quantity * l.unitPrice;
                  const net = round2(gross - round2(gross * (l.discount / 100)));
                  const gst = net * (l.taxRate / 100);
                  const c = interState ? 0 : gst / 2;
                  const s = interState ? 0 : gst / 2;
                  const ig = interState ? gst : 0;
                  return (
                    <tr key={i} className="border-t border-border/50 align-top">
                      <td className="p-1.5">
                        <Select value={l.productId} onValueChange={(v) => pickProduct(i, v)}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Select item" /></SelectTrigger>
                          <SelectContent className="max-h-72">
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.sku} · {p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-1.5"><Input className="h-8" value={l.hsnSac} onChange={(e) => setLine(i, { hsnSac: e.target.value })} /></td>
                      <td className="p-1.5"><Input className="h-8 text-right" type="number" min={1} value={l.quantity} onChange={(e) => setLine(i, { quantity: Number(e.target.value) || 0 })} /></td>
                      <td className="p-1.5"><Input className="h-8 text-right" type="number" step="0.01" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: Number(e.target.value) || 0 })} /></td>
                      <td className="p-1.5"><Input className="h-8 text-right" type="number" step="0.01" value={l.discount} onChange={(e) => setLine(i, { discount: Number(e.target.value) || 0 })} /></td>
                      <td className="p-1.5"><Input className="h-8 text-right" type="number" step="0.01" value={l.taxRate} onChange={(e) => setLine(i, { taxRate: Number(e.target.value) || 0 })} /></td>
                      <td className="p-2 text-right font-mono">{fmt(net)}</td>
                      <td className="p-2 text-right font-mono">{fmt(c)}</td>
                      <td className="p-2 text-right font-mono">{fmt(s)}</td>
                      <td className="p-2 text-right font-mono">{fmt(ig)}</td>
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
          </div>
        ) : (
          <div className="space-y-3">
            {lines.map((l, i) => {
              const gross = l.quantity * l.unitPrice;
              const net = round2(gross - round2(gross * (l.discount / 100)));
              const gst = net * (l.taxRate / 100);
              return (
                <div key={i} className="rounded-md border border-border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
                    {lines.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Item</Label>
                      <Select value={l.productId} onValueChange={(v) => pickProduct(i, v)}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="Select item" /></SelectTrigger>
                        <SelectContent className="max-h-72">
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.sku} · {p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label className="text-xs">HSN/SAC</Label><Input className="h-8" value={l.hsnSac} onChange={(e) => setLine(i, { hsnSac: e.target.value })} /></div>
                    <div className="space-y-1"><Label className="text-xs">Unit</Label><Input className="h-8" value={l.unit} onChange={(e) => setLine(i, { unit: e.target.value })} /></div>
                    <div className="space-y-1"><Label className="text-xs">Qty</Label><Input className="h-8 text-right" type="number" value={l.quantity} onChange={(e) => setLine(i, { quantity: Number(e.target.value) || 0 })} /></div>
                    <div className="space-y-1"><Label className="text-xs">Rate</Label><Input className="h-8 text-right" type="number" step="0.01" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: Number(e.target.value) || 0 })} /></div>
                    <div className="space-y-1"><Label className="text-xs">Disc %</Label><Input className="h-8 text-right" type="number" step="0.01" value={l.discount} onChange={(e) => setLine(i, { discount: Number(e.target.value) || 0 })} /></div>
                    <div className="space-y-1"><Label className="text-xs">GST %</Label><Input className="h-8 text-right" type="number" step="0.01" value={l.taxRate} onChange={(e) => setLine(i, { taxRate: Number(e.target.value) || 0 })} /></div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Taxable: <b className="text-foreground">{fmt(net)}</b></span>
                    {interState ? <span>IGST: <b className="text-foreground">{fmt(gst)}</b></span> : (
                      <>
                        <span>CGST: <b className="text-foreground">{fmt(gst / 2)}</b></span>
                        <span>SGST: <b className="text-foreground">{fmt(gst / 2)}</b></span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Button variant="outline" size="sm" onClick={() => setLines((prev) => [...prev, emptyLine()])}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Item
        </Button>

        {/* Totals + notes */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Transport / e-Way</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Transport mode" value={transportMode} onChange={(e) => setTransportMode(e.target.value)} />
                <Input placeholder="Vehicle no." value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
                <Input placeholder="LR / Docket no." value={lrNumber} onChange={(e) => setLrNumber(e.target.value)} />
                <Input placeholder="e-Way bill no." value={ewayBillNumber} onChange={(e) => setEwayBillNumber(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Terms &amp; Conditions</Label>
              <Textarea rows={2} value={terms} onChange={(e) => setTerms(e.target.value)} />
            </div>
          </div>
          <div className="rounded-md border border-border p-3 text-sm">
            <Row label="Subtotal" value={totals.subtotal} />
            <Row label="Discount" value={totals.discount} />
            <Row label="Taxable Amount" value={totals.taxable} strong />
            {interState ? (
              <Row label="IGST" value={totals.igst} />
            ) : (
              <>
                <Row label="CGST" value={totals.cgst} />
                <Row label="SGST" value={totals.sgst} />
              </>
            )}
            {totals.cess > 0 && <Row label="Cess" value={totals.cess} />}
            <Row label="Round Off" value={totals.roundOff} />
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-base font-semibold">
              <span>Grand Total</span>
              <span>{fmt(totals.grand)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          {!companyId && (
            <span className="mr-auto flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" /> Select a customer to save
            </span>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="gradient-primary text-white" disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            {isEdit ? "Save Changes" : "Create Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className={strong ? "font-medium" : "text-muted-foreground"}>{label}</span>
      <span className={strong ? "font-medium" : ""}>{fmt(value)}</span>
    </div>
  );
}
