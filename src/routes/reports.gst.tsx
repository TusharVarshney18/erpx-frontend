import { createFileRoute } from "@tanstack/react-router";
import { ReportPage } from "@/lib/crud/ReportPage";
import { PremiumGate } from "@/components/premium/PremiumGate";

export const Route = createFileRoute("/reports/gst")({
  head: () => ({ meta: [{ title: "GST Reports — Acme ERP" }] }),
  component: () => (
    <PremiumGate feature="advancedReports">
      <div className="max-w-[1400px] mx-auto">
        <ReportPage
          title="GST Reports"
          subtitle="GSTR-1, 2A, 3B & 9"
          endpoint="/reports/organizations/{orgId}/gst"
          columns={[
            { key: "returnType", label: "Return Type", badge: {
              GSTR1: "bg-primary/15 text-primary",
              GSTR2A: "bg-info/15 text-info",
              GSTR3B: "bg-warning/15 text-warning",
              GSTR9: "bg-success/15 text-success",
            }},
            { key: "period", label: "Period", sortable: true },
            { key: "filingDate", label: "Filed On", type: "date", sortable: true },
            { key: "outwardSupply", label: "Outward Supply", type: "number", sortable: true },
            { key: "inwardSupply", label: "Inward Supply", type: "number", sortable: true },
            { key: "taxPayable", label: "Tax Payable", type: "number", sortable: true },
            { key: "status", label: "Status", badge: {
              FILED: "bg-success/15 text-success",
              PENDING: "bg-warning/15 text-warning",
              DRAFT: "bg-muted text-muted-foreground",
              OVERDUE: "bg-destructive/15 text-destructive",
            }},
          ]}
        />
      </div>
    </PremiumGate>
  ),
});
