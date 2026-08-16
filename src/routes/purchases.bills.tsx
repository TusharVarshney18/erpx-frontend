import { createFileRoute } from "@tanstack/react-router";
import { DataModule } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/purchases/bills")({
  head: () => ({ meta: [{ title: "Bills â€” Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Bills"
        subtitle="Supplier bills and purchase invoices"
        table="purchase_orders"
        permissionPrefix="bill"
        fields={[
          { key: "orderNumber", label: "Bill #", badge: { DRAFT: "bg-muted text-muted-foreground", PENDING: "bg-warning/15 text-warning", APPROVED: "bg-success/15 text-success", RECEIVED: "bg-primary/15 text-primary", CANCELLED: "bg-destructive/15 text-destructive" } },
          { key: "vendorId", label: "Vendor", hideInForm: true },
          { key: "orderDate", label: "Date", type: "date" },
          { key: "expectedDeliveryDate", label: "Due Date", type: "date" },
          { key: "totalAmount", label: "Amount", type: "number" },
          { key: "status", label: "Status", type: "select", options: ["DRAFT", "PENDING", "APPROVED", "RECEIVED", "CANCELLED"], hideInTable: true },
          { key: "notes", label: "Notes", type: "textarea", hideInTable: true },
        ]}
        searchKeys={["orderNumber", "vendorId", "status"]}
        orderBy={{ column: "createdAt", ascending: false }}
        newLabel="New Bill"
      />
    </div>
  ),
});
