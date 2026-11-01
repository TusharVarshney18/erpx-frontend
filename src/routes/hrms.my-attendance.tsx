import { createFileRoute } from "@tanstack/react-router";
import { MyAttendancePage } from "@/features/self-service/my-attendance-page";

export const Route = createFileRoute("/hrms/my-attendance")({
  head: () => ({ meta: [{ title: "My Attendance - ERPX" }] }),
  component: MyAttendancePage,
});
