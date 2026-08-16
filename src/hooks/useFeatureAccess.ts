import { useQuery } from "@tanstack/react-query";
import { fetchFeatureAccess } from "@/lib/api/subscriptions";
import { useAuth } from "@/lib/auth";
import {
  buildFeatureContext,
  getFeatureStatus,
  isFeatureAvailable,
  type FeatureAccessContext,
  type FeatureId,
  type FeatureStatus,
} from "@/lib/featureAccess";

/**
 * Provides the org's feature-access context, keyed by the active organization.
 * Feature gating is driven by the backend subscription context; Super Admin
 * bypasses demo restrictions via isSuperAdmin.
 */
export function useFeatureAccess() {
  const { activeOrganizationId, isSuperAdmin } = useAuth();
  const orgId = activeOrganizationId;

  const { data, isLoading, error } = useQuery({
    queryKey: ["feature-access", orgId],
    queryFn: () => fetchFeatureAccess(orgId as string),
    enabled: !!orgId,
    staleTime: 60_000,
  });

  const ctx: FeatureAccessContext = buildFeatureContext(data, isSuperAdmin);

  const status = (id: FeatureId): FeatureStatus => getFeatureStatus(id, ctx);
  const available = (id: FeatureId): boolean => isFeatureAvailable(id, ctx);

  return {
    isPremium: ctx.isPremium,
    isSuperAdmin: ctx.isSuperAdmin,
    plan: data?.plan ?? null,
    features: data?.features ?? {},
    isLoading,
    error,
    ctx,
    status,
    available,
  };
}
