import { createFileRoute } from "@tanstack/react-router";
import { BalanceSheetPage } from "@/lib/crud/ReportPage";

export const Route = createFileRoute("/accounting/balance-sheet")({
  head: () => ({ meta: [{ title: "Balance Sheet — Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <BalanceSheetPage />
    </div>
  ),
});
