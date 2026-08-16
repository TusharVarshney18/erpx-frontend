"use client";

import { type ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface TopNavProps {
  leftContent?: ReactNode;
  centerContent?: ReactNode;
  rightContent?: ReactNode;
  className?: string;
  variant?: "default" | "glass" | "floating";
}

export function TopNav({
  leftContent,
  centerContent,
  rightContent,
  className,
  variant = "default",
}: TopNavProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 items-center justify-between px-4 gap-4",
        variant === "default" && "border-b border-border bg-background",
        variant === "glass" && "glass border-b border-border/50",
        variant === "floating" && "mx-4 mt-2 rounded-xl border border-border/50 glass-strong",
        className,
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">{leftContent}</div>
      {centerContent && (
        <div className="flex items-center gap-2 flex-shrink-0">{centerContent}</div>
      )}
      <div className="flex items-center gap-2 flex-1 justify-end min-w-0">{rightContent}</div>
    </header>
  );
}
