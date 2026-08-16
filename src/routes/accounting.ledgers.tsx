import { createFileRoute } from "@tanstack/react-router";
import { ReportPage } from "@/lib/crud/ReportPage";

export const Route = createFileRoute("/accounting/ledgers")({
  head: () => ({ meta: [{ title: "General Ledger — Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <ReportPage
        title="General Ledger"
        subtitle="Per-account transaction history"
        endpoint="/reports/organizations/{orgId}/general-ledger"
        columns={[
          { key: "journalNumber", label: "Journal #", sortable: true },
          { key: "postingDate", label: "Date", type: "date", sortable: true },
          { key: "accountCode", label: "Account Code" },
          { key: "accountName", label: "Account Name" },
          { key: "description", label: "Description" },
          { key: "debit", label: "Debit", type: "number" },
          { key: "credit", label: "Credit", type: "number" },
        ]}
      />
    </div>
  ),
});
