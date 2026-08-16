import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/hrms/leaves")({
  head: () => ({ meta: [{ title: "Leaves â€” Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Leave Requests"
        table="leaves"
        permissionPrefix="leave"
        newLabel="Apply Leave"
        searchKeys={["employeeId", "leaveType", "reason"]}
        fields={[
          { key: "employeeId", label: "Employee ID", required: true },
          {
            key: "leaveType",
            label: "Type",
            type: "select",
            options: ["CASUAL", "SICK", "ANNUAL", "UNPAID"],
            required: true,
          },
          { key: "startDate", label: "From", type: "date", required: true },
          { key: "endDate", label: "To", type: "date", required: true },
          { key: "reason", label: "Reason", type: "textarea", hideInTable: true },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["PENDING", "APPROVED", "REJECTED"],
            defaultValue: "PENDING",
            badge: statusBadge,
          },
        ]}
      />
    </div>
  ),
});
