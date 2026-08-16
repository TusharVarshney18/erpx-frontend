"use client";

import { motion } from "framer-motion";
import {
  Clock,
  FileText,
  ArrowRightLeft,
  ShoppingCart,
  CheckCheck,
  UserPlus,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/design-system";
import type { TimelineEvent } from "../data";

const eventIcons = {
  invoice: FileText,
  payment: ArrowRightLeft,
  order: ShoppingCart,
  approval: CheckCheck,
  employee: UserPlus,
  ai: Sparkles,
  alert: AlertTriangle,
};

const eventColors = {
  invoice: "bg-primary/10 text-primary",
  payment: "bg-success/10 text-success",
  order: "bg-info/10 text-info",
  approval: "bg-success/10 text-success",
  employee: "bg-primary/10 text-primary",
  ai: "bg-ai/10 text-ai",
  alert: "bg-warning/10 text-warning",
};

interface ActivityTimelineProps {
  events: TimelineEvent[];
}

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Activity Timeline</span>
          <span className="text-[11px] text-muted-foreground">Everything happening today</span>
        </div>
        <button className="text-xs text-primary hover:underline font-medium">View All</button>
      </div>

      <div className="p-5">
        <div className="relative space-y-0">
          {events.map((event, i) => {
            const Icon = eventIcons[event.type];
            const isLast = i === events.length - 1;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
                className="relative flex gap-4 pb-5 last:pb-0"
              >
                {!isLast && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border/60" />
                )}
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    eventColors[event.type],
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{event.title}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.time}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                  {event.user && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[8px] font-medium text-muted-foreground">
                        {event.user.initials}
                      </div>
                      <span className="text-[11px] text-muted-foreground">{event.user.name}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
