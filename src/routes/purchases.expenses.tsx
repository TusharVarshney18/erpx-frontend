import { createFileRoute } from "@tanstack/react-router";
import { DataModule } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/purchases/expenses")({
  head: () => ({ meta: [{ title: "Expenses â€” Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Expenses"
        subtitle="Operational expense tracking"
        table="purchase_orders"
        permissionPrefix="expense"
        fields={[
          { key: "orderNumber", label: "Expense #" },
          { key: "vendorId", label: "Vendor/Payee", hideInForm: true },
          { key: "orderDate", label: "Date", type: "date" },
          { key: "totalAmount", label: "Amount", type: "number" },
          { key: "status", label: "Status", type: "select", options: ["DRAFT", "PENDING", "APPROVED", "RECEIVED", "CANCELLED"], badge: { DRAFT: "bg-muted text-muted-foreground", PENDING: "bg-warning/15 text-warning", APPROVED: "bg-success/15 text-success", RECEIVED: "bg-primary/15 text-primary", CANCELLED: "bg-destructive/15 text-destructive" } },
          { key: "notes", label: "Notes", type: "textarea", hideInTable: true },
        ]}
        searchKeys={["orderNumber", "vendorId", "status", "notes"]}
        orderBy={{ column: "createdAt", ascending: false }}
        newLabel="New Expense"
      />
    </div>
  ),
});
