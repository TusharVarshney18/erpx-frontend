import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/sales/payments")({
  head: () => ({ meta: [{ title: "Payments â€” Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Payments"
        table="payments"
        permissionPrefix="payment"
        newLabel="New Payment"
        searchKeys={["transactionId", "paymentMethod"]}
        fields={[
          { key: "invoiceId", label: "Invoice ID" },
          { key: "amount", label: "Amount", type: "number", required: true },
          { key: "paymentMethod", label: "Method" },
          { key: "transactionId", label: "Transaction ID" },
          { key: "currency", label: "Currency", defaultValue: "USD" },
          { key: "paidAt", label: "Payment Date", type: "date" },
          {
            key: "gateway",
            label: "Gateway",
            type: "select",
            required: true,
            options: ["RAZORPAY", "STRIPE", "MANUAL"],
            defaultValue: "MANUAL",
          },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["PENDING", "AUTHORIZED", "CAPTURED", "FAILED", "REFUNDED"],
            defaultValue: "PENDING",
            badge: statusBadge,
          },
        ]}
      />
    </div>
  ),
});
