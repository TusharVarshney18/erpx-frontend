import { useEffect, useState } from "react";
import { Laptop, Loader2, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth, type TrustedDevice } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Lists browsers trusted for 30-day 2FA skipping with per-device revoke. */
export function TrustedDevicesCard({ compact = false }: { compact?: boolean }) {
  const { trustedDevices, revokeTrustedDevice, revokeAllTrustedDevices } = useAuth();
  const [devices, setDevices] = useState<TrustedDevice[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const load = () => {
    trustedDevices()
      .then(setDevices)
      .catch(() => setDevices([]));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      await revokeTrustedDevice(id);
      setDevices((current) => current?.filter((device) => device.id !== id) ?? []);
      toast.success("Trusted device removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove device");
    } finally {
      setBusyId(null);
    }
  };

  const removeAll = async () => {
    setRevokingAll(true);
    try {
      await revokeAllTrustedDevices();
      setDevices([]);
      toast.success("All trusted devices removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove devices");
    } finally {
      setRevokingAll(false);
    }
  };

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Trusted devices</p>
          <p className="text-xs text-muted-foreground">
            These browsers can sign in without a 2FA code for 30 days.
          </p>
        </div>
        {devices && devices.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            disabled={revokingAll}
            onClick={removeAll}
          >
            {revokingAll ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
            )}
            Remove all
          </Button>
        )}
      </div>

      {devices === null ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : devices.length === 0 ? (
        <p className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
          No trusted devices.
        </p>
      ) : (
        <div className="space-y-2">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted">
                  <Laptop className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {device.label || "Trusted browser"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {device.ipAddress || "—"} · Last used {formatDate(device.lastUsedAt)} · Expires{" "}
                    {formatDate(device.expiresAt)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-destructive"
                disabled={busyId === device.id}
                onClick={() => remove(device.id)}
              >
                {busyId === device.id ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                )}
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
