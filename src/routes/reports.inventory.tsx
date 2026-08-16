import { createFileRoute } from "@tanstack/react-router";
import { ReportPage } from "@/lib/crud/ReportPage";

export const Route = createFileRoute("/reports/inventory")({
  head: () => ({ meta: [{ title: "Inventory Reports — Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <ReportPage
        title="Inventory Report"
        subtitle="Stock levels, valuation and movement"
        endpoint="/reports/organizations/{orgId}/inventory"
        columns={[
          { key: "product.name", label: "Product" },
          { key: "product.sku", label: "SKU" },
          { key: "warehouse.name", label: "Warehouse" },
          { key: "availableQty", label: "Available", type: "number", sortable: true },
          { key: "reservedQty", label: "Reserved", type: "number" },
          { key: "reorderLevel", label: "Reorder Lvl", type: "number" },
        ]}
      />
    </div>
  ),
});
