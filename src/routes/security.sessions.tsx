import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Laptop, Monitor, Smartphone, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/security/sessions")({
  head: () => ({ meta: [{ title: "Active Sessions — Acme ERP" }] }),
  component: ActiveSessionsPage,
});

type SessionInfo = {
  id: string;
  userId: string;
  organizationId: string;
  deviceName: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  expiresAt: string;
  createdAt: string;
  isCurrent?: boolean;
};

function detectDevice(ua: string): { browser: string; os: string; type: "mobile" | "tablet" | "desktop" | "unknown" } {
  let browser = "Unknown browser";
  let os = "Unknown OS";
  let type: "mobile" | "tablet" | "desktop" | "unknown" = "desktop";

  const b = ua;
  if (/edg/i.test(b) && !/edge\/|edg\//i.test(b)) browser = "Microsoft Edge";
  else if (/edg\//i.test(b) || /edge\//i.test(b)) browser = "Microsoft Edge";
  else if (/opr\/|opera/i.test(b)) browser = "Opera";
  else if (/chrome|crios/i.test(b)) browser = "Chrome";
  else if (/safari/i.test(b) && !/chrome|crios/i.test(b)) browser = "Safari";
  else if (/firefox|fxios/i.test(b)) browser = "Firefox";
  else if (/msie|trident/i.test(b)) browser = "Internet Explorer";

  if (/windows nt 10/i.test(b)) os = "Windows 10/11";
  else if (/windows nt 6\.3/i.test(b)) os = "Windows 8.1";
  else if (/windows nt 6\.1/i.test(b)) os = "Windows 7";
  else if (/android/i.test(b)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(b)) os = "iOS";
  else if (/mac os x|macintosh/i.test(b)) os = "macOS";
  else if (/linux/i.test(b)) os = "Linux";

  if (/ipad|tablet/i.test(b)) type = "tablet";
  else if (/mobile|iphone|android.*mobile/i.test(b)) type = "mobile";
  else if (/android/i.test(b)) type = "mobile";
  else type = "desktop";

  return { browser, os, type };
}

function DeviceLabel({ s }: { s: SessionInfo }) {
  const ua = s.userAgent || s.deviceName || "";
  if (ua) {
    const d = detectDevice(ua);
    return (
      <span className="inline-flex items-center gap-1.5">
        {d.type === "mobile" ? (
          <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        {d.browser} on {d.os}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <Laptop className="h-3.5 w-3.5 text-muted-foreground" />
      {s.deviceName || "Unknown device"}
    </span>
  );
}

function ActiveSessionsPage() {
  const qc = useQueryClient();

  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey: ["security-sessions"],
    queryFn: () => api.get<SessionInfo[]>("/security/sessions"),
  });

  const revokeSession = useMutation({
    mutationFn: async (id: string) => api.delete(`/security/sessions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["security-sessions"] });
      toast.success("Session revoked");
    },
    onError: (e: any) => toast.error(e.message ?? "Revoke failed"),
  });

  const revokeAllSessions = useMutation({
    mutationFn: async () => api.post("/security/sessions/logout-all"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["security-sessions"] });
      toast.success("All other sessions revoked");
    },
    onError: (e: any) => toast.error(e.message ?? "Revoke failed"),
  });

  const formatDate = (value: string) => new Date(value).toLocaleString();
  const currentCount = sessions.filter((s) => s.isCurrent).length;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Active Sessions"
        subtitle="Devices signed in to your account"
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={revokeAllSessions.isPending}
            onClick={() => revokeAllSessions.mutate()}
          >
            {revokeAllSessions.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
            )}
            Revoke all other sessions
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold">Failed to load sessions</div>
              <p className="text-sm text-muted-foreground">
                {(error as Error)?.message ?? "Unknown error"}
              </p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Laptop className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold">No active sessions</div>
              <p className="max-w-md text-sm text-muted-foreground">
                There are no active sessions for your account.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <DeviceLabel s={s} />
                        {s.isCurrent && (
                          <Badge className="text-[9px] bg-success/15 text-success">
                            Current session
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.ipAddress || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(s.lastActiveAt)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(s.expiresAt)}</TableCell>
                    <TableCell>
                      {s.isCurrent ? (
                        <span className="text-xs text-muted-foreground">This device</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          disabled={revokeSession.isPending}
                          onClick={() => revokeSession.mutate(s.id)}
                        >
                          <LogOut className="mr-1.5 h-3.5 w-3.5" /> Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {currentCount > 0 && (
        <p className="text-xs text-muted-foreground">
          Your current session can be managed from the device you're using now.
        </p>
      )}
    </div>
  );
}
