"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCheck } from "lucide-react";
import { cn } from "../../lib/cn";
import { Badge } from "../ui/badge";

export interface Notification {
  id: string;
  title: string;
  message?: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  action?: { label: string; onClick: () => void };
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClear: (id: string) => void;
  className?: string;
}

const typeStyles = {
  info: "border-l-2 border-l-info",
  success: "border-l-2 border-l-success",
  warning: "border-l-2 border-l-warning",
  error: "border-l-2 border-l-destructive",
};

export function NotificationCenter({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClear,
  className,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-1 w-80 rounded-xl border border-border bg-popover shadow-dropdown z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {unread > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center px-4">
                  <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "flex gap-3 px-4 py-3 border-b border-border/50 last:border-b-0 transition-colors",
                      typeStyles[n.type],
                      !n.read && "bg-muted/30",
                    )}
                    onClick={() => {
                      if (!n.read) onMarkRead(n.id);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm", !n.read && "font-medium")}>{n.title}</p>
                      {n.message && (
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      )}
                      {n.action && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            n.action?.onClick();
                          }}
                          className="mt-1.5 text-xs text-primary hover:underline"
                        >
                          {n.action.label}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClear(n.id);
                      }}
                      className="h-5 w-5 shrink-0 rounded hover:bg-accent flex items-center justify-center"
                      aria-label="Dismiss notification"
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
