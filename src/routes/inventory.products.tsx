import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/inventory/products")({
  head: () => ({ meta: [{ title: "Products â€” Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Products"
        table="products"
        permissionPrefix="product"
        newLabel="New Product"
        searchKeys={["sku", "name", "categoryId"]}
        fields={[
          { key: "sku", label: "SKU", required: true },
          { key: "name", label: "Name", required: true },
          { key: "barcode", label: "Barcode" },
          { key: "categoryId", label: "Category ID" },
          { key: "unitId", label: "Unit ID" },
          { key: "purchasePrice", label: "Cost", type: "number" },
          { key: "sellingPrice", label: "Price", type: "number" },
          { key: "taxRate", label: "Tax Rate %", type: "number" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["ACTIVE", "INACTIVE"],
            defaultValue: "ACTIVE",
            badge: statusBadge,
          },
        ]}
      />
    </div>
  ),
});
