"use client";

import { motion } from "framer-motion";
import {
  FileText,
  UserPlus,
  Target,
  Wallet,
  Package,
  Users,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/design-system";
import { StaggerContainer, StaggerItem } from "@/design-system";

const iconMap: Record<string, LucideIcon> = {
  FileText,
  UserPlus,
  Target,
  Wallet,
  Package,
  Users,
};

const colorMap: Record<string, string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/10 text-success border-success/20",
  info: "bg-info/10 text-info border-info/20",
  warning: "bg-warning/10 text-warning border-warning/20",
};

interface QuickAction {
  id: string;
  label: string;
  icon: string | LucideIcon;
  color: string;
  /** Optional route to navigate to when clicked. */
  to?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  onAction?: (id: string) => void;
  className?: string;
}

export function QuickActions({ actions, onAction, className }: QuickActionsProps) {
  const navigate = useNavigate();

  const handleClick = (action: QuickAction) => {
    if (action.to) {
      navigate({ to: action.to });
      return;
    }
    onAction?.(action.id);
  };

  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-sm", className)}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Quick Actions</span>
          <span className="text-[11px] text-muted-foreground">Common tasks</span>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => {
            const Icon =
              typeof action.icon === "string" ? iconMap[action.icon] || Plus : action.icon;
            return (
              <motion.button
                key={action.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleClick(action)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border p-3 text-left transition-all",
                  "hover:shadow-sm",
                  colorMap[action.color],
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
