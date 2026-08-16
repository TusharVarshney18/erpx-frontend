"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PanelLeftClose, PanelLeft, ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

export interface SidebarItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  href?: string;
  active?: boolean;
  badge?: string | number;
  children?: SidebarItem[];
  onClick?: () => void;
}

export interface SidebarSection {
  id: string;
  label?: string;
  items: SidebarItem[];
}

interface SidebarProps {
  sections: SidebarSection[];
  className?: string;
  defaultCollapsed?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Sidebar({
  sections,
  className,
  defaultCollapsed = false,
  header,
  footer,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleCollapsed = useCallback(() => setCollapsed((prev) => !prev), []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 flex h-full flex-col border-r border-sidebar-border bg-sidebar",
        "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
        collapsed ? "w-[60px]" : "w-[240px]",
        className,
      )}
    >
      <div className="flex h-14 items-center justify-between px-3 border-b border-sidebar-border">
        {!collapsed && <div className="flex-1 truncate">{header}</div>}
        <button
          onClick={toggleCollapsed}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 no-scrollbar">
        {sections.map((section) => (
          <div key={section.id}>
            {!collapsed && section.label && (
              <p className="px-2 mb-1 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.id}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm",
                          "transition-appearance",
                          item.active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        )}
                      >
                        {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                        {!collapsed && (
                          <>
                            <span className="truncate flex-1 text-left">{item.label}</span>
                            <ChevronDown
                              className={cn(
                                "h-3.5 w-3.5 transition-transform duration-150",
                                expandedItems.has(item.id) && "rotate-180",
                              )}
                            />
                          </>
                        )}
                      </button>
                      <AnimatePresence>
                        {!collapsed && expandedItems.has(item.id) && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden pl-9 mt-0.5 space-y-0.5"
                          >
                            {item.children.map((child) => (
                              <li key={child.id}>
                                <button
                                  onClick={child.onClick}
                                  className={cn(
                                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                                    "transition-appearance",
                                    child.active
                                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                                  )}
                                >
                                  <span className="truncate">{child.label}</span>
                                  {child.badge && (
                                    <span className="ml-auto text-xs bg-sidebar-primary text-sidebar-primary-foreground rounded-full px-1.5 py-0.5">
                                      {child.badge}
                                    </span>
                                  )}
                                </button>
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <button
                      onClick={item.onClick}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm",
                        "transition-appearance",
                        item.active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      )}
                    >
                      {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                      {!collapsed && (
                        <>
                          <span className="truncate flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <span className="text-xs bg-sidebar-primary text-sidebar-primary-foreground rounded-full px-1.5 py-0.5">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {footer && <div className="border-t border-sidebar-border p-3">{footer}</div>}
    </aside>
  );
}
