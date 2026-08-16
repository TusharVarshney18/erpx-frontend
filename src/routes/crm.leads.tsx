import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/crm/leads")({
  head: () => ({ meta: [{ title: "Leads â€” Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Leads"
        table="leads"
        permissionPrefix="lead"
        newLabel="New Lead"
        searchKeys={["contactName", "companyName", "email", "phone"]}
        fields={[
          { key: "contactName", label: "Name", required: true },
          { key: "companyName", label: "Company" },
          { key: "email", label: "Email", type: "email" },
          { key: "phone", label: "Phone", type: "tel" },
          {
            key: "source",
            label: "Source",
            type: "select",
            options: ["WEBSITE", "REFERRAL", "SOCIAL_MEDIA", "EMAIL", "PHONE", "ADVERTISEMENT", "PARTNER", "EVENT", "OTHER"],
          },
          { key: "estimatedValue", label: "Value", type: "number" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST", "DISQUALIFIED"],
            defaultValue: "NEW",
            badge: statusBadge,
          },
          { key: "description", label: "Notes", type: "textarea", hideInTable: true },
        ]}
      />
    </div>
  ),
});
