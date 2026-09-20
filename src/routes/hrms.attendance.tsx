import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/hrms/attendance")({
  head: () => ({ meta: [{ title: "Attendance - ERPX" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Attendance"
        table="attendance"
        permissionPrefix="attendance"
        newLabel="Mark Attendance"
        searchKeys={["employeeId", "date"]}
        fields={[
          {
            key: "employeeId",
            label: "Employee",
            type: "lookup",
            lookupTable: "employees",
            lookupLabelKey: "firstName",
            required: true,
          },
          { key: "date", label: "Date", type: "date" },
          { key: "checkIn", label: "Check In" },
          { key: "checkOut", label: "Check Out" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"],
            defaultValue: "PRESENT",
            badge: statusBadge,
          },
        ]}
      />
    </div>
  ),
});
