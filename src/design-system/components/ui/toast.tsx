"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "../../../providers/theme-provider";

export function ToastProvider() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={resolvedTheme}
      position="bottom-right"
      toastOptions={{
        style: {
          background: "var(--popover)",
          color: "var(--popover-foreground)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-dropdown)",
        },
        className: "text-sm",
      }}
      richColors
      closeButton
    />
  );
}
