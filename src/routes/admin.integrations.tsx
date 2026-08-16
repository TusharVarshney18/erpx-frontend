import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageShell";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plug,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/integrations")({
  head: () => ({ meta: [{ title: "Integrations — Acme ERP" }] }),
  component: () => (
    <PremiumGate feature="integrations">
      <IntegrationsPage />
    </PremiumGate>
  ),
});

type Integration = {
  id: string;
  name: string;
  slug: string;
  providerType: string;
  description: string | null;
  iconUrl: string | null;
  isEnabled: boolean;
  isConnected: boolean;
  syncStatus: string;
  lastSyncAt: string | null;
  metadata: Record<string, unknown> | null;
  config: Record<string, unknown> | null;
  createdAt: string;
};

const PROVIDER_ICONS: Record<string, string> = {
  google: "G",
  slack: "S",
  shopify: "Sh",
  stripe: "St",
  quickbooks: "Q",
  zoho: "Z",
  salesforce: "Sa",
  hubspot: "H",
  mailchimp: "M",
  twilio: "T",
};

function IntegrationsPage() {
  const qc = useQueryClient();
  const { activeOrganizationId } = useAuth();
  const [search, setSearch] = useState("");
  const [connecting, setConnecting] = useState<Integration | null>(null);
  const [disconnecting, setDisconnecting] = useState<Integration | null>(null);
  const [apiKey, setApiKey] = useState("");

  const { data: integrations = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-integrations", activeOrganizationId],
    queryFn: () => api.get<Integration[]>("/integrations"),
    enabled: !!activeOrganizationId,
  });

  const connectIntegration = useMutation({
    mutationFn: async () => {
      if (!connecting) return;
      const payload: Record<string, unknown> = {};
      if (connecting.providerType === "API_KEY" && apiKey.trim()) {
        payload.apiKey = apiKey.trim();
      }
      return api.post(`/integrations/${connecting.id}/connect`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-integrations"] });
      toast.success("Integration connected");
      setConnecting(null);
      setApiKey("");
    },
    onError: (e: any) => toast.error(e.message ?? "Connection failed"),
  });

  const disconnectIntegration = useMutation({
    mutationFn: async (integration: Integration) => {
      return api.post(`/integrations/${integration.id}/disconnect`, {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-integrations"] });
      toast.success("Integration disconnected");
      setDisconnecting(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Disconnect failed"),
  });

  const filtered = search.trim()
    ? integrations.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.providerType.toLowerCase().includes(search.toLowerCase()) ||
          (i.description ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : integrations;

  const getIconLabel = (integration: Integration) => {
    const key = integration.slug.toLowerCase();
    for (const [k, v] of Object.entries(PROVIDER_ICONS)) {
      if (key.includes(k)) return v;
    }
    return integration.name.charAt(0).toUpperCase();
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Integrations"
        subtitle="Connect external services and platforms"
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search integrations…"
            className="h-9 border-0 bg-muted/50 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="font-semibold">Failed to load integrations</p>
          <p className="text-sm text-muted-foreground">
            Check your connection and try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Plug className="h-6 w-6" />
          </div>
          <p className="font-semibold">
            {search ? "No integrations match your search" : "No integrations available"}
          </p>
          <p className="text-sm text-muted-foreground">
            {search
              ? "Try a different search term."
              : "Integrations will appear here once configured in the backend."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((integration) => (
            <Card key={integration.id}>
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {getIconLabel(integration)}
                    </div>
                    <div>
                      <p className="font-semibold">{integration.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {integration.providerType.replace(/_/g, " ").toLowerCase()}
                      </p>
                    </div>
                  </div>
                  {integration.isConnected ? (
                    <Badge className="bg-success/15 text-success text-xs">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <XCircle className="mr-1 h-3 w-3" /> Disconnected
                    </Badge>
                  )}
                </div>

                {integration.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {integration.description}
                  </p>
                )}

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <div className="text-[11px] text-muted-foreground">
                    {integration.lastSyncAt ? (
                      <>Last sync: {new Date(integration.lastSyncAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</>
                    ) : (
                      "Not synced yet"
                    )}
                  </div>
                  <div className="flex gap-2">
                    {integration.isConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => setDisconnecting(integration)}
                      >
                        <XCircle className="mr-1 h-3.5 w-3.5" /> Disconnect
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="gradient-primary text-white"
                        onClick={() => setConnecting(integration)}
                      >
                        <ExternalLink className="mr-1 h-3.5 w-3.5" /> Connect
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!connecting}
        onOpenChange={(o) => {
          if (!o) {
            setConnecting(null);
            setApiKey("");
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Connect {connecting?.name}</DialogTitle>
            <DialogDescription>
              Provide the required credentials to connect this integration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>API Key / Token</Label>
              <Input
                placeholder="Enter your API key…"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnecting(null)}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              disabled={connectIntegration.isPending}
              onClick={() => connectIntegration.mutate()}
            >
              {connectIntegration.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!disconnecting}
        onOpenChange={(o) => {
          if (!o) setDisconnecting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {disconnecting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect the integration. You can reconnect it later
              by providing credentials again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() =>
                disconnecting && disconnectIntegration.mutate(disconnecting)
              }
            >
              {disconnectIntegration.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
