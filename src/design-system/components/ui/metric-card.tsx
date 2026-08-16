"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

export interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  format?: "currency" | "percentage" | "number" | "text";
  className?: string;
  delay?: number;
  onClick?: () => void;
}

const trendIcons: Record<string, LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

const trendColors = {
  up: "text-success",
  down: "text-destructive",
  neutral: "text-muted-foreground",
};

const trendBg = {
  up: "bg-success/10",
  down: "bg-destructive/10",
  neutral: "bg-muted",
};

export function MetricCard({
  title,
  value,
  description,
  change,
  changeLabel,
  icon: Icon,
  iconColor,
  trend = "neutral",
  className,
  delay = 0,
  onClick,
}: MetricCardProps) {
  const TrendIcon = trendIcons[trend];

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "relative flex flex-col gap-2 rounded-xl border border-border bg-card p-5 text-left",
        "shadow-sm hover:shadow-md hover:border-ring/30",
        "transition-all duration-150",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">{title}</span>
        {Icon && (
          <div className={cn("p-1.5 rounded-lg", trendBg[trend])}>
            <Icon className={cn("h-4 w-4", iconColor || trendColors[trend])} />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        {change !== undefined && (
          <span className={cn("flex items-center gap-0.5 text-sm font-medium", trendColors[trend])}>
            <TrendIcon className="h-3.5 w-3.5" />
            {Math.abs(change)}%
          </span>
        )}
      </div>

      {(description || changeLabel) && (
        <p className="text-xs text-muted-foreground">
          {description ||
            `${changeLabel} ${trend === "up" ? "increase" : trend === "down" ? "decrease" : ""}`}
        </p>
      )}
    </motion.button>
  );
}
