import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageShell";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  KeyRound,
  Plus,
  Search,
  Copy,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/api-keys")({
  head: () => ({ meta: [{ title: "API Keys — Acme ERP" }] }),
  component: () => (
    <PremiumGate feature="apiKeys">
      <ApiKeysPage />
    </PremiumGate>
  ),
});

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  status: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  usageCount: number;
  createdAt: string;
};

type CreatedApiKey = ApiKey & {
  rawKey?: string;
};

function ApiKeysPage() {
  const qc = useQueryClient();
  const { activeOrganizationId } = useAuth();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState("read");
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: apiKeys = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-api-keys", activeOrganizationId],
    queryFn: () => api.get<ApiKey[]>("/security/api-keys"),
    enabled: !!activeOrganizationId,
  });

  const createKey = useMutation({
    mutationFn: async () => {
      return api.post<CreatedApiKey>("/security/api-keys", {
        name: newKeyName.trim(),
        scopes: newKeyScopes.split(",").map((s) => s.trim()).filter(Boolean),
      });
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-api-keys"] });
      setCreatedKey(data);
      setShowCreate(false);
      setNewKeyName("");
      setNewKeyScopes("read");
      toast.success("API key created");
    },
    onError: (e: any) => toast.error(e.message ?? "Create failed"),
  });

  const revokeKey = useMutation({
    mutationFn: async (key: ApiKey) => {
      return api.delete(`/security/api-keys/${key.id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-api-keys"] });
      toast.success("API key revoked");
      setRevoking(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Revoke failed"),
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return apiKeys;
    const s = search.toLowerCase();
    return apiKeys.filter(
      (k) =>
        k.name.toLowerCase().includes(s) ||
        k.keyPrefix.toLowerCase().includes(s),
    );
  }, [apiKeys, search]);

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—";

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="API Keys"
        subtitle="Manage API keys for programmatic access"
        actions={
          <Button
            size="sm"
            className="gradient-primary text-white"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Create API Key
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search API keys…"
            className="h-9 border-0 bg-muted/50 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-semibold">Failed to load API keys</p>
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
                <KeyRound className="h-6 w-6" />
              </div>
              <p className="font-semibold">
                {search ? "No API keys match your search" : "No API keys yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Try a different search term."
                  : "Create an API key to integrate with external services."}
              </p>
              {!search && (
                <Button
                  size="sm"
                  className="gradient-primary text-white"
                  onClick={() => setShowCreate(true)}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Create API Key
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                          {key.keyPrefix}...
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(key.keyPrefix)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(key.scopes) ? key.scopes : []).map(
                          (scope) => (
                            <Badge
                              key={scope}
                              variant="outline"
                              className="text-[10px] font-normal"
                            >
                              {scope}
                            </Badge>
                          ),
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {key.status === "ACTIVE" ? (
                        <Badge className="bg-success/15 text-success">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="mr-1 h-3 w-3" /> Revoked
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(key.lastUsedAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {key.usageCount}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setRevoking(key)}
                        disabled={key.status !== "ACTIVE"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showCreate}
        onOpenChange={(o) => {
          if (!o) {
            setShowCreate(false);
            setNewKeyName("");
            setNewKeyScopes("read");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for programmatic access.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Key Name *</Label>
              <Input
                placeholder="e.g. Production Integration"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Scopes (comma-separated)</Label>
              <Input
                placeholder="e.g. read, write, admin"
                value={newKeyScopes}
                onChange={(e) => setNewKeyScopes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Available scopes: read, write, admin
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              disabled={createKey.isPending || !newKeyName.trim()}
              onClick={() => createKey.mutate()}
            >
              {createKey.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!createdKey}
        onOpenChange={(o) => {
          if (!o) setCreatedKey(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Copy this key now. You will not be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <code className="break-all text-sm font-mono">
                  {createdKey?.rawKey ?? `${createdKey?.keyPrefix}...`}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() =>
                    copyToClipboard(createdKey?.rawKey ?? createdKey?.keyPrefix ?? "")
                  }
                >
                  {copied ? (
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-success" />
                  ) : (
                    <Copy className="mr-1 h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedKey(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!revoking}
        onOpenChange={(o) => {
          if (!o) setRevoking(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently revoke{" "}
              <strong>{revoking?.name}</strong>. Any services using this key
              will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => revoking && revokeKey.mutate(revoking)}
            >
              {revokeKey.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
