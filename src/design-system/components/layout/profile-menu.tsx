"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, LogOut, Moon, Sun, Key, HelpCircle } from "lucide-react";
import { cn } from "../../lib/cn";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { useTheme } from "../../../providers/theme-provider";

interface ProfileMenuProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
    initials?: string;
  };
  onNavigate: (path: string) => void;
  onLogout: () => void;
  className?: string;
}

export function ProfileMenu({ user, onNavigate, onLogout, className }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    {
      icon: User,
      label: "Profile",
      onClick: () => {
        onNavigate("/settings/profile");
        setOpen(false);
      },
    },
    {
      icon: Settings,
      label: "Settings",
      onClick: () => {
        onNavigate("/settings");
        setOpen(false);
      },
    },
    {
      icon: Key,
      label: "API Keys",
      onClick: () => {
        onNavigate("/settings/api-keys");
        setOpen(false);
      },
    },
    { type: "separator" as const },
    {
      icon: resolvedTheme === "dark" ? Sun : Moon,
      label: resolvedTheme === "dark" ? "Light Mode" : "Dark Mode",
      onClick: () => {
        toggleTheme();
        setOpen(false);
      },
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      onClick: () => {
        onNavigate("/help");
        setOpen(false);
      },
    },
    { type: "separator" as const },
    {
      icon: LogOut,
      label: "Sign Out",
      onClick: () => {
        onLogout();
        setOpen(false);
      },
      danger: true,
    },
  ];

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-accent transition-colors"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="User menu"
      >
        <Avatar className="h-7 w-7">
          {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {user.initials || user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-border bg-popover p-1.5 shadow-dropdown z-50"
          >
            <div className="px-2.5 py-2 border-b border-border mb-1">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>

            {menuItems.map((item, i) => {
              if ("type" in item && item.type === "separator") {
                return <div key={i} className="my-0.5 border-t border-border" />;
              }
              if ("icon" in item) {
                return (
                  <button
                    key={i}
                    onClick={item.onClick}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                      "danger" in item && item.danger
                        ? "text-destructive hover:bg-destructive/10"
                        : "text-foreground/80 hover:bg-accent",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              }
              return null;
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
