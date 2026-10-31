import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  fetchEntitlements,
  type EntitlementModule,
  type Entitlements,
} from "@/lib/entitlements";

export const ENTITLEMENTS_QUERY_KEY = "me-entitlements";

/**
 * Effective plan entitlements for the active organization/company.
 * Fetched after login (as soon as the active org is known) and shared by the
 * sidebar, route guards, <Gate> and locked-action UX.
 */
export function useEntitlements() {
  const { activeOrganizationId, loading: authLoading } = useAuth();
  const orgId = activeOrganizationId;

  const query = useQuery({
    queryKey: [ENTITLEMENTS_QUERY_KEY, orgId],
    queryFn: fetchEntitlements,
    enabled: !!orgId && !authLoading,
    staleTime: 60_000,
    retry: 1,
  });

  const data = query.data;

  const isModuleEnabled = (module: EntitlementModule): boolean => {
    // Optimistically allow while loading / when the API is unavailable so a
    // transient failure never hides a paying customer's modules.
    if (!data) return true;
    return data.modules[module]?.enabled === true;
  };

  const requiredPlan = (module: EntitlementModule): string | null =>
    data?.modules[module]?.requiredPlan ?? null;

  const moduleState = (module: EntitlementModule) => data?.modules[module];

  return {
    ...query,
    entitlements: data as Entitlements | undefined,
    orgId,
    isModuleEnabled,
    requiredPlan,
    moduleState,
    isLocked: (module: EntitlementModule) => !isModuleEnabled(module),
    planSlug: data?.plan.slug ?? null,
    planName: data?.plan.name ?? null,
    state: data?.plan.state ?? null,
    access: data?.access ?? "full",
    limits: data?.limits ?? { maxUsers: null, maxCompanies: null },
    usage: data?.usage ?? { users: 0, companies: 0 },
  };
}
