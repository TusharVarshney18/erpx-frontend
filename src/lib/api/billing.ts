import { api } from "@/lib/api/client";

export type PlanInterval = "MONTHLY" | "YEARLY";

export type BillingPlan = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  currency: string;
  billingInterval: PlanInterval;
  isActive: boolean;
};

export type CheckoutResult = {
  checkoutUrl: string;
  sessionId: string;
  provider: string;
  paymentId: string;
  amount: number;
  currency: string;
  plan: { id: string; name: string };
};

export type VerifyPaymentResult = {
  verified: boolean;
  paymentId: string;
  status: string;
};

export type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export const billingApi = {
  plans: () => api.get<BillingPlan[]>("/subscriptions/plans?isActive=true"),
  createCheckout: (planId: string, provider = "razorpay") =>
    api.post<CheckoutResult>("/billing/checkout", { planId, provider }),
  verifyPayment: (input: {
    provider: string;
    sessionId: string;
    paymentId: string;
    signature?: string;
  }) =>
    api.post<VerifyPaymentResult>("/billing/payments/verify", {
      provider: input.provider,
      sessionId: input.sessionId,
      paymentId: input.paymentId,
      signature: input.signature,
    }),
};
