import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/inventory/warehouses")({
  head: () => ({ meta: [{ title: "Warehouses â€” Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Warehouses"
        table="warehouses"
        permissionPrefix="warehouse"
        newLabel="New Warehouse"
        searchKeys={["name", "code", "address"]}
        fields={[
          { key: "code", label: "Code", required: true },
          { key: "name", label: "Name", required: true },
          { key: "address", label: "Location" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "managerId", label: "Manager ID" },
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
