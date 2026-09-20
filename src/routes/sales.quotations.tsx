import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/sales/quotations")({
  head: () => ({ meta: [{ title: "Quotations - ERPX" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Quotations"
        table="quotations"
        permissionPrefix="quotation"
        newLabel="New Quotation"
        searchKeys={["quotationNumber", "notes"]}
        fields={[
          { key: "quotationNumber", label: "Quote #", hideInForm: true },
          {
            key: "companyId",
            label: "Customer",
            type: "lookup",
            lookupTable: "customers",
            lookupLabelKey: "name",
            required: true,
          },
          { key: "issueDate", label: "Quote Date", type: "date" },
          { key: "expiryDate", label: "Valid Until", type: "date" },
          { key: "subtotal", label: "Subtotal", type: "number" },
          { key: "taxAmount", label: "Tax", type: "number" },
          { key: "grandTotal", label: "Total", type: "number" },
          { key: "currency", label: "Currency", defaultValue: "INR" },
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
