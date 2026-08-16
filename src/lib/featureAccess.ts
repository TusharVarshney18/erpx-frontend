/**
 * Centralized feature-access logic for ERPX.
 *
 * Feature status is derived from the BACKEND subscription context
 * (organization plan -> isPremium) fetched via GET /subscriptions/organizations/:orgId/feature-access.
 * The frontend never invents access: it only maps the backend's plan to UI states.
 *
 * Three states:
 *  - AVAILABLE         -> fully functional in the current plan
 *  - DEMO_RESTRICTED   -> feature exists but requires a premium plan
 *  - NOT_IMPLEMENTED   -> development is incomplete (never disguised as Premium)
 */

export type FeatureId =
  | "banking"
  | "ai"
  | "integrations"
  | "automation"
  | "apiKeys"
  | "billing"
  | "advancedReports";

export type FeatureStatus = "AVAILABLE" | "DEMO_RESTRICTED" | "NOT_IMPLEMENTED";

export type FeatureAccess = {
  plan: string;
  isPremium: boolean;
  features: Record<string, boolean>;
};

export type FeatureAccessContext = {
  /** From backend org plan. */
  isPremium: boolean;
  /** Platform Super Admin bypasses customer subscription gating. */
  isSuperAdmin: boolean;
};

export type FeatureDefinition = {
  id: FeatureId;
  label: string;
  /** Backend feature slug returned by the feature-access endpoint. */
  slug: string;
  premium: boolean;
};

export const FEATURES: FeatureDefinition[] = [
  { id: "banking", label: "Banking", slug: "banking", premium: true },
  { id: "ai", label: "AI", slug: "ai", premium: true },
  { id: "integrations", label: "Integrations", slug: "integrations", premium: true },
  { id: "automation", label: "Automation", slug: "automation", premium: true },
  { id: "apiKeys", label: "API Keys", slug: "api_keys", premium: true },
  { id: "billing", label: "Billing", slug: "billing", premium: true },
  { id: "advancedReports", label: "Advanced Reports", slug: "advanced_reports", premium: true },
];

/**
 * Genuinely incomplete features (development gaps). These are surfaced as
 * NOT_IMPLEMENTED so they are never disguised as a premium restriction.
 */
export const NOT_IMPLEMENTED: FeatureId[] = [];

function featureById(id: FeatureId): FeatureDefinition | undefined {
  return FEATURES.find((f) => f.id === id);
}

/**
 * Returns the UI status for a feature given the backend-derived context.
 * Super Admin bypasses demo restrictions (platform authorization is separate
 * from customer subscription access).
 */
export function getFeatureStatus(
  id: FeatureId,
  ctx: FeatureAccessContext,
): FeatureStatus {
  if (NOT_IMPLEMENTED.includes(id)) return "NOT_IMPLEMENTED";
  const def = featureById(id);
  if (!def) return "AVAILABLE";
  if (ctx.isSuperAdmin) return "AVAILABLE";
  if (def.premium && !ctx.isPremium) return "DEMO_RESTRICTED";
  return "AVAILABLE";
}

export function isFeatureAvailable(id: FeatureId, ctx: FeatureAccessContext): boolean {
  return getFeatureStatus(id, ctx) === "AVAILABLE";
}

/** Map a backend feature-access payload into the frontend context. */
export function buildFeatureContext(
  access: FeatureAccess | undefined,
  isSuperAdmin: boolean,
): FeatureAccessContext {
  return {
    isPremium: access?.isPremium === true,
    isSuperAdmin,
  };
}
