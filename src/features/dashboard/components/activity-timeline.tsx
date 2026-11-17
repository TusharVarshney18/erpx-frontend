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
    <div className="h-full overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
        <div className="flex flex-col">
          <span className="font-display text-[15px] font-semibold tracking-tight">Activity</span>
          <span className="text-[11px] text-muted-foreground">Latest changes across your organization</span>
        </div>
        <button className="rounded-lg px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10">View all</button>
      </div>

      <div className="p-5">
        {events.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No activity recorded yet.</p>
        )}
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
                  <div className="absolute left-[15px] top-9 bottom-1 w-px bg-gradient-to-b from-border to-transparent" />
                )}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card",
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
