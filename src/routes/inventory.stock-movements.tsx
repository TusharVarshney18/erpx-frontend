import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/inventory/stock-movements")({
  head: () => ({ meta: [{ title: "Stock Movements â€” Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Stock Movements"
        table="stock_movements"
        permissionPrefix="stock"
        newLabel="New Movement"
        searchKeys={["transactionType", "referenceType"]}
        fields={[
          {
            key: "transactionType",
            label: "Type",
            type: "select",
            options: ["PURCHASE", "SALE", "TRANSFER_IN", "TRANSFER_OUT", "ADJUSTMENT", "RETURN", "RESERVATION", "RELEASE"],
            required: true,
          },
          { key: "productId", label: "Product ID", required: true },
          { key: "warehouseId", label: "Warehouse ID", required: true },
          { key: "quantity", label: "Qty", type: "number", required: true },
          { key: "referenceType", label: "Reference Type" },
          { key: "referenceId", label: "Reference ID" },
        ]}
      />
    </div>
  ),
});
