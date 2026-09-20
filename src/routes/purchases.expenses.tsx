import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/purchases/expenses")({
  head: () => ({ meta: [{ title: "Expenses - ERPX" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Expenses"
        subtitle="Expense bills recorded against vendors"
        table="vendor_bills"
        permissionPrefix="expense"
        newLabel="New Expense"
        searchKeys={["billNumber", "notes"]}
        fields={[
          { key: "billNumber", label: "Expense #", hideInForm: true },
          {
            key: "vendorId",
            label: "Vendor / Payee",
            type: "lookup",
            lookupTable: "vendors",
            lookupLabelKey: "companyName",
            required: true,
          },
          { key: "billDate", label: "Date", type: "date" },
          { key: "dueDate", label: "Due Date", type: "date" },
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
