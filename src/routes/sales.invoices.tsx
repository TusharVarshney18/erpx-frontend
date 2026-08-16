import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/sales/invoices")({
  head: () => ({ meta: [{ title: "Invoices â€” Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Sales Invoices"
        table="invoices"
        permissionPrefix="invoice"
        newLabel="New Invoice"
        searchKeys={["invoiceNumber", "notes"]}
        fields={[
          { key: "invoiceNumber", label: "Invoice #", required: true },
          { key: "companyId", label: "Company ID", required: true },
          { key: "issueDate", label: "Invoice Date", type: "date", required: true },
          { key: "dueDate", label: "Due Date", type: "date", required: true },
          { key: "subtotal", label: "Subtotal", type: "number" },
          { key: "taxAmount", label: "Tax", type: "number" },
          { key: "grandTotal", label: "Total", type: "number" },
          { key: "currency", label: "Currency", defaultValue: "USD" },
          { key: "notes", label: "Notes", type: "textarea", hideInTable: true },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["DRAFT", "SENT", "VIEWED", "PARTIALLY_PAID", "PAID", "VOID"],
            defaultValue: "DRAFT",
            badge: statusBadge,
          },
        ]}
      />
    </div>
  ),
});
