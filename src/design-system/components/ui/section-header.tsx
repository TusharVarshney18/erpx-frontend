"use client";

import { cn } from "../../lib/cn";

export interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: "page" | "section" | "card";
}

export function SectionHeader({
  title,
  description,
  action,
  className,
  variant = "section",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4",
        variant === "page" && "mb-8",
        variant === "section" && "mb-6",
        variant === "card" && "mb-4",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h2
          className={cn(
            variant === "page" && "text-h2",
            variant === "section" && "text-h3",
            variant === "card" && "text-h4",
          )}
        >
          {title}
        </h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
