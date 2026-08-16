import { type ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAccess } from "@/hooks/useAccess";
import { FEATURE_SLUG_BY_ID, type Permission } from "@/lib/access";

type RequireAccessProps = {
  children: ReactNode;
  /** Read-level permission(s). ANY-of semantics. */
  permission?: Permission | Permission[];
  /** Require an organization-administrator role in addition to permission. */
  adminOnly?: boolean;
  /** When the RBAC check passes but the feature is not in the plan, render a premium gate instead of 403. */
  featureKey?: "banking" | "ai" | "integrations" | "automation" | "apiKeys" | "billing" | "advancedReports";
  /** Redirect target when not permitted (defaults to a 403 screen). */
  fallback?: "denied" | "home";
};

/**
 * Route-level access guard. Hiding a sidebar item is NOT security; this is
 * enforced on every sensitive route so a manually entered URL cannot render an
 * unauthorized page.
 */
export function RequireAccess({
  children,
  permission,
  adminOnly,
  featureKey,
  fallback = "denied",
}: RequireAccessProps) {
  const { user, loading } = useAuth();
  const access = useAccess();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null; // AuthGate redirects to /auth

  const perms = permission ? (Array.isArray(permission) ? permission : [permission]) : [];
  const hasPerm = perms.length === 0 || access.canAny(perms);
  const isOrgAdminOk = !adminOnly || access.isOrgAdmin;

  if (!hasPerm || !isOrgAdminOk) {
    if (fallback === "home") {
      return <RedirectHome />;
    }
    return <DeniedScreen />;
  }

  // Premium gating: authorized but feature not in the plan -> show the lock,
  // never a 403. Super Admin bypasses subscription gating.
  if (featureKey && !access.isSuperAdmin) {
    const slug = FEATURE_SLUG_BY_ID[featureKey];
    if (slug && access.context.featureMap[slug] === false) {
      return <PremiumLocked featureLabel={featureLabel(featureKey)} plan={access.plan} />;
    }
  }

  return <>{children}</>;
}

function RedirectHome() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/" });
  }, [navigate]);
  return null;
}

function DeniedScreen() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-semibold">403 · Access denied</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account doesn't have permission to access this page. Contact an
          administrator if you believe this is a mistake.
        </p>
      </div>
    </div>
  );
}

function PremiumLocked({ featureLabel, plan }: { featureLabel: string; plan: string | null }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold">Premium feature</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {featureLabel} is available on a paid plan. Your organization is on{" "}
          <span className="font-semibold">{(plan ?? "FREE").toUpperCase()}</span>.
        </p>
      </div>
    </div>
  );
}

function featureLabel(key: string): string {
  const map: Record<string, string> = {
    banking: "Banking",
    ai: "AI",
    integrations: "Integrations",
    automation: "Automation",
    apiKeys: "API Keys",
    billing: "Billing",
    advancedReports: "Advanced Reports",
  };
  return map[key] ?? "This feature";
}
