"use client";

import { type ReactNode } from "react";
import { cn } from "../../lib/cn";

interface MainLayoutProps {
  sidebar: ReactNode;
  topNav: ReactNode;
  children: ReactNode;
  className?: string;
}

export function MainLayout({ sidebar, topNav, children, className }: MainLayoutProps) {
  return (
    <div className="relative flex min-h-screen">
      {sidebar}
      <div className="flex flex-1 flex-col ml-[240px] transition-all duration-200">
        {topNav}
        <main className={cn("flex-1 p-6", className)}>{children}</main>
      </div>
    </div>
  );
}
