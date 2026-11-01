import { createFileRoute } from "@tanstack/react-router";
import { MyLeavePage } from "@/features/self-service/my-leave-page";

export const Route = createFileRoute("/hrms/my-leave")({
  head: () => ({ meta: [{ title: "My Leave - ERPX" }] }),
  component: MyLeavePage,
});
