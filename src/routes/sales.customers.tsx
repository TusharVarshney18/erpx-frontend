import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/sales/customers")({
  head: () => ({ meta: [{ title: "Customers â€” Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Customers"
        table="customers"
        permissionPrefix="customer"
        newLabel="New Customer"
        searchKeys={["name", "email", "phone", "gstNumber"]}
        fields={[
          { key: "name", label: "Company Name", required: true },
          { key: "legalName", label: "Legal Name" },
          { key: "email", label: "Email", type: "email" },
          { key: "phone", label: "Phone", type: "tel" },
          { key: "gstNumber", label: "GSTIN" },
          { key: "billingAddress", label: "Billing Address", type: "textarea" },
          { key: "shippingAddress", label: "Shipping Address", type: "textarea" },
          { key: "city", label: "City" },
          { key: "state", label: "State" },
          { key: "country", label: "Country" },
        ]}
      />
    </div>
  ),
});
