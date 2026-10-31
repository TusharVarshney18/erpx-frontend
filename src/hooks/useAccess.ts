import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useEntitlements } from "@/hooks/useEntitlements";
import {
  matchesPermission,
  hasAnyPermission,
  hasAllPermissions,
  FEATURE_SLUG_BY_ID,
  type Permission,
  type AccessContext,
} from "@/lib/access";
import type { FeatureId } from "@/lib/featureAccess";
import {
  ENTITLEMENT_MODULES,
  type EntitlementModule,
} from "@/lib/entitlements";

/**
 * Single source of truth for what the current user may see/do.
 * - hasPermission / hasAnyPermission / hasAllPermissions  -> RBAC (visibility)
 * - hasFeature                                            -> subscription gate
 * - isOrgAdmin / isSuperAdmin / isDemo                     -> role flags
 */
export function useAccess() {
  const { user, isSuperAdmin } = useAuth();
  const featureAccess = useFeatureAccess();
  const entitlements = useEntitlements();

  const permissions = user?.permissions ?? [];
  const isOrgAdmin = user?.isOrgAdmin === true;
  const isDemo = user?.isDemo === true || (!featureAccess.isPremium && !isSuperAdmin);
  const plan = featureAccess.plan ?? user?.subscription?.plan ?? null;
  const isPremium = featureAccess.isPremium || user?.subscription?.isPremium === true;

  // Owners / organization admins have unrestricted access to every module.
  const isAdmin = isSuperAdmin || isOrgAdmin;

  const featureMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (user?.features) {
      user.features.forEach((slug) => {
        map[slug] = true;
      });
    }
    if (featureAccess.features) {
      Object.entries(featureAccess.features).forEach(([slug, enabled]) => {
        map[slug] = isAdmin || enabled === true;
      });
    }
    return map;
  }, [user?.features, featureAccess.features, isAdmin]);

  const context: AccessContext = {
    permissions,
    isSuperAdmin,
    isOrgAdmin,
    isDemo,
    isPremium,
    plan,
    features: Object.keys(featureMap),
    featureMap,
    moduleMap: entitlements.entitlements
      ? Object.fromEntries(
          ENTITLEMENT_MODULES.map((module) => [
            module,
            isAdmin || entitlements.isModuleEnabled(module),
          ]),
        )
      : {},
    moduleRequiredPlan: Object.fromEntries(
      ENTITLEMENT_MODULES.map((module) => [module, entitlements.requiredPlan(module)]),
    ),
  };

  const hasPermission = (p: Permission) => matchesPermission(permissions, p, isSuperAdmin);
  const canAny = (p: Permission[]) => hasAnyPermission(permissions, p, isSuperAdmin);
  const canAll = (p: Permission[]) => hasAllPermissions(permissions, p, isSuperAdmin);

  /** Whether the organization's subscription includes the feature. */
  const hasFeature = (key: FeatureId): boolean => {
    if (isAdmin) return true;
    const def = FEATURE_SLUG_BY_ID[key];
    if (!def) return true;
    return featureMap[def] !== false;
  };

  /** Feature UI status (AVAILABLE | DEMO_RESTRICTED | NOT_IMPLEMENTED). */
  const featureStatus = (key: FeatureId) => featureAccess.status(key);

  /** Whether the plan includes a module. */
  const hasModule = (module: EntitlementModule): boolean => {
    if (isAdmin) return true;
    if (!entitlements.entitlements) return true;
    return entitlements.isModuleEnabled(module);
  };

  return {
    user,
    permissions,
    isSuperAdmin,
    isOrgAdmin,
    isDemo,
    isPremium,
    plan,
    context,
    hasPermission,
    canAny,
    canAll,
    hasFeature,
    hasModule,
    featureStatus,
    featureAccess,
    entitlements,
  };
}

export type Access = ReturnType<typeof useAccess>;
