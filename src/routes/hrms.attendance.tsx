import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";
import { AttendanceBoard } from "@/features/hrms/attendance-board";

export const Route = createFileRoute("/hrms/attendance")({
  head: () => ({ meta: [{ title: "Attendance - ERPX" }] }),
  component: AttendancePage,
});

function AttendancePage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      <PageHeader
        title="Attendance"
        subtitle="Daily status of every employee: present, late, absent and on leave"
      />
      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily status</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="mt-4">
          <AttendanceBoard />
        </TabsContent>
        <TabsContent value="records" className="mt-4">
          <DataModule
            title="Attendance records"
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
