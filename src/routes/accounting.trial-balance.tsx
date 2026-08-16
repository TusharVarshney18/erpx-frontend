import { createFileRoute } from "@tanstack/react-router";
import { TrialBalancePage } from "@/lib/crud/ReportPage";

export const Route = createFileRoute("/accounting/trial-balance")({
  head: () => ({ meta: [{ title: "Trial Balance — Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <TrialBalancePage />
    </div>
  ),
});
