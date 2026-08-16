"use client";

import { cn } from "../../lib/cn";

interface LoadingStateProps {
  className?: string;
  variant?: "spinner" | "skeleton" | "pulse";
  text?: string;
}

export function LoadingState({ className, variant = "spinner", text }: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div className={cn("flex flex-col gap-3 p-4", className)}>
        <div className="h-4 w-3/4 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-1/2 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-5/6 rounded-md bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16", className)}>
      {variant === "spinner" && (
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full border-2 border-muted" />
          <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
      {variant === "pulse" && (
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
        </div>
      )}
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
