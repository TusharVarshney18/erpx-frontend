import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/hrms/employees")({
  head: () => ({ meta: [{ title: "Employees â€” Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Employees"
        table="employees"
        permissionPrefix="employee"
        newLabel="New Employee"
        searchKeys={["employeeCode", "firstName", "lastName", "email"]}
        fields={[
          { key: "employeeCode", label: "Code", required: true },
          { key: "firstName", label: "First Name", required: true },
          { key: "lastName", label: "Last Name", required: true },
          { key: "email", label: "Email", type: "email" },
          { key: "phone", label: "Phone", type: "tel" },
          { key: "departmentId", label: "Department ID" },
          { key: "designationId", label: "Designation ID" },
          { key: "joiningDate", label: "Join Date", type: "date" },
          { key: "managerId", label: "Manager ID" },
          {
            key: "employmentStatus",
            label: "Status",
            type: "select",
            options: ["ACTIVE", "INACTIVE", "TERMINATED"],
            defaultValue: "ACTIVE",
            badge: statusBadge,
          },
        ]}
      />
    </div>
  ),
});
