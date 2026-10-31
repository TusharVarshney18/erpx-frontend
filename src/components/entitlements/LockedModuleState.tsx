import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useUpgradeModal } from "@/components/entitlements/UpgradeModalProvider";
import {
  moduleBenefits,
  moduleLabel,
  planLabel,
  type EntitlementModule,
} from "@/lib/entitlements";
import { cn } from "@/lib/utils";

/**
 * Full-page/section locked state for a plan-gated module. Used both by <Gate>
 * and by direct URL access (route guard), so both paths render the same UX.
 */
export function LockedModuleState({
  module,
  title,
  description,
  compact = false,
  className,
}: {
  module: EntitlementModule;
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
}) {
  const { entitlements, requiredPlan, moduleState } = useEntitlements();
  const { openUpgrade } = useUpgradeModal();
  const required = requiredPlan(module);
  const state = moduleState(module);
  const label = moduleLabel(module, entitlements);
  const benefits = moduleBenefits(module, entitlements);
  const inactive = entitlements?.access === "read_only";

  return (
    <div className={cn("mx-auto w-full max-w-lg", compact ? "py-6" : "py-12", className)}>
      <Card className="border-dashed">
        <CardContent className={cn("flex flex-col items-center gap-4 text-center", compact ? "px-6 py-8" : "px-8 py-12")}>
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-500">
            <Lock className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{title ?? `${label} is locked`}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {description ??
                (inactive
                  ? "Your subscription is inactive. Renew to regain access — your data is safe and read-only export remains available."
                  : `${label} isn't included in your current plan.`)}
            </p>
          </div>

          {required && !inactive && (
            <Badge className="gap-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/15 dark:text-amber-400">
              <Sparkles className="h-3 w-3" />
              Requires {planLabel(required)}
            </Badge>
          )}
          {state?.source === "override" && state.expiresAt ? (
            <p className="text-xs text-muted-foreground">
              Access grant expires {new Date(state.expiresAt).toLocaleDateString()}.
            </p>
          ) : null}

          {!compact && (
            <div className="w-full max-w-xs space-y-1.5 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Included with {required ? planLabel(required) : "an upgrade"}
              </p>
              <ul className="space-y-1">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2 text-sm">
                    <span className="h-1 w-1 rounded-full bg-amber-500" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            className="gradient-primary text-white shadow-glow"
            onClick={() => openUpgrade({ module, requiredPlan: required })}
          >
            {inactive ? "Renew subscription" : "Upgrade to unlock"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
