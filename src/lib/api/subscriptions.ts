import { api } from "@/lib/api/client";
import type { FeatureAccess } from "@/lib/featureAccess";

export async function fetchFeatureAccess(orgId: string): Promise<FeatureAccess> {
  const res = await api.get<any>(
    `/subscriptions/organizations/${orgId}/feature-access`,
  );
  return res as FeatureAccess;
}
