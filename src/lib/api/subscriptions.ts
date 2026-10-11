import { api } from "@/lib/api/client";
import type { FeatureAccess } from "@/lib/featureAccess";

export async function fetchFeatureAccess(orgId: string): Promise<FeatureAccess> {
  return api.get<FeatureAccess>(`/subscriptions/organizations/${orgId}/feature-access`);
}

export type AiUsage = {
  planSlug: string | null;
  subscriptionStatus: string | null;
  aiCopilot: boolean;
  aiEnabled: boolean;
  aiMonthlyQuota: number | null;
  aiQuotaOverride: number | null;
  aiOverrideActive: boolean;
  aiAddonBalance: number;
  used: number;
  remaining: number | null;
  withinQuota: boolean;
  periodStart: string;
  periodEnd: string;
};

export async function fetchAiUsage(orgId: string): Promise<AiUsage> {
  return api.get<AiUsage>(`/subscriptions/organizations/${orgId}/ai-usage`);
}
