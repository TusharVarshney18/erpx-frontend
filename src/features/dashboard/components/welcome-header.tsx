"use client";

import { Sparkles, Command, Bell, Moon, Sun } from "lucide-react";
import { Button } from "@/design-system";
import { SearchInput } from "@/design-system";
import { Avatar, AvatarFallback } from "@/design-system";
import { useState, useEffect } from "react";

interface WelcomeHeaderProps {
  userName: string;
  organization: string;
  notificationCount: number;
  onSearch?: (query: string) => void;
  onCommandPalette?: () => void;
  onAIAssistant?: () => void;
  onNotifications?: () => void;
}

export function WelcomeHeader({
  userName,
  organization,
  notificationCount,
  onSearch,
  onCommandPalette,
  onAIAssistant,
  onNotifications,
}: WelcomeHeaderProps) {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);
  const resolvedTheme = dark ? "dark" : "light";
  const toggleTheme = () => setDark(!dark);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1">
            {greeting}, {userName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {organization} &middot;{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="premium" size="sm" onClick={onAIAssistant}>
            <Sparkles className="h-4 w-4" />
            AI Assistant
          </Button>
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={onNotifications}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors"
            aria-label={`Notifications (${notificationCount})`}
          >
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground">
                {notificationCount}
              </span>
            )}
          </button>
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-md">
          <div onClick={onCommandPalette} className="cursor-pointer">
            <SearchInput placeholder="Search anything..." readOnly />
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onCommandPalette} className="hidden sm:flex">
          <Command className="h-4 w-4" />
          <span className="text-xs text-muted-foreground ml-1">⌘K</span>
        </Button>
      </div>
    </div>
  );
}
