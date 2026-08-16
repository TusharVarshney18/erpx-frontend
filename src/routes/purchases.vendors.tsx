import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/purchases/vendors")({
  head: () => ({ meta: [{ title: "Vendors â€” Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Vendors"
        table="vendors"
        permissionPrefix="vendor"
        newLabel="New Vendor"
        searchKeys={["companyName", "email", "phone", "taxNumber"]}
        fields={[
          { key: "vendorCode", label: "Vendor Code", required: true },
          { key: "companyName", label: "Name", required: true },
          { key: "contactName", label: "Contact Person" },
          { key: "email", label: "Email", type: "email" },
          { key: "phone", label: "Phone", type: "tel" },
          { key: "taxNumber", label: "GSTIN" },
          { key: "address", label: "Address", type: "textarea" },
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
