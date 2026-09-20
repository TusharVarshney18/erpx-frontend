import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/sales/sales-orders")({
  head: () => ({ meta: [{ title: "Sales Orders - ERPX" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Sales Orders"
        table="orders"
        permissionPrefix="sales_order"
        newLabel="New Order"
        searchKeys={["orderNumber", "notes"]}
        fields={[
          { key: "orderNumber", label: "Order #", hideInForm: true },
          {
            key: "companyId",
            label: "Customer",
            type: "lookup",
            lookupTable: "customers",
            lookupLabelKey: "name",
            required: true,
          },
          { key: "orderDate", label: "Order Date", type: "date" },
          { key: "expectedDeliveryDate", label: "Delivery Date", type: "date" },
          { key: "subtotal", label: "Subtotal", type: "number" },
          { key: "taxAmount", label: "Tax", type: "number" },
          { key: "grandTotal", label: "Total", type: "number" },
          { key: "currency", label: "Currency", defaultValue: "INR" },
          { key: "notes", label: "Notes", type: "textarea", hideInTable: true },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              "DRAFT",
              "CONFIRMED",
              "PROCESSING",
              "PARTIALLY_FULFILLED",
              "FULFILLED",
              "CANCELLED",
            ],
            defaultValue: "DRAFT",
            badge: statusBadge,
          },
        ]}
      />
    </div>
  ),
});
