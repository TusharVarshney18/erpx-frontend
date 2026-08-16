import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/crm/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities â€” Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Opportunities"
        table="opportunities"
        permissionPrefix="deal"
        newLabel="New Opportunity"
        searchKeys={["title", "description"]}
        fields={[
          { key: "title", label: "Name", required: true },
          { key: "value", label: "Value", type: "number" },
          { key: "probability", label: "Probability %", type: "number" },
          { key: "expectedCloseDate", label: "Expected Close", type: "date" },
          { key: "currency", label: "Currency", defaultValue: "USD" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["OPEN", "WON", "LOST", "ARCHIVED"],
            defaultValue: "OPEN",
            badge: statusBadge,
          },
          { key: "description", label: "Notes", type: "textarea", hideInTable: true },
        ]}
      />
    </div>
  ),
});
