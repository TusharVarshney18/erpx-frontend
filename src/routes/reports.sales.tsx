import { createFileRoute } from "@tanstack/react-router";
import { ReportPage } from "@/lib/crud/ReportPage";

export const Route = createFileRoute("/reports/sales")({
  head: () => ({ meta: [{ title: "Sales Reports — Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <ReportPage
        title="Sales Report"
        subtitle="Revenue, orders and customer analytics"
        endpoint="/reports/organizations/{orgId}/sales"
        columns={[
          { key: "orderNumber", label: "Order #", sortable: true },
          { key: "company.name", label: "Customer" },
          { key: "grandTotal", label: "Total", type: "number", sortable: true },
          { key: "status", label: "Status", badge: {
            PENDING: "bg-warning/15 text-warning",
            CONFIRMED: "bg-primary/15 text-primary",
            PROCESSING: "bg-warning/15 text-warning",
            SHIPPED: "bg-info/15 text-info",
            DELIVERED: "bg-success/15 text-success",
            CANCELLED: "bg-destructive/15 text-destructive",
          }},
          { key: "createdAt", label: "Date", type: "date", sortable: true },
        ]}
      />
    </div>
  ),
});
