import type { ReactNode } from "react";
import { AlertCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared card shell so every auth step (password, 2FA, org picker) matches. */
export const AUTH_CARD_CLASS =
  "rounded-2xl border border-border/60 bg-card/80 p-6 shadow-glass backdrop-blur-xl sm:p-8";

/** Consistent control height for inputs, select and Google buttons. */
export const AUTH_CONTROL_HEIGHT = "h-11";

export function InlineError({ children, className }: { children?: ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-[13px] leading-relaxed text-destructive",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

export function AuthTrustLine({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center justify-center gap-1.5 text-[11px] leading-relaxed text-muted-foreground",
        className,
      )}
    >
      <Lock className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
      Company data is isolated with role-based access.
    </p>
  );
}
