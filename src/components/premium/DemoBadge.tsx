import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Compact DEMO badge for the top navigation. Shown when the active
 * organization is on a non-premium plan, signalling that some functionality
 * is intentionally restricted in the demo.
 */
export function DemoBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex h-6 cursor-help items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 text-[11px] font-semibold leading-none text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
          role="status"
          aria-label="Demo version"
        >
          DEMO
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-center">
        <p className="font-medium">Demo version</p>
        <p className="mt-0.5 text-muted-foreground">
          Some features are restricted. Upgrade to Premium to unlock full access.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
