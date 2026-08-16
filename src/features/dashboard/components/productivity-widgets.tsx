"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, FileText, Bookmark, Pin, ArrowRight } from "lucide-react";
import { AnimatedContainer, cn } from "@/design-system";
import { Badge } from "@/design-system";
import type { KPI } from "../data";

interface Task {
  id: string;
  title: string;
  due: string;
  priority: "high" | "medium" | "low";
  category: string;
}

interface ProductivityWidgetsProps {
  tasks: Task[];
}

const priorityConfig = {
  high: { color: "bg-destructive/10 text-destructive border-destructive/20", label: "High" },
  medium: { color: "bg-warning/10 text-warning border-warning/20", label: "Med" },
  low: { color: "bg-info/10 text-info border-info/20", label: "Low" },
};

export function ProductivityWidgets({ tasks }: ProductivityWidgetsProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const pinnedItems = [
    { icon: FileText, label: "Q2 Financial Report", color: "text-primary" },
    { icon: FileText, label: "Inventory Summary", color: "text-success" },
    { icon: FileText, label: "Sales Pipeline", color: "text-info" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Upcoming Tasks */}
      <AnimatedContainer delay={0.05}>
        <div className="rounded-xl border border-border bg-card shadow-sm h-full">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Upcoming Tasks</span>
            </div>
            <button className="text-xs text-primary hover:underline">View All</button>
          </div>
          <div className="p-4 space-y-2">
            {tasks.map((task, i) => {
              const priority = priorityConfig[task.priority];
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group flex items-start gap-3 rounded-lg border border-border/60 p-2.5 transition-all hover:border-border hover:bg-muted/30 cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{task.title}</span>
                      <span
                        className={cn(
                          "text-[10px] rounded-full px-1.5 py-0.5 font-medium border",
                          priority.color,
                        )}
                      >
                        {priority.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due {task.due}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{task.category}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </AnimatedContainer>

      {/* Calendar Widget */}
      <AnimatedContainer delay={0.1}>
        <div className="rounded-xl border border-border bg-card shadow-sm h-full">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Today</span>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm font-medium mb-3">{dateStr}</p>
            <div className="space-y-2">
              {[
                { time: "10:00 AM", title: "Team Standup", type: "Meeting" },
                { time: "12:00 PM", title: "Lunch with Client", type: "Meeting" },
                { time: "2:00 PM", title: "Review Q2 Report", type: "Deadline" },
                { time: "4:00 PM", title: "Vendor Call", type: "Call" },
              ].map((event, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {event.time.split(" ")[0]}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {event.time.split(" ")[1]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{event.title}</p>
                    <p className="text-[11px] text-muted-foreground">{event.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedContainer>

      {/* Pinned Reports & Bookmarks */}
      <AnimatedContainer delay={0.15}>
        <div className="rounded-xl border border-border bg-card shadow-sm h-full">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Pin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Pinned Reports</span>
            </div>
            <button className="text-xs text-primary hover:underline">Manage</button>
          </div>
          <div className="p-4 space-y-2">
            {pinnedItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <item.icon className={cn("h-4 w-4", item.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}

            <div className="border-t border-border/50 pt-3 mt-3">
              <div className="flex items-center gap-2 mb-2">
                <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Shortcuts</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["Dashboard", "Reports", "Invoices", "CRM", "Inventory"].map((s) => (
                  <button
                    key={s}
                    className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AnimatedContainer>
    </div>
  );
}
