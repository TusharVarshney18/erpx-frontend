import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/sales/quotations")({
  head: () => ({ meta: [{ title: "Quotations â€” Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Quotations"
        table="quotations"
        permissionPrefix="quotation"
        newLabel="New Quotation"
        searchKeys={["quotationNumber", "notes"]}
        fields={[
          { key: "quotationNumber", label: "Quote #", required: true },
          { key: "companyId", label: "Company ID", required: true },
          { key: "issueDate", label: "Quote Date", type: "date", required: true },
          { key: "expiryDate", label: "Valid Until", type: "date", required: true },
          { key: "subtotal", label: "Subtotal", type: "number" },
          { key: "taxAmount", label: "Tax", type: "number" },
          { key: "grandTotal", label: "Total", type: "number" },
          { key: "currency", label: "Currency", defaultValue: "USD" },
          { key: "notes", label: "Notes", type: "textarea", hideInTable: true },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["DRAFT", "SENT", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"],
            defaultValue: "DRAFT",
            badge: statusBadge,
          },
        ]}
      />
    </div>
  ),
});
