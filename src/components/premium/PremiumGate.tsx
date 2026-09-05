import { useState, type ReactNode } from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { getFeatureStatus, type FeatureId } from "@/lib/featureAccess";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UpgradeDialog } from "@/components/billing/upgrade-dialog";

const RESTRICTED_FEATURE_BULLETS = [
  "Full module access",
  "Advanced reports",
  "Automation",
  "AI capabilities",
  "Integrations",
  "Administrative controls",
];

/**
 * Wraps premium-only content. When the feature is restricted in the current
 * plan (and the user is not a Super Admin), it renders a polished locked state
 * instead of the content — never an error or an unfinished page.
 */
export function PremiumGate({
  feature,
  title,
  description,
  children,
}: {
  feature: FeatureId;
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  const { ctx, status } = useFeatureAccess();
  const featureStatus = status(feature);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Super Admin platform administration bypasses customer subscription gating.
  if (ctx.isSuperAdmin || featureStatus !== "DEMO_RESTRICTED") {
    return <>{children}</>;
  }

  const heading = title ?? "Premium Feature";
  const body = description ?? "This feature is limited in the demo version.";

  return (
    <>
      <div className="mx-auto max-w-lg py-12">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 px-8 py-12 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-500">
              <Crown className="h-7 w-7" />
            </div>
            <div>
              <h2 className="flex items-center justify-center gap-2 text-xl font-bold tracking-tight">
                <Lock className="h-4 w-4 text-muted-foreground" />
                {heading}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
            <div className="w-full max-w-xs space-y-1.5 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Upgrade to Premium to unlock
              </p>
              <ul className="space-y-1">
                {RESTRICTED_FEATURE_BULLETS.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm">
                    <span className="h-1 w-1 rounded-full bg-amber-500" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <Button className="gradient-primary text-white" onClick={() => setUpgradeOpen(true)}>
              <Crown className="mr-1.5 h-4 w-4" /> Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      </div>
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
