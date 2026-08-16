import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/crm/activities")({
  head: () => ({ meta: [{ title: "Activities â€” Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Activities"
        table="activities"
        permissionPrefix="activity"
        newLabel="New Activity"
        searchKeys={["title", "entityType"]}
        fields={[
          { key: "dueDate", label: "Due Date", type: "date" },
          {
            key: "type",
            label: "Type",
            type: "select",
            options: ["CALL", "MEETING", "TASK", "EMAIL", "REMINDER", "NOTE", "FOLLOW_UP"],
            required: true,
          },
          { key: "title", label: "Title", required: true },
          { key: "entityType", label: "Entity Type" },
          { key: "entityId", label: "Entity ID" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
            defaultValue: "PENDING",
            badge: statusBadge,
          },
          { key: "description", label: "Description", type: "textarea", hideInTable: true },
        ]}
      />
    </div>
  ),
});
