import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/purchases/purchase-orders")({
  head: () => ({ meta: [{ title: "Purchase Orders â€” Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Purchase Orders"
        table="purchase_orders"
        permissionPrefix="purchase_order"
        newLabel="New PO"
        searchKeys={["poNumber", "notes"]}
        fields={[
          { key: "poNumber", label: "PO #", required: true },
          { key: "vendorId", label: "Vendor ID", required: true },
          { key: "warehouseId", label: "Warehouse ID" },
          { key: "expectedDate", label: "Expected Date", type: "date" },
          { key: "subtotal", label: "Subtotal", type: "number" },
          { key: "taxAmount", label: "Tax", type: "number" },
          { key: "grandTotal", label: "Total", type: "number" },
          { key: "notes", label: "Notes", type: "textarea", hideInTable: true },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["DRAFT", "SENT", "APPROVED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"],
            defaultValue: "DRAFT",
            badge: statusBadge,
          },
        ]}
      />
    </div>
  ),
});
