import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Lock, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useEntitlements } from "@/hooks/useEntitlements";
import {
  moduleBenefits,
  moduleLabel,
  planLabel,
  type EntitlementModule,
} from "@/lib/entitlements";

type UpgradeRequest = {
  module: EntitlementModule;
  requiredPlan?: string | null;
};

type UpgradeModalContextValue = {
  openUpgrade: (request: UpgradeRequest) => void;
  closeUpgrade: () => void;
};

const UpgradeModalContext = createContext<UpgradeModalContextValue>({
  openUpgrade: () => {},
  closeUpgrade: () => {},
});

export const useUpgradeModal = () => useContext(UpgradeModalContext);

export const FEATURE_LOCKED_EVENT = "erpx:feature-locked";

/** Modules the user explicitly dismissed during this browser session. */
const DISMISSED_STORAGE_KEY = "erpx:upgrade-dismissed-modules";

function loadDismissedModules(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.sessionStorage.getItem(DISMISSED_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((m): m is string => typeof m === "string") : []);
  } catch {
    return new Set();
  }
}

function persistDismissedModules(modules: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...modules]));
  } catch {
    /* sessionStorage may be unavailable (private mode) */
  }
}

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<UpgradeRequest | null>(null);
  const requestRef = useRef<UpgradeRequest | null>(null);
  const dismissedModulesRef = useRef<Set<string>>(loadDismissedModules());
  const { user, isSuperAdmin } = useAuth();
  const { entitlements, requiredPlan } = useEntitlements();
  const isAdmin = isSuperAdmin || user?.isOrgAdmin === true;

  const openUpgrade = useCallback((next: UpgradeRequest) => {
    // An explicit click always opens the modal, even if auto-prompts for this
    // module were dismissed earlier.
    dismissedModulesRef.current.delete(next.module);
    persistDismissedModules(dismissedModulesRef.current);
    requestRef.current = next;
    setRequest(next);
  }, []);
  const closeUpgrade = useCallback(() => {
    const dismissed = requestRef.current?.module;
    if (dismissed) {
      dismissedModulesRef.current.add(dismissed);
      persistDismissedModules(dismissedModulesRef.current);
    }
    requestRef.current = null;
    setRequest(null);
  }, []);

  // Global FEATURE_LOCKED handler: the API client dispatches this event for
  // any 403 with code=FEATURE_LOCKED, no matter which request triggered it.
  // Dismissals are remembered per module (across navigation and reloads) so
  // cancelling the upgrade prompt doesn't immediately pop it up again.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<Partial<UpgradeRequest>>).detail;
      if (!detail?.module || isAdmin || requestRef.current) return;
      if (dismissedModulesRef.current.has(detail.module)) return;
      const next = { module: detail.module, requiredPlan: detail.requiredPlan ?? null };
      requestRef.current = next;
      setRequest(next);
    };
    window.addEventListener(FEATURE_LOCKED_EVENT, handler);
    return () => window.removeEventListener(FEATURE_LOCKED_EVENT, handler);
  }, [isAdmin]);

  const value = useMemo(
    () => ({ openUpgrade, closeUpgrade }),
    [openUpgrade, closeUpgrade],
  );

  const module = request?.module;
  const required = request?.requiredPlan ?? (module ? requiredPlan(module) : null);
  const label = module ? moduleLabel(module, entitlements) : "This feature";
  const benefits = module ? moduleBenefits(module, entitlements) : [];

  const goToPlans = () => {
    const plan = required ? `?plan=${encodeURIComponent(required)}` : "";
    const target = isAdmin ? `/admin/billing${plan}` : `/pricing${plan}`;
    closeUpgrade();
    window.location.assign(target);
  };

  return (
    <UpgradeModalContext.Provider value={value}>
      {children}
      <Dialog open={!!request} onOpenChange={(open) => !open && closeUpgrade()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-500">
              <Lock className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center">
              Unlock {label}
            </DialogTitle>
            <DialogDescription className="text-center">
              {label} isn't included in your current plan.
              {required ? (
                <>
                  {" "}
                  It's available on the{" "}
                  <span className="font-semibold text-foreground">{planLabel(required)}</span> plan
                  and above.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          {required && (
            <div className="flex justify-center">
              <Badge className="gap-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/15 dark:text-amber-400">
                <Sparkles className="h-3 w-3" />
                Minimum plan: {planLabel(required)}
              </Badge>
            </div>
          )}

          <ul className="mx-auto mt-1 w-full max-w-sm space-y-2">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {benefit}
              </li>
            ))}
          </ul>

          <DialogFooter className="sm:justify-center">
            <Button variant="outline" onClick={closeUpgrade}>
              Not now
            </Button>
            <Button className="gradient-primary text-white shadow-glow" onClick={goToPlans}>
              {isAdmin ? "Upgrade plan" : "View plans"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UpgradeModalContext.Provider>
  );
}
