import { createFileRoute } from "@tanstack/react-router";
import { ProfitLossPage } from "@/lib/crud/ReportPage";

export const Route = createFileRoute("/accounting/profit-loss")({
  head: () => ({ meta: [{ title: "Profit & Loss — Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <ProfitLossPage />
    </div>
  ),
});
