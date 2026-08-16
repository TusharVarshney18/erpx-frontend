import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard/dashboard-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ERPX — AI Operating System for Modern Businesses" },
      {
        name: "description",
        content:
          "Executive dashboard with AI-powered insights, real-time analytics, and intelligent automation.",
      },
    ],
  }),
  component: DashboardPage,
});
