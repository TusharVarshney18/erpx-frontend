import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { AICopilot } from "@/components/layout/AICopilot";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useAccess } from "@/hooks/useAccess";
import { getRouteAccess } from "@/lib/navigation-access";
import { Loader2, ShieldAlert, Lock } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md gradient-primary px-4 py-2 text-sm font-medium text-white shadow-glow"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. You can try again or head home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md gradient-primary px-4 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Acme ERP — Enterprise Suite" },
      {
        name: "description",
        content:
          "Modern, enterprise-grade ERP for accounting, sales, inventory, CRM, HR and analytics.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function OrgSwitchListener({ queryClient }: { queryClient: QueryClient }) {
  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries();
    };
    window.addEventListener("org-switch", handler);
    return () => window.removeEventListener("org-switch", handler);
  }, [queryClient]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider delayDuration={150}>
          <OrgSwitchListener queryClient={queryClient} />
          <AuthGate>
            <SidebarProvider>
              <div className="flex min-h-screen w-full bg-background">
                <AppSidebar />
                <SidebarInset className="min-w-0 flex-1">
                  <TopHeader />
                  <main className="min-w-0 flex-1 p-4 sm:p-6">
                    <Outlet />
                  </main>
                </SidebarInset>
              </div>
              <AICopilot />
            </SidebarProvider>
          </AuthGate>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const access = useAccess();
  const location = useLocation();
  const nav = useNavigate();
  const PUBLIC_AUTH_PATHS = ["/auth", "/verify-email", "/forgot-password", "/reset-password"];
  const isAuthRoute = PUBLIC_AUTH_PATHS.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    if (!loading && !user && !isAuthRoute) {
      nav({ to: "/auth" });
    }
  }, [loading, user, isAuthRoute, nav]);

  if (isAuthRoute) return <Outlet />;
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Route-level authorization: entering a URL directly must never render an
  // unauthorized page, and premium-locked routes show the lock screen.
  const routeAccess = getRouteAccess(location.pathname, access.context);
  if (!routeAccess.authorized) {
    return <RouteDenied />;
  }
  if (routeAccess.locked) {
    return <RouteLocked plan={access.plan} />;
  }

  return <>{children}</>;
}

function RouteDenied() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-semibold">403 · Access denied</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account doesn't have permission to access this page. Contact an administrator if you
          believe this is a mistake.
        </p>
      </div>
    </div>
  );
}

function RouteLocked({ plan }: { plan: string | null }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-semibold">Premium feature</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This feature is included in a paid plan. Your organization is on{" "}
          <span className="font-semibold">{(plan ?? "FREE").toUpperCase()}</span>.
        </p>
      </div>
    </div>
  );
}
