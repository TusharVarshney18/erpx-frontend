import type { ReactNode } from "react";
import { useAccess } from "@/hooks/useAccess";
import { useEntitlements } from "@/hooks/useEntitlements";
import { LockedModuleState } from "@/components/entitlements/LockedModuleState";
import type { EntitlementModule } from "@/lib/entitlements";

/**
 * Conditionally renders children only when the active plan includes a module.
 * While entitlements load it renders children optimistically (no lock flash).
 *
 *   <Gate module="hrms"><EmployeesPage /></Gate>
 *   <Gate module="payroll" fallback={<LockedAction />}>Run payroll</Gate>
 */
export function Gate({
  module,
  children,
  fallback,
  compact,
}: {
  module: EntitlementModule;
  children: ReactNode;
  fallback?: ReactNode;
  compact?: boolean;
}) {
  const { entitlements } = useEntitlements();
  const { hasModule } = useAccess();

  // hasModule() bypasses plan limits for Super Admins and organization admins.
  if (entitlements && !hasModule(module)) {
    return <>{fallback ?? <LockedModuleState module={module} compact={compact} />}</>;
  }
  return <>{children}</>;
}
