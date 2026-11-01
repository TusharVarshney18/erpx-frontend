import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { selfServiceApi } from "@/lib/api/self-service";

export function useActiveOrgId(): string | null {
  const { user, activeOrganizationId } = useAuth();
  return activeOrganizationId || user?.organization?.id || null;
}

/** The signed-in user's employee record (null when the account is not linked). */
export function useMyEmployee() {
  const orgId = useActiveOrgId();
  const query = useQuery({
    queryKey: ["self", "employee", orgId],
    enabled: !!orgId,
    staleTime: 5 * 60_000,
    queryFn: () => selfServiceApi.employee(orgId!),
  });
  return { orgId, employee: query.data ?? null, isLoading: query.isLoading, error: query.error };
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function workedMinutes(
  record: { checkIn: string | null; checkOut: string | null },
  now = Date.now(),
): number {
  if (!record.checkIn) return 0;
  const start = new Date(record.checkIn).getTime();
  const end = record.checkOut ? new Date(record.checkOut).getTime() : now;
  return Math.max(0, Math.round((end - start) / 60000));
}
