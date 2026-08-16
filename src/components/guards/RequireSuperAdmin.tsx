import { useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Loader2, ShieldAlert } from "lucide-react";

/**
 * Guards /super-admin/* routes. Super admin status is derived entirely from
 * the backend (/auth/me -> isSuperAdmin), which mirrors the SUPER_ADMIN_EMAILS
 * allowlist enforced by the backend SuperAdminGuard. There is no frontend-only
 * authorization here.
 */
export function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const { user, loading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (!isSuperAdmin) {
      navigate({ to: "/" });
    }
  }, [loading, user, isSuperAdmin, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold">Access denied</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You need platform Super Admin privileges to access this area.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
