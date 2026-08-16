import { Crown } from "lucide-react";

/**
 * Small "Premium" indicator used beside restricted sidebar items so demo
 * users can discover premium features without producing errors on click.
 */
export function PremiumChip() {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
      <Crown className="h-2.5 w-2.5" />
      Premium
    </span>
  );
}
