import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { RequireSuperAdmin } from "@/components/guards/RequireSuperAdmin";
import { PageHeader } from "@/components/layout/PageShell";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Ban,
  RefreshCw,
  Loader2,
  AlertCircle,
  Inbox,
  CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/super-admin/organizations")({
  head: () => ({ meta: [{ title: "Organizations — Super Admin — Acme ERP" }] }),
  component: () => (
    <RequireSuperAdmin>
      <SuperAdminOrganizations />
    </RequireSuperAdmin>
  ),
});

const PLAN_OPTIONS = [
  { value: "FREE", label: "Free" },
  { value: "STARTER", label: "Starter" },
  { value: "PRO", label: "Pro" },
  { value: "ENTERPRISE", label: "Enterprise" },
];

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  DISABLED: "Disabled",
};

type Organization = {
  id: string;
  name: string;
  code: string;
  slug: string;
  domain: string | null;
  plan: string;
  status: string;
  _count?: { users?: number };
  createdAt: string;
  updatedAt: string;
};

function SuperAdminOrganizations() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [suspending, setSuspending] = useState<Organization | null>(null);
  const [viewing, setViewing] = useState<Organization | null>(null);

  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newPlan, setNewPlan] = useState("FREE");
  const [editName, setEditName] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [editPlan, setEditPlan] = useState("FREE");

  const { data: orgs = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["super-admin-organizations"],
    queryFn: () => api.get<Organization[]>("/super-admin/organizations?limit=500"),
  });

  const createOrg = useMutation({
    mutationFn: async () => {
      return api.post("/super-admin/organizations", {
        name: newName.trim(),
        code: newCode.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""),
        plan: newPlan,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-organizations"] });
      toast.success("Organization created");
      setShowCreate(false);
      setNewName("");
      setNewCode("");
      setNewPlan("FREE");
    },
    onError: (e: any) => toast.error(e.message ?? "Create failed"),
  });

  const updateOrg = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      // Plan changes go through the dedicated endpoint so the subscription row,
      // org plan and roleVersion stay consistent (billing/feature gating).
      if (editPlan !== editing.plan) {
        await api.patch(`/super-admin/organizations/${editing.id}/plan`, { plan: editPlan });
      }
      return api.patch(`/super-admin/organizations/${editing.id}`, {
        name: editName.trim(),
        domain: editDomain.trim() || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-organizations"] });
      toast.success("Organization updated");
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  const revokeToFree = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      return api.patch(`/super-admin/organizations/${editing.id}/plan`, { plan: "FREE" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-organizations"] });
      toast.success("Subscription revoked — organization downgraded to Free");
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Revoke failed"),
  });

  const suspendOrg = useMutation({
    mutationFn: async (org: Organization) => {
      return api.patch(
        `/super-admin/organizations/${org.id}/${org.status === "SUSPENDED" ? "restore" : "suspend"}`,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-organizations"] });
      toast.success("Organization status updated");
      setSuspending(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Status update failed"),
  });

  const userCountOf = (org: Organization) => org._count?.users ?? null;

  const filtered = useMemo(() => {
    let list = orgs;
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((o) => o.name.toLowerCase().includes(s) || o.code.toLowerCase().includes(s));
    }
    if (planFilter !== "all") {
      list = list.filter((o) => o.plan === planFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((o) => o.status === statusFilter);
    }
    return list;
  }, [orgs, search, planFilter, statusFilter]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" });

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Organizations"
        subtitle="All organizations across the platform"
        actions={
          <Button size="sm" className="gradient-primary text-white" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Organization
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or code…"
            className="h-9 border-0 bg-muted/50 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            {PLAN_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="DISABLED">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-semibold">Failed to load organizations</p>
              <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Building2 className="h-6 w-6" />
              </div>
              <p className="font-semibold">
                {search || planFilter !== "all" || statusFilter !== "all"
                  ? "No organizations match your filters"
                  : "No organizations yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {search || planFilter !== "all" || statusFilter !== "all"
                  ? "Try different search terms or filters."
                  : "Organizations will appear here once they sign up."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{org.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{org.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize">{org.plan.toLowerCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={org.status === "ACTIVE" ? "default" : "secondary"}
                        className={
                          org.status === "ACTIVE"
                            ? "bg-success/15 text-success"
                            : org.status === "SUSPENDED"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-muted text-muted-foreground"
                        }
                      >
                        {STATUS_LABELS[org.status] ?? org.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{userCountOf(org) ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(org.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewing(org)}>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(org);
                              setEditName(org.name);
                              setEditDomain(org.domain ?? "");
                              setEditPlan(org.plan);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={org.status === "SUSPENDED" ? "text-emerald-500" : "text-destructive"}
                            onClick={() => setSuspending(org)}
                          >
                            {org.status === "SUSPENDED" ? (
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                            ) : (
                              <Ban className="mr-2 h-4 w-4" />
                            )}
                            {org.status === "SUSPENDED" ? "Restore" : "Suspend"}
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

      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) { setShowCreate(false); setNewName(""); setNewCode(""); setNewPlan("FREE"); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>Create a new organization on the platform.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Organization Name *</Label>
              <Input placeholder="e.g. Acme Corp" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Organization Code *</Label>
              <Input
                placeholder="e.g. acme-corp"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              />
              <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="gradient-primary text-white" disabled={createOrg.isPending || !newName.trim() || !newCode.trim()} onClick={() => createOrg.mutate()}>
              {createOrg.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>Update organization details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Organization Name *</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Domain</Label>
              <Input placeholder="e.g. acme.com" value={editDomain} onChange={(e) => setEditDomain(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={editPlan} onValueChange={setEditPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-wrap gap-2">
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
              disabled={revokeToFree.isPending || editing?.plan === "FREE"}
              onClick={() => {
                if (
                  window.confirm(
                    "Revoke this subscription and downgrade the organization to Free?",
                  )
                ) {
                  revokeToFree.mutate();
                }
              }}
            >
              {revokeToFree.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing?.plan === "FREE" ? "On Free plan" : "Revoke to Free"}
            </Button>
            <span className="ml-auto" />
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button className="gradient-primary text-white" disabled={updateOrg.isPending} onClick={() => updateOrg.mutate()}>
              {updateOrg.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) setViewing(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{viewing?.name}</DialogTitle>
            <DialogDescription>Organization details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Code</span><span>{viewing?.code}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Slug</span><span>{viewing?.slug}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Domain</span><span>{viewing?.domain ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="capitalize">{viewing?.plan}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span>{viewing?.status}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Users</span><span>{viewing ? userCountOf(viewing) ?? "—" : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{viewing ? formatDate(viewing.createdAt) : "—"}</span></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!suspending} onOpenChange={(o) => { if (!o) setSuspending(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{suspending?.status === "SUSPENDED" ? "Restore Organization?" : "Suspend Organization?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {suspending?.status === "SUSPENDED"
                ? `This will restore ${suspending?.name} and all its users will regain access.`
                : `This will suspend ${suspending?.name}. All users in this organization will lose access until restored.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={suspending?.status === "SUSPENDED" ? "bg-emerald-600" : "bg-destructive text-destructive-foreground"}
              onClick={() => suspending && suspendOrg.mutate(suspending)}
            >
              {suspendOrg.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {suspending?.status === "SUSPENDED" ? "Restore" : "Suspend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
