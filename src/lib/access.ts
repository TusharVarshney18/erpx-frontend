/**
 * Central access-control model for ERPX.
 *
 * Three SEPARATE concepts are kept apart:
 *   1. RBAC (user permissions)      -> decides VISIBILITY
 *   2. Subscription / plan          -> decides PREMIUM/LOCKED vs full access
 *   3. Super Admin (platform owner) -> full platform management + tenant access
 *
 * Decision rule used everywhere:
 *   if (!hasPermission(feature))      HIDE
 *   else if (!planIncludes(feature))  SHOW as Premium/Locked
 *   else                              SHOW normally
 */

export type Permission = string; // "resource:action", "resource:*" or "*:*"

/** Maps frontend FeatureId keys to backend feature slugs from feature-access. */
export const FEATURE_SLUG_BY_ID: Record<string, string | null> = {
  banking: "banking",
  ai: "ai",
  integrations: "integrations",
  automation: "automation",
  apiKeys: "api_keys",
  billing: "billing",
  advancedReports: "advanced_reports",
};

/** Matches a single required permission against the user's permission set. */
export function matchesPermission(
  userPermissions: Permission[] | undefined,
  required: Permission,
  isSuperAdmin = false,
): boolean {
  if (isSuperAdmin) return true; // backend PermissionGuard grants Super Admin a bypass
  if (!userPermissions || userPermissions.length === 0) return false;

  const reqResource = required.slice(0, required.lastIndexOf(":"));
  const reqAction = required.slice(required.lastIndexOf(":") + 1);

  return userPermissions.some((p) => {
    if (p === "*:*") return true;
    const res = p.slice(0, p.lastIndexOf(":"));
    const act = p.slice(p.lastIndexOf(":") + 1);
    if (res === "*") return true;
    if (res !== reqResource) return false;
    if (act === "*") return true;
    return act === reqAction;
  });
}

export function hasAnyPermission(
  permissions: Permission[] | undefined,
  required: Permission[],
  isSuperAdmin = false,
): boolean {
  return required.some((p) => matchesPermission(permissions, p, isSuperAdmin));
}

export function hasAllPermissions(
  permissions: Permission[] | undefined,
  required: Permission[],
  isSuperAdmin = false,
): boolean {
  return required.every((p) => matchesPermission(permissions, p, isSuperAdmin));
}

export interface AccessContext {
  permissions: Permission[];
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  isDemo: boolean;
  isPremium: boolean;
  plan: string | null;
  /** Feature slugs available to the organization's subscription. */
  features: string[];
  /** Feature slug -> available (from subscription) */
  featureMap: Record<string, boolean>;
}

export const EMPTY_ACCESS: AccessContext = {
  permissions: [],
  isSuperAdmin: false,
  isOrgAdmin: false,
  isDemo: false,
  isPremium: false,
  plan: null,
  features: [],
  featureMap: {},
};
