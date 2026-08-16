"use client";

import { motion } from "framer-motion";
import { cn } from "../../lib/cn";
import { type LucideIcon } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
  delay?: number;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  className,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-card p-4",
        "shadow-sm",
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            iconColor || "bg-primary/10",
          )}
        >
          <Icon className={cn("h-5 w-5", iconColor ? "text-white" : "text-primary")} />
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </motion.div>
  );
}
