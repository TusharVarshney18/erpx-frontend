import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, X, Columns2, Rows3 } from "lucide-react";

const fmt = (v: unknown) =>
  (Number(v ?? 0) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtQty = (v: unknown) => (Number(v ?? 0) || 0).toLocaleString("en-IN");
const dateStr = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN") : "");

export type InvoicePrintProps = {
  data: any;
  initialFormat?: "VERTICAL" | "HORIZONTAL";
  onClose: () => void;
};

type CopyType = "ORIGINAL" | "DUPLICATE" | "TRIPLICATE";
const COPY_LABEL: Record<CopyType, string> = {
  ORIGINAL: "Original for Recipient",
  DUPLICATE: "Duplicate for Transporter",
  TRIPLICATE: "Triplicate for Supplier",
};

export function InvoicePrint({ data, initialFormat = "VERTICAL", onClose }: InvoicePrintProps) {
  const [format, setFormat] = useState<"VERTICAL" | "HORIZONTAL">(initialFormat);
  const [copy, setCopy] = useState<CopyType>("ORIGINAL");
  const { invoice, seller, customer, taxSummary } = data;

  const sellerName = seller?.legalName || seller?.tradeName || "Company";
  const sellerAddr = [
    seller?.addressLine1,
    seller?.addressLine2,
    [seller?.city, seller?.postalCode].filter(Boolean).join(" "),
    seller?.state,
  ]
    .filter(Boolean)
    .join(", ");
  const buyerAddr = [
    customer?.billingAddress,
    [customer?.city, customer?.postalCode].filter(Boolean).join(" "),
    customer?.state,
  ]
    .filter(Boolean)
    .join(", ");

  const interState = useMemo(() => Number(invoice.totalIgst ?? 0) > 0, [invoice]);

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-neutral-200">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .invoice-print-area, .invoice-print-area * { visibility: visible !important; }
          .invoice-print-area { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; }
          .no-print { display: none !important; }
          @page { size: A4 ${format === "HORIZONTAL" ? "landscape" : "portrait"}; margin: 10mm; }
        }
        .invoice-print-area { font-family: ui-sans-serif, system-ui, sans-serif; color: #111; }
        .inv-table { border-collapse: collapse; width: 100%; }
        .inv-table th, .inv-table td { border: 1px solid #999; padding: 4px 6px; }
      `}</style>

      {/* Toolbar */}
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b bg-white px-4 py-2">
        <span className="mr-auto text-sm font-semibold">Print Preview — {invoice.invoiceNumber}</span>
        <div className="flex items-center gap-1 rounded-md border p-0.5">
          <Button variant={format === "VERTICAL" ? "secondary" : "ghost"} size="sm" className="h-7" onClick={() => setFormat("VERTICAL")}>
            <Rows3 className="mr-1 h-3.5 w-3.5" /> Vertical
          </Button>
          <Button variant={format === "HORIZONTAL" ? "secondary" : "ghost"} size="sm" className="h-7" onClick={() => setFormat("HORIZONTAL")}>
            <Columns2 className="mr-1 h-3.5 w-3.5" /> Horizontal
          </Button>
        </div>
        <select
          className="h-8 rounded-md border px-2 text-sm"
          value={copy}
          onChange={(e) => setCopy(e.target.value as CopyType)}
        >
          {(Object.keys(COPY_LABEL) as CopyType[]).map((c) => (
            <option key={c} value={c}>{COPY_LABEL[c]}</option>
          ))}
        </select>
        <Button size="sm" className="gradient-primary text-white" onClick={handlePrint}>
          <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
        </Button>
        <Button size="sm" variant="outline" onClick={onClose}>
          <X className="mr-1.5 h-3.5 w-3.5" /> Close
        </Button>
      </div>

      {/* Printable area */}
      <div className="invoice-print-area mx-auto my-4 bg-white p-6 shadow" style={{ width: format === "HORIZONTAL" ? "1100px" : "800px" }}>
        <div className="mb-1 text-right text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          {COPY_LABEL[copy]}
        </div>

        {/* Header */}
        <div className="border-b-2 border-neutral-800 pb-2 text-center">
          <div className="text-xl font-bold uppercase">{sellerName}</div>
          {sellerAddr && <div className="text-xs">{sellerAddr}</div>}
          <div className="text-xs">
            {seller?.gstin ? `GSTIN: ${seller.gstin}` : ""}{seller?.pan ? `  ·  PAN: ${seller.pan}` : ""}
            {seller?.phone ? `  ·  Ph: ${seller.phone}` : ""}{seller?.email ? `  ·  ${seller.email}` : ""}
          </div>
          <div className="mt-1 text-base font-bold tracking-widest">TAX INVOICE</div>
        </div>

        {/* Meta + party */}
        <div className="grid grid-cols-2 gap-2 border-b border-neutral-400 py-2 text-xs">
          <div>
            <div className="font-semibold">Bill To</div>
            <div className="font-medium">{customer?.name}</div>
            {buyerAddr && <div>{buyerAddr}</div>}
            {customer?.gstNumber && <div>GSTIN: {customer.gstNumber}</div>}
            {customer?.phone && <div>Ph: {customer.phone}</div>}
          </div>
          <div className="text-right">
            <div>Invoice No: <span className="font-semibold">{invoice.invoiceNumber}</span></div>
            <div>Invoice Date: {dateStr(invoice.issueDate)}</div>
            <div>Due Date: {dateStr(invoice.dueDate)}</div>
            <div>Place of Supply: {invoice.placeOfSupply || "—"}</div>
            {invoice.reverseCharge && <div>Reverse Charge: Yes</div>}
          </div>
        </div>

        {/* Items */}
        {format === "VERTICAL" ? (
          <table className="inv-table mt-3 text-xs">
            <thead className="bg-neutral-100">
              <tr>
                <th className="w-8">#</th>
                <th>Description</th>
                <th className="w-16">HSN/SAC</th>
                <th className="w-12">Qty</th>
                <th className="w-16">Rate</th>
                <th className="w-14">Disc</th>
                <th className="w-20">Taxable</th>
                {interState ? (
                  <th className="w-16">IGST</th>
                ) : (
                  <>
                    <th className="w-16">CGST</th>
                    <th className="w-16">SGST</th>
                  </>
                )}
                <th className="w-20">Total</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items ?? []).map((it: any, i: number) => (
                <tr key={it.id}>
                  <td className="text-center">{i + 1}</td>
                  <td>
                    {it.description || "Item"}
                    {it.unit ? <span className="text-neutral-500"> ({it.unit})</span> : null}
                  </td>
                  <td className="text-center">{it.hsnSac || "—"}</td>
                  <td className="text-right">{fmtQty(it.quantity)}</td>
                  <td className="text-right">{fmt(it.unitPrice)}</td>
                  <td className="text-right">{fmt(it.discount)}</td>
                  <td className="text-right">{fmt(it.taxableAmount)}</td>
                  {interState ? (
                    <td className="text-right">{fmt(it.igstAmount)}</td>
                  ) : (
                    <>
                      <td className="text-right">{fmt(it.cgstAmount)}</td>
                      <td className="text-right">{fmt(it.sgstAmount)}</td>
                    </>
                  )}
                  <td className="text-right font-medium">
                    {fmt(Number(it.taxableAmount) + Number(it.cgstAmount) + Number(it.sgstAmount) + Number(it.igstAmount) + Number(it.cessAmount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="inv-table mt-3 text-xs">
            <thead className="bg-neutral-100">
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>HSN/SAC</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Rate</th>
                <th>Disc</th>
                <th>Taxable</th>
                <th>CGST %</th>
                <th>CGST</th>
                <th>SGST %</th>
                <th>SGST</th>
                <th>IGST %</th>
                <th>IGST</th>
                <th>Cess</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items ?? []).map((it: any, i: number) => (
                <tr key={it.id}>
                  <td className="text-center">{i + 1}</td>
                  <td>{it.description || "Item"}</td>
                  <td className="text-center">{it.hsnSac || "—"}</td>
                  <td className="text-right">{fmtQty(it.quantity)}</td>
                  <td className="text-center">{it.unit || "—"}</td>
                  <td className="text-right">{fmt(it.unitPrice)}</td>
                  <td className="text-right">{fmt(it.discount)}</td>
                  <td className="text-right">{fmt(it.taxableAmount)}</td>
                  <td className="text-right">{fmt(it.cgstRate)}</td>
                  <td className="text-right">{fmt(it.cgstAmount)}</td>
                  <td className="text-right">{fmt(it.sgstRate)}</td>
                  <td className="text-right">{fmt(it.sgstAmount)}</td>
                  <td className="text-right">{fmt(it.igstRate)}</td>
                  <td className="text-right">{fmt(it.igstAmount)}</td>
                  <td className="text-right">{fmt(it.cessAmount)}</td>
                  <td className="text-right font-medium">
                    {fmt(Number(it.taxableAmount) + Number(it.cgstAmount) + Number(it.sgstAmount) + Number(it.igstAmount) + Number(it.cessAmount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Tax summary */}
        {taxSummary && taxSummary.length > 0 && (
          <div className="mt-3">
            <div className="text-[11px] font-semibold uppercase text-neutral-600">Tax Summary</div>
            <table className="inv-table mt-1 text-xs">
              <thead className="bg-neutral-100">
                <tr>
                  <th>HSN/SAC</th>
                  <th>Taxable</th>
                  {interState ? (
                    <>
                      <th>IGST %</th>
                      <th>IGST</th>
                    </>
                  ) : (
                    <>
                      <th>CGST %</th>
                      <th>CGST</th>
                      <th>SGST %</th>
                      <th>SGST</th>
                    </>
                  )}
                  <th>Cess</th>
                </tr>
              </thead>
              <tbody>
                {taxSummary.map((r: any, i: number) => (
                  <tr key={i}>
                    <td className="text-center">{r.hsnSac || "—"}</td>
                    <td className="text-right">{fmt(r.taxableAmount)}</td>
                    {interState ? (
                      <>
                        <td className="text-right">{fmt(r.igstRate)}</td>
                        <td className="text-right">{fmt(r.igstAmount)}</td>
                      </>
                    ) : (
                      <>
                        <td className="text-right">{fmt(r.cgstRate)}</td>
                        <td className="text-right">{fmt(r.cgstAmount)}</td>
                        <td className="text-right">{fmt(r.sgstRate)}</td>
                        <td className="text-right">{fmt(r.sgstAmount)}</td>
                      </>
                    )}
                    <td className="text-right">{fmt(r.cessAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals + words */}
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <div className="font-semibold">Amount in Words</div>
            <div className="italic">{invoice.amountInWords}</div>
            {(invoice.transportMode || invoice.vehicleNumber || invoice.ewayBillNumber) && (
              <div className="mt-2">
                <div className="font-semibold">Transport</div>
                <div>
                  {invoice.transportMode ? `Mode: ${invoice.transportMode}  ` : ""}
                  {invoice.vehicleNumber ? `Vehicle: ${invoice.vehicleNumber}  ` : ""}
                  {invoice.lrNumber ? `LR: ${invoice.lrNumber}  ` : ""}
                  {invoice.ewayBillNumber ? `e-Way: ${invoice.ewayBillNumber}` : ""}
                </div>
              </div>
            )}
            {seller?.bankName && (
              <div className="mt-2">
                <div className="font-semibold">Bank Details</div>
                <div>
                  {seller.bankName} · A/c {seller.bankAccountNo || "—"} · IFSC {seller.bankIfsc || "—"}
                  {seller.bankBranch ? ` · ${seller.bankBranch}` : ""}
                </div>
              </div>
            )}
          </div>
          <div>
            <table className="inv-table text-xs">
              <tbody>
                <tr><td>Taxable Amount</td><td className="text-right">{fmt(invoice.taxableAmount)}</td></tr>
                {interState ? (
                  <tr><td>IGST</td><td className="text-right">{fmt(invoice.totalIgst)}</td></tr>
                ) : (
                  <>
                    <tr><td>CGST</td><td className="text-right">{fmt(invoice.totalCgst)}</td></tr>
                    <tr><td>SGST</td><td className="text-right">{fmt(invoice.totalSgst)}</td></tr>
                  </>
                )}
                {Number(invoice.totalCess) > 0 && <tr><td>Cess</td><td className="text-right">{fmt(invoice.totalCess)}</td></tr>}
                {Number(invoice.shippingAmount) > 0 && <tr><td>Shipping</td><td className="text-right">{fmt(invoice.shippingAmount)}</td></tr>}
                <tr><td>Round Off</td><td className="text-right">{fmt(invoice.roundOff)}</td></tr>
                <tr className="font-bold"><td>Grand Total</td><td className="text-right">{fmt(invoice.grandTotal)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Terms + signature */}
        <div className="mt-4 flex items-end justify-between text-xs">
          <div className="max-w-[55%]">
            {(invoice.terms || seller?.invoiceTerms) && (
              <>
                <div className="font-semibold">Terms &amp; Conditions</div>
                <div className="whitespace-pre-line">{invoice.terms || seller?.invoiceTerms}</div>
              </>
            )}
            {seller?.invoiceFooter && <div className="mt-1 text-neutral-500">{seller.invoiceFooter}</div>}
          </div>
          <div className="text-center">
            <div className="mb-8">For {sellerName}</div>
            <div className="border-t border-neutral-500 px-6 pt-1">
              {seller?.signatoryName || "Authorised Signatory"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
