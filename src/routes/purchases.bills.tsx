import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/purchases/bills")({
  head: () => ({ meta: [{ title: "Bills - ERPX" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Bills"
        subtitle="Supplier bills and purchase invoices"
        table="vendor_bills"
        permissionPrefix="vendor_bill"
        newLabel="New Bill"
        searchKeys={["billNumber", "notes"]}
        fields={[
          { key: "billNumber", label: "Bill #", hideInForm: true },
          {
            key: "vendorId",
            label: "Vendor",
            type: "lookup",
            lookupTable: "vendors",
            lookupLabelKey: "companyName",
            required: true,
          },
          { key: "billDate", label: "Bill Date", type: "date" },
          { key: "dueDate", label: "Due Date", type: "date" },
          { key: "subtotal", label: "Subtotal", type: "number" },
          { key: "taxAmount", label: "Tax", type: "number" },
          { key: "grandTotal", label: "Amount", type: "number" },
          { key: "notes", label: "Notes", type: "textarea", hideInTable: true },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["DRAFT", "SUBMITTED", "APPROVED", "POSTED", "CANCELLED"],
            defaultValue: "DRAFT",
            badge: statusBadge,
            hideInForm: true,
          },
        ]}
      />
    </div>
  ),
});
