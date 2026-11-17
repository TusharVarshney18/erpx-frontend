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
    <div className={cn("overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card", className)}>
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
        <div className="flex flex-col">
          <span className="font-display text-[15px] font-semibold tracking-tight">Quick actions</span>
          <span className="text-[11px] text-muted-foreground">Jump straight into common tasks</span>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {actions.map((action) => {
            const Icon =
              typeof action.icon === "string" ? iconMap[action.icon] || Plus : action.icon;
            return (
              <motion.button
                key={action.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleClick(action)}
                className={cn(
                  "group flex flex-col items-start gap-3 rounded-xl border border-border/80 bg-gradient-to-b from-card to-muted/40 p-3.5 text-left transition-all",
                  "hover:border-primary/30 hover:shadow-md",
                )}
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/15 transition group-hover:gradient-primary group-hover:text-white">
                  <Icon className="h-4 w-4 shrink-0" />
                </span>
                <span className="text-[13px] font-semibold text-foreground">{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
