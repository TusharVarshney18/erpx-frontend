import { createFileRoute } from "@tanstack/react-router";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";

export const Route = createFileRoute("/accounting/chart-of-accounts")({
  head: () => ({ meta: [{ title: "Chart of Accounts — Acme ERP" }] }),
  component: () => (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Chart of Accounts"
        table="accounts"
        permissionPrefix="chart_of_account"
        newLabel="New Account"
        searchKeys={["accountCode", "accountName", "accountType", "accountGroupId"]}
        orderBy={{ column: "accountCode", ascending: true }}
        fields={[
          { key: "accountCode", label: "Code", required: true },
          { key: "accountName", label: "Name", required: true },
          {
            key: "accountType",
            label: "Type",
            type: "select",
            required: true,
            options: ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"],
            badge: {
              ASSET: "bg-primary/15 text-primary",
              LIABILITY: "bg-warning/15 text-warning",
              EQUITY: "bg-success/15 text-success",
              REVENUE: "bg-info/15 text-info",
              EXPENSE: "bg-destructive/15 text-destructive",
            },
          },
          {
            key: "accountGroupId",
            label: "Account Group",
            type: "lookup",
            lookupTable: "account_groups",
            lookupLabelKey: "name",
            lookupValueKey: "id",
            hideInTable: true,
          },
          {
            key: "ledgerType",
            label: "Ledger Type",
            type: "select",
            options: ["BANK", "CASH", "DEBTOR", "CREDITOR", "DUTY_TAX", "INCOME", "EXPENSE", "FIXED_ASSET", "CURRENT_ASSET", "CURRENT_LIABILITY", "INVESTMENT", "CAPITAL", "OTHER"],
            defaultValue: "OTHER",
            badge: { BANK: "bg-primary/15 text-primary", CASH: "bg-success/15 text-success", DEBTOR: "bg-warning/15 text-warning", CREDITOR: "bg-info/15 text-info", DUTY_TAX: "bg-destructive/15 text-destructive" },
          },
          {
            key: "normalBalance",
            label: "Normal Balance",
            type: "select",
            options: ["DEBIT", "CREDIT"],
            defaultValue: "DEBIT",
            badge: { DEBIT: "bg-primary/15 text-primary", CREDIT: "bg-success/15 text-success" },
          },
          { key: "openingBalance", label: "Opening Balance", type: "number", hideInTable: true },
          {
            key: "openingBalanceType",
            label: "Opening Balance Dr/Cr",
            type: "select",
            options: ["DEBIT", "CREDIT"],
            defaultValue: "DEBIT",
            hideInTable: true,
          },
          { key: "currency", label: "Currency", defaultValue: "INR", hideInTable: true },
          {
            key: "billWiseTracking",
            label: "Bill-wise Tracking",
            type: "select",
            options: ["true", "false"],
            defaultValue: "false",
            hideInTable: true,
          },
          {
            key: "costCentreApplicable",
            label: "Cost Centre Applicable",
            type: "select",
            options: ["true", "false"],
            defaultValue: "false",
            hideInTable: true,
          },
          {
            key: "reconciliationApplicable",
            label: "Reconciliation Applicable",
            type: "select",
            options: ["true", "false"],
            defaultValue: "false",
            hideInTable: true,
          },
          {
            key: "gstApplicable",
            label: "GST Applicable",
            type: "select",
            options: ["true", "false"],
            defaultValue: "false",
            hideInTable: true,
          },
          { key: "taxClassification", label: "Tax Classification", hideInTable: true },
          { key: "hsnSac", label: "HSN / SAC", hideInTable: true },
          {
            key: "reverseChargeApplicable",
            label: "Reverse Charge",
            type: "select",
            options: ["true", "false"],
            defaultValue: "false",
            hideInTable: true,
          },
          {
            key: "postingAllowed",
            label: "Posting Allowed",
            type: "select",
            options: ["true", "false"],
            defaultValue: "true",
            hideInTable: true,
          },
          {
            key: "manualPostingAllowed",
            label: "Manual Posting Allowed",
            type: "select",
            options: ["true", "false"],
            defaultValue: "true",
            hideInTable: true,
          },
          { key: "effectiveFrom", label: "Effective From", type: "date", hideInTable: true },
          { key: "effectiveTo", label: "Effective To", type: "date", hideInTable: true },
          {
            key: "parentAccountId",
            label: "Parent Account",
            type: "lookup",
            lookupTable: "accounts",
            lookupLabelKey: "accountName",
            lookupValueKey: "id",
            hideInTable: true,
          },
          {
            key: "status",
            label: "Status",
            hideInForm: true,
            format: (v: any, row: any) => (row.isActive === false ? <span className="text-destructive">Inactive</span> : <span className="text-success">Active</span>),
          },
        ]}
      />
    </div>
  ),
});
