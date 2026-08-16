"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "../../lib/cn";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  current?: boolean;
}

interface OrgSwitcherProps {
  organizations: Organization[];
  currentOrgId: string;
  onSwitch: (orgId: string) => void;
  onCreateOrg?: () => void;
  className?: string;
}

export function OrgSwitcher({
  organizations,
  currentOrgId,
  onSwitch,
  onCreateOrg,
  className,
}: OrgSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = organizations.find((o) => o.id === currentOrgId);

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
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-sidebar-accent transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Building2 className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
        <span className="truncate flex-1 text-left text-sidebar-foreground/80">
          {current?.name || "Select Organization"}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 top-full mt-1 rounded-xl border border-border bg-popover p-1.5 shadow-dropdown z-50 min-w-[200px]"
          >
            <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Organizations
            </p>
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  onSwitch(org.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  org.id === currentOrgId
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground/70 hover:bg-accent",
                )}
              >
                <Building2 className="h-4 w-4 shrink-0" />
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="truncate w-full text-left">{org.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">{org.plan}</span>
                </div>
                {org.id === currentOrgId && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            ))}
            {onCreateOrg && (
              <>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={() => {
                    onCreateOrg();
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-primary hover:bg-accent transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Organization</span>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
