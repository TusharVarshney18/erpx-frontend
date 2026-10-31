import { Link } from "@tanstack/react-router";
import { Building2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({
  className,
  subtitle = "Enterprise suite",
}: {
  className?: string;
  subtitle?: string | null;
}) {
  return (
    <Link
      to="/"
      aria-label="ERPX home"
      className={cn("group flex items-center gap-2.5 rounded-lg", className)}
    >
      <span className="relative grid h-9 w-9 place-items-center rounded-xl gradient-primary text-white shadow-glow">
        <Building2 className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-tight text-white">ERPX</span>
        {subtitle ? (
          <span className="block text-[10px] uppercase tracking-[0.18em] text-white/45">
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
