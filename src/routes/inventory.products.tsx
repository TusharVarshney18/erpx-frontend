import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";
import { ProductForm } from "@/components/products/ProductForm";

export const Route = createFileRoute("/inventory/products")({
  head: () => ({ meta: [{ title: "Products — Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Products"
        table="products"
        permissionPrefix="product"
        newLabel="New Product"
        searchKeys={["sku", "name", "hsnSacCode"]}
        formRenderer={(props) => <ProductForm {...props} />}
        fields={[
          { key: "sku", label: "SKU", required: true },
          { key: "name", label: "Name", required: true },
          { key: "itemType", label: "Type" },
          { key: "hsnSacCode", label: "HSN / SAC" },
          { key: "categoryId", label: "Category ID" },
          { key: "unitId", label: "Unit ID" },
          { key: "purchasePrice", label: "Purchase Price", type: "number" },
          { key: "sellingPrice", label: "Selling Price", type: "number" },
          { key: "gstRate", label: "GST Rate %", type: "number" },
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
