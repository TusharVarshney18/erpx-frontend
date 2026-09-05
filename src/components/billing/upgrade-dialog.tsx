import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Crown, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { billingApi, type BillingPlan } from "@/lib/api/billing";
import { openRazorpayCheckout, RAZORPAY_KEY_ID } from "@/lib/payments/razorpay";
import { cn } from "@/lib/utils";

const TIER_HIGHLIGHTS: Record<string, string[]> = {
  starter: ["Everything in Free", "Advanced reports", "Integrations", "Priority support"],
  pro: ["Everything in Starter", "AI capabilities", "Automation", "Banking & payroll"],
  enterprise: ["Everything in Pro", "SSO / SAML", "Dedicated support", "Custom limits"],
};

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}

function formatPlanPrice(plan: { price: number; currency: string }): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: plan.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(plan.price / 100);
  } catch {
    return `${plan.currency} ${(plan.price / 100).toFixed(0)}`;
  }
}

export function UpgradeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { plan: currentPlanName } = useFeatureAccess();
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [paying, setPaying] = useState(false);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["upgrade-plans"],
    queryFn: billingApi.plans,
    enabled: open,
  });

  const purchasable = plans
    .filter((p) => p.isActive && p.slug !== "free" && !p.slug.includes("-yearly"))
    .sort((a, b) => a.price - b.price);
  const currentPlan = (currentPlanName ?? "").toLowerCase();

  const pay = async (plan: BillingPlan) => {
    setPaying(true);
    try {
      const checkout = await billingApi.createCheckout(plan.id, "razorpay");
      if (!RAZORPAY_KEY_ID) {
        toast.error("Payments are not configured yet. Please try again shortly.");
        return;
      }
      await openRazorpayCheckout({
        key: RAZORPAY_KEY_ID,
        amount: checkout.amount,
        currency: checkout.currency,
        name: "ERPX",
        description: `${plan.name} subscription`,
        order_id: checkout.sessionId,
        prefill: { name: "ERPX" },
        theme: { color: "#4f46e5" },
        modal: {
          ondismiss: () => setPaying(false),
        },
        handler: async (response) => {
          try {
            const result = await billingApi.verifyPayment({
              provider: "razorpay",
              sessionId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            if (result.verified) {
              toast.success("Payment successful — your plan is being activated.");
              onOpenChange(false);
              setTimeout(() => window.location.reload(), 1200);
            } else {
              toast.error("Payment could not be verified. Contact support if you were charged.");
            }
          } catch (err) {
            toast.error(errorMessage(err, "Payment verification failed. Please try again."));
          } finally {
            setPaying(false);
          }
        },
      });
    } catch (err) {
      setPaying(false);
      toast.error(errorMessage(err, "Could not start payment. Please try again."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" /> Upgrade your plan
          </DialogTitle>
          <DialogDescription>
            Choose a plan that fits your team. Payment is processed securely by Razorpay.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-14 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : purchasable.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No paid plans are available yet. Please check back soon.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {purchasable.map((plan) => {
              const isCurrent = plan.slug.toLowerCase() === currentPlan;
              const popular = plan.slug === "pro";
              const highlights = TIER_HIGHLIGHTS[plan.slug] ?? [
                "Full module access",
                "Priority support",
              ];
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col rounded-2xl border p-5 transition-shadow",
                    isCurrent
                      ? "border-success/50 bg-success/5"
                      : popular
                        ? "border-primary/40 bg-primary/[0.03] shadow-sm"
                        : "border-border",
                  )}
                >
                  {popular && (
                    <Badge className="absolute -top-2.5 right-4 gradient-primary text-white">
                      <Sparkles className="mr-1 h-3 w-3" /> Popular
                    </Badge>
                  )}
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">{plan.name}</h3>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-[10px]">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-bold tracking-tight">
                      {formatPlanPrice(plan)}
                    </span>
                    <span className="text-xs text-muted-foreground"> / month</span>
                  </div>
                  <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                    {highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        {h}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-5 w-full"
                    disabled={isCurrent || paying}
                    variant={popular ? "default" : "outline"}
                    onClick={() => {
                      setSelectedPlanId(plan.id);
                      pay(plan);
                    }}
                  >
                    {paying && selectedPlanId === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCurrent ? (
                      "Current plan"
                    ) : (
                      `Subscribe to ${plan.name}`
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <Check className="mr-1 inline h-3 w-3 text-success" />
          Cancel anytime · Invoices are available in Billing
        </p>
      </DialogContent>
    </Dialog>
  );
}
