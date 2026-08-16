import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { statusBadge } from "@/lib/crud/DataModule";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  Workflow,
  AlertCircle,
  PlayCircle,
  Loader2,
  Power,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/operations/workflows")({
  head: () => ({ meta: [{ title: "Workflows — Acme ERP" }] }),
  component: WorkflowsPage,
});

const ACTION_TYPES = ["EMAIL", "WEBHOOK", "NOTIFICATION", "AUDIT", "AI_HOOK", "SMS"] as const;

const EXECUTION_BADGES: Record<string, string> = {
  SUCCESS: "bg-success/15 text-success",
  FAILED: "bg-destructive/15 text-destructive",
  PENDING: "bg-warning/15 text-warning",
};

type ActionRow = { key: number; type: string; order: number };

const emptyForm = { name: "", event: "", isActive: true, actions: [] as ActionRow[] };

let actionKeyCounter = 0;

function formatDate(v: string | null | undefined) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function formatDuration(exec: any) {
  if (!exec.completedAt) return "—";
  const ms = new Date(exec.completedAt).getTime() - new Date(exec.triggeredAt).getTime();
  if (isNaN(ms) || ms < 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

function WorkflowsPage() {
  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Workflows"
        subtitle="Automate business processes"
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            <Workflow className="h-4 w-4 text-primary" />
            Event-driven automation
          </div>
        }
      />

      <Tabs defaultValue="definitions">
        <TabsList>
          <TabsTrigger value="definitions" className="gap-1.5">
            <ListChecks className="h-4 w-4" /> Definitions
          </TabsTrigger>
          <TabsTrigger value="executions" className="gap-1.5">
            <PlayCircle className="h-4 w-4" /> Executions
          </TabsTrigger>
        </TabsList>
        <TabsContent value="definitions">
          <DefinitionsTab />
        </TabsContent>
        <TabsContent value="executions">
          <ExecutionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DefinitionsTab() {
  const qc = useQueryClient();
  const { activeOrganizationId } = useAuth();
  const orgId = activeOrganizationId;
  const basePath = `/workflows/organizations/${orgId}`;

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [form, setForm] = useState<{ name: string; event: string; isActive: boolean; actions: ActionRow[] }>(emptyForm);

  const {
    data: definitions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["workflow-definitions", orgId],
    queryFn: async () => {
      const res = await api.get<any>(basePath);
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    enabled: !!orgId,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["workflow-events", orgId],
    queryFn: async () => {
      const res = await api.get<any>(`${basePath}/events`);
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    enabled: !!orgId,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, actions: [] });
    setShowDialog(true);
  };

  const openEdit = (wf: any) => {
    setEditing(wf);
    setForm({
      name: wf.name ?? "",
      event: wf.event ?? "",
      isActive: wf.isActive ?? true,
      actions: (wf.actions ?? []).map((a: any) => ({
        key: actionKeyCounter++,
        type: a.type,
        order: a.order ?? 0,
      })),
    });
    setShowDialog(true);
  };

  const setField = (key: "name" | "event" | "isActive", value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addAction = () => {
    setForm((f) => {
      const nextOrder = f.actions.length === 0 ? 1 : Math.max(...f.actions.map((a) => a.order)) + 1;
      return { ...f, actions: [...f.actions, { key: actionKeyCounter++, type: ACTION_TYPES[0], order: nextOrder }] };
    });
  };

  const updateAction = (key: number, patch: Partial<ActionRow>) =>
    setForm((f) => ({
      ...f,
      actions: f.actions.map((a) => (a.key === key ? { ...a, ...patch } : a)),
    }));

  const removeAction = (key: number) =>
    setForm((f) => ({ ...f, actions: f.actions.filter((a) => a.key !== key) }));

  const saveWorkflow = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name.trim(),
        event: form.event,
        isActive: form.isActive,
      };
      if (editing) {
        return api.patch(`${basePath}/definitions/${editing.id}`, payload);
      }
      payload.actions = form.actions.map((a) => ({ type: a.type, config: {}, order: a.order }));
      return api.post(`${basePath}/definitions`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow-definitions", orgId] });
      qc.invalidateQueries({ queryKey: ["workflow-executions", orgId] });
      toast.success(editing ? "Workflow updated" : "Workflow created");
      setShowDialog(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const toggleWorkflow = useMutation({
    mutationFn: async (wf: any) => api.post(`${basePath}/definitions/${wf.id}/toggle`),
    onSuccess: (_d, wf) => {
      qc.invalidateQueries({ queryKey: ["workflow-definitions", orgId] });
      qc.invalidateQueries({ queryKey: ["workflow-executions", orgId] });
      toast.success(wf.isActive ? "Workflow deactivated" : "Workflow activated");
    },
    onError: (e: any) => toast.error(e.message ?? "Toggle failed"),
  });

  const deleteWorkflow = useMutation({
    mutationFn: async (wf: any) => api.delete(`${basePath}/definitions/${wf.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow-definitions", orgId] });
      qc.invalidateQueries({ queryKey: ["workflow-executions", orgId] });
      toast.success("Workflow deleted");
      setDeleting(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  const actionTypeName = (type: string) => {
    if (type === "AI_HOOK") return "AI Hook";
    return type.charAt(0) + type.slice(1).toLowerCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button size="sm" className="gradient-primary text-white" onClick={openCreate}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> New Workflow
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold">Failed to load workflows</div>
              <p className="max-w-md text-sm text-muted-foreground">
                {(error as Error)?.message ?? "Unknown error"}
              </p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : definitions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Workflow className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold">No workflows yet</div>
              <p className="max-w-md text-sm text-muted-foreground">
                Create your first workflow to automate actions when business events fire.
              </p>
              <Button size="sm" className="gradient-primary text-white" onClick={openCreate}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> New Workflow
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {definitions.map((wf: any) => (
                  <TableRow key={wf.id}>
                    <TableCell className="font-medium">{wf.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {wf.event}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-opacity",
                          statusBadge[wf.isActive ? "ACTIVE" : "INACTIVE"],
                          toggleWorkflow.isPending
                            ? "cursor-wait opacity-60"
                            : "cursor-pointer hover:opacity-80",
                        )}
                        disabled={toggleWorkflow.isPending}
                        onClick={() => toggleWorkflow.mutate(wf)}
                        title={wf.isActive ? "Click to deactivate" : "Click to activate"}
                      >
                        {wf.isActive ? (
                          <Power className="h-3 w-3" />
                        ) : (
                          <Power className="h-3 w-3 opacity-50" />
                        )}
                        {wf.isActive ? "Active" : "Inactive"}
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {wf.actions?.length ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(wf.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(wf)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleWorkflow.mutate(wf)}>
                            <Power className="mr-2 h-4 w-4" />
                            {wf.isActive ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(wf)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={(o) => { if (!o) { setShowDialog(false); setEditing(null); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Workflow" : "New Workflow"}</DialogTitle>
            <DialogDescription>Trigger automation when a business event fires.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                placeholder="e.g. Notify sales on invoice paid"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Event *</Label>
              <Select value={form.event} onValueChange={(v) => setField("event", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a business event" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {events.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No events available</div>
                  )}
                  {events.map((ev: string) => (
                    <SelectItem key={ev} value={ev}>
                      {ev}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Actions</Label>
              {form.actions.length === 0 && (
                <p className="text-sm text-muted-foreground">No actions yet. Add one below.</p>
              )}
              {form.actions.map((a) => (
                <div key={a.key} className="flex items-center gap-2">
                  <Select value={a.type} onValueChange={(v) => updateAction(a.key, { type: v })}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {actionTypeName(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    className="w-24"
                    placeholder="Order"
                    value={a.order}
                    onChange={(e) => updateAction(a.key, { order: Number(e.target.value) })}
                  />
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeAction(a.key)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addAction}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Action
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div className="space-y-0.5">
                <Label className="text-sm">Active</Label>
                <p className="text-xs text-muted-foreground">Runs when the event fires</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setField("isActive", v)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditing(null); }}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              disabled={!form.name.trim() || !form.event || saveWorkflow.isPending}
              onClick={() => saveWorkflow.mutate()}
            >
              {saveWorkflow.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleting?.name}</strong> and its execution history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleting && deleteWorkflow.mutate(deleting)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ExecutionsTab() {
  const { activeOrganizationId } = useAuth();
  const orgId = activeOrganizationId;
  const basePath = `/workflows/organizations/${orgId}`;

  const [workflowFilter, setWorkflowFilter] = useState("");

  const { data: definitions = [] } = useQuery({
    queryKey: ["workflow-definitions", orgId],
    queryFn: async () => {
      const res = await api.get<any>(basePath);
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    enabled: !!orgId,
  });

  const {
    data: executions = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["workflow-executions", orgId, workflowFilter],
    queryFn: async () => {
      const params: Record<string, string> = { page: "1", limit: "50" };
      if (workflowFilter) params.workflowId = workflowFilter;
      const res = await api.get<any>(`${basePath}/executions`, { params });
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    enabled: !!orgId,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <div className="min-w-[200px] flex-1 sm:max-w-xs">
          <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All workflows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All workflows</SelectItem>
              {definitions.map((wf: any) => (
                <SelectItem key={wf.id} value={wf.id}>
                  {wf.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold">Failed to load executions</div>
              <p className="max-w-md text-sm text-muted-foreground">
                {(error as Error)?.message ?? "Unknown error"}
              </p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : executions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <PlayCircle className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold">No executions yet</div>
              <p className="max-w-md text-sm text-muted-foreground">
                Execution logs will appear here whenever a workflow is triggered by a business event.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started At</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((ex: any) => (
                  <TableRow key={ex.id}>
                    <TableCell className="font-medium">
                      {ex.workflowDefinition?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {ex.event}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={EXECUTION_BADGES[ex.status] ?? "bg-muted text-muted-foreground"}
                      >
                        {ex.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(ex.triggeredAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDuration(ex)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
