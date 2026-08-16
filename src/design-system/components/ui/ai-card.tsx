"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "../../lib/cn";

export interface AICardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: "default" | "premium" | "subtle";
}

export function AICard({
  title,
  description,
  children,
  className,
  delay = 0,
  onClick,
  icon,
  variant = "default",
}: AICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
      whileHover={onClick ? { y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl border p-5",
        "transition-all duration-150",
        variant === "default" && "border-border bg-card shadow-sm",
        variant === "premium" &&
          "border-ai/20 bg-gradient-to-br from-card via-card to-ai/5 shadow-md",
        variant === "subtle" && "border-border/50 bg-muted/30",
        onClick && "cursor-pointer hover:shadow-md",
        className,
      )}
    >
      {variant === "premium" && (
        <div className="absolute inset-0 bg-gradient-to-br from-ai/5 via-transparent to-primary/5 pointer-events-none" />
      )}

      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              variant === "premium" ? "bg-ai/15 text-ai" : "bg-primary/10 text-primary",
            )}
          >
            {icon || <Sparkles className="h-4 w-4" />}
          </div>
          <div className="flex flex-col">
            <span
              className={cn("text-sm font-semibold", variant === "premium" && "text-gradient-ai")}
            >
              {title}
            </span>
            {description && <span className="text-xs text-muted-foreground">{description}</span>}
          </div>
        </div>
        {children && <div className="text-sm text-muted-foreground">{children}</div>}
      </div>
    </motion.div>
  );
}
