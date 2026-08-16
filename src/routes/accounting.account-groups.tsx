import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useAccess } from "@/hooks/useAccess";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronRight, FolderOpen, Plus, Loader2, Pencil, Trash2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/accounting/account-groups")({
  head: () => ({ meta: [{ title: "Account Groups — Acme ERP" }] }),
  component: AccountGroupsPage,
});

type Group = {
  id: string;
  name: string;
  groupNature: string;
  normalBalance: string;
  description: string | null;
  parentGroupId: string | null;
  parentGroup?: { id: string; name: string } | null;
  isSystem: boolean;
  _count?: { accounts: number };
};

function AccountGroupsPage() {
  const qc = useQueryClient();
  const { activeOrganizationId } = useAuth();
  const access = useAccess();
  const canEdit = access.canAny(["chart_of_account:create", "chart_of_account:update", "chart_of_account:delete"]);
  const orgId = activeOrganizationId;

  const { data: groups = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["account-groups", orgId],
    queryFn: () => api.get<Group[]>(`/accounting/organizations/${orgId}/account-groups`),
    enabled: !!orgId,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [name, setName] = useState("");
  const [nature, setNature] = useState("ASSET");
  const [balance, setBalance] = useState("DEBIT");
  const [parentGroupId, setParentGroupId] = useState("none");
  const [description, setDescription] = useState("");

  const reset = () => {
    setName(""); setNature("ASSET"); setBalance("DEBIT"); setParentGroupId("none"); setDescription("");
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = { name: name.trim(), groupNature: nature, normalBalance: balance, description: description.trim() || undefined, parentGroupId: parentGroupId === "none" ? undefined : parentGroupId };
      if (editing) return api.patch(`/accounting/organizations/${orgId}/account-groups/${editing.id}`, payload);
      return api.post(`/accounting/organizations/${orgId}/account-groups`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["account-groups"] });
      toast.success(editing ? "Group updated" : "Group created");
      setShowCreate(false); setEditing(null); reset();
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/accounting/organizations/${orgId}/account-groups/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["account-groups"] }); toast.success("Group deleted"); },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  const byParent = (parentId: string | null) => groups.filter((g) => (g.parentGroupId ?? null) === parentId);
  const roots = groups.filter((g) => !g.parentGroupId);

  const renderNode = (g: Group, depth: number) => {
    const children = byParent(g.id);
    return (
      <div key={g.id}>
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/50" style={{ marginLeft: depth * 20 }}>
          <FolderOpen className="h-4 w-4 text-primary" />
          <span className="flex-1 text-sm font-medium">{g.name}</span>
          <Badge variant="secondary" className="text-[9px]">{g.groupNature}</Badge>
          <Badge variant={g.normalBalance === "DEBIT" ? "default" : "secondary"} className="text-[9px]">{g.normalBalance}</Badge>
          {g._count ? <span className="text-[10px] text-muted-foreground">{g._count.accounts} accts</span> : null}
          {canEdit && !g.isSystem && (
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditing(g); setName(g.name); setNature(g.groupNature); setBalance(g.normalBalance); setDescription(g.description ?? ""); setParentGroupId(g.parentGroupId ?? "none"); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => { if (confirm(`Delete group "${g.name}"?`)) remove.mutate(g.id); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          {children.length > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
        {children.map((c) => renderNode(c, depth + 1))}
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Account Groups"
        subtitle="Hierarchical grouping of ledgers (Sundry Debtors, Duties & Taxes, etc.)"
        actions={canEdit ? (
          <Button size="sm" className="gradient-primary text-white" onClick={() => { reset(); setEditing(null); setShowCreate(true); }}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Group
          </Button>
        ) : undefined}
      />

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry</Button>
        </div>
      ) : groups.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <FolderOpen className="h-8 w-8 text-muted-foreground" />
          <p className="font-semibold">No account groups yet</p>
          <p className="text-sm text-muted-foreground">Create groups like Sundry Debtors, Bank Accounts and Duties &amp; Taxes.</p>
        </CardContent></Card>
      ) : (
        <Card><CardContent className="p-4">{roots.map((g) => renderNode(g, 0))}</CardContent></Card>
      )}

      <Dialog open={showCreate || !!editing} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Group" : "New Account Group"}</DialogTitle>
            <DialogDescription>Groups classify ledgers under standard accounting heads.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sundry Debtors" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nature</Label>
                <Select value={nature} onValueChange={setNature}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Normal Balance</Label>
                <Select value={balance} onValueChange={setBalance}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="DEBIT">Debit</SelectItem><SelectItem value="CREDIT">Credit</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Parent Group</Label>
              <Select value={parentGroupId} onValueChange={setParentGroupId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top-level)</SelectItem>
                  {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditing(null); }}>Cancel</Button>
            <Button className="gradient-primary text-white" disabled={save.isPending || !name.trim()} onClick={() => save.mutate()}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
