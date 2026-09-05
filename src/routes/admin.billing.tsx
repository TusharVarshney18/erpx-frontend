import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageShell";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { UpgradeDialog } from "@/components/billing/upgrade-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  Receipt,
  TrendingUp,
  Zap,
  CalendarDays,
  ArrowUpDown,
  Ban,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/billing")({
  head: () => ({ meta: [{ title: "Billing — Acme ERP" }] }),
  component: () => (
    <PremiumGate feature="billing">
      <BillingPage />
    </PremiumGate>
  ),
});

type SubscriptionPlan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  billingInterval: string;
  price: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
};

type Subscription = {
  id: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  canceledAt: string | null;
  plan: SubscriptionPlan;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  totalAmount: number;
  periodStart: string | null;
  periodEnd: string | null;
  paidAt: string | null;
  dueAt: string | null;
  createdAt: string;
};

function BillingPage() {
  const qc = useQueryClient();
  const { activeOrganizationId, isSuperAdmin } = useAuth();
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");

  const {
    data: subscription,
    isLoading: subLoading,
    isError: subError,
    refetch: refetchSub,
  } = useQuery({
    queryKey: ["admin-subscription", activeOrganizationId],
    queryFn: () =>
      api.get<Subscription>(`/billing-portal/organizations/${activeOrganizationId}/subscription`),
    enabled: !!activeOrganizationId,
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["admin-subscription-plans"],
    queryFn: () => api.get<SubscriptionPlan[]>("/subscriptions/plans?isActive=true"),
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["admin-invoices", activeOrganizationId],
    queryFn: () =>
      api.get<Invoice[]>(
        `/billing-portal/organizations/${activeOrganizationId}/invoices?limit=100`,
      ),
    enabled: !!activeOrganizationId,
  });

  const changePlan = useMutation({
    mutationFn: async () => {
      return api.patch(`/subscriptions/organizations/${activeOrganizationId}/subscription/plan`, {
        planId: selectedPlanId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subscription"] });
      toast.success("Plan updated successfully");
      setShowChangePlan(false);
      setSelectedPlanId("");
    },
    onError: (e: any) => toast.error(e.message ?? "Plan change failed"),
  });

  const cancelSubscription = useMutation({
    mutationFn: async () => {
      return api.post(
        `/billing-portal/organizations/${activeOrganizationId}/subscription/cancel`,
        {},
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subscription"] });
      toast.success("Subscription canceled");
    },
    onError: (e: any) => toast.error(e.message ?? "Cancel failed"),
  });

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—";

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      ACTIVE: "bg-success/15 text-success",
      PAST_DUE: "bg-warning/15 text-warning",
      CANCELED: "bg-muted text-muted-foreground",
      EXPIRED: "bg-destructive/15 text-destructive",
      TRIALING: "bg-info/15 text-info",
      DRAFT: "bg-muted text-muted-foreground",
      PAID: "bg-success/15 text-success",
      VOID: "bg-muted text-muted-foreground",
      OVERDUE: "bg-destructive/15 text-destructive",
    };
    return variants[status] ?? "bg-muted text-muted-foreground";
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Billing & Subscription"
        subtitle="Manage your plan, invoices, and payment methods"
      />

      {subLoading || plansLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : subError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="font-semibold">Failed to load subscription</p>
          <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
          <Button variant="outline" size="sm" onClick={() => refetchSub()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      ) : (
        <>
          {subscription && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="flex flex-col gap-2 p-5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" /> Current Plan
                  </div>
                  <p className="text-2xl font-bold">{subscription.plan.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge className={statusBadge(subscription.status)}>
                      {subscription.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(subscription.plan.price, subscription.plan.currency)} /{" "}
                      {subscription.plan.billingInterval.toLowerCase()}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-2 p-5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" /> Billing Period
                  </div>
                  <p className="text-lg font-semibold">
                    {formatDate(subscription.currentPeriodStart)} —{" "}
                    {formatDate(subscription.currentPeriodEnd)}
                  </p>
                  {subscription.trialEndsAt && (
                    <p className="text-xs text-muted-foreground">
                      Trial ends {formatDate(subscription.trialEndsAt)}
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-2 p-5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" /> Usage
                  </div>
                  <p className="text-2xl font-bold">{invoices.length}</p>
                  <p className="text-sm text-muted-foreground">Total invoices</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              size="sm"
              className="gradient-primary text-white"
              onClick={() => {
                if (isSuperAdmin) {
                  setSelectedPlanId(subscription?.planId ?? "");
                  setShowChangePlan(true);
                } else {
                  setShowUpgrade(true);
                }
              }}
            >
              <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" /> Change Plan
            </Button>
            {subscription?.status === "ACTIVE" && (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => cancelSubscription.mutate()}
                disabled={cancelSubscription.isPending}
              >
                {cancelSubscription.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Ban className="mr-1.5 h-3.5 w-3.5" />
                )}
                Cancel Subscription
              </Button>
            )}
          </div>
        </>
      )}

      <div className="flex items-center gap-2">
        <Receipt className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Invoices</h3>
      </div>

      <Card>
        <CardContent className="p-0">
          {invoicesLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Receipt className="h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">No invoices yet</p>
              <p className="text-sm text-muted-foreground">
                Invoices will appear here once your subscription is active.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(inv.periodStart)} — {formatDate(inv.periodEnd)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(inv.totalAmount, inv.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadge(inv.status)}>{inv.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(inv.paidAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showChangePlan}
        onOpenChange={(o) => {
          if (!o) {
            setShowChangePlan(false);
            setSelectedPlanId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Plan</DialogTitle>
            <DialogDescription>
              Select a new subscription plan. Changes take effect immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-1.5">
              <Label>Select Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a plan…" />
                </SelectTrigger>
                <SelectContent>
                  {plans
                    .filter((p) => p.isActive)
                    .map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} — {formatCurrency(plan.price, plan.currency)} /{" "}
                        {plan.billingInterval.toLowerCase()}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePlan(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              disabled={changePlan.isPending || !selectedPlanId}
              onClick={() => changePlan.mutate()}
            >
              {changePlan.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
}
