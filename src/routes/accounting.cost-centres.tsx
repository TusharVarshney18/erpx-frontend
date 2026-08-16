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
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Target, Plus, Loader2, Pencil, Trash2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/accounting/cost-centres")({
  head: () => ({ meta: [{ title: "Cost Centres — Acme ERP" }] }),
  component: CostCentresPage,
});

type CostCentre = { id: string; name: string; code: string; description: string | null; isActive: boolean; _count?: { journalLines: number } };

function CostCentresPage() {
  const qc = useQueryClient();
  const { activeOrganizationId } = useAuth();
  const access = useAccess();
  const canEdit = access.canAny(["chart_of_account:create", "chart_of_account:update", "chart_of_account:delete"]);
  const orgId = activeOrganizationId;

  const { data: items = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["cost-centres", orgId],
    queryFn: () => api.get<CostCentre[]>(`/accounting/organizations/${orgId}/cost-centres`),
    enabled: !!orgId,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CostCentre | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      const payload = { name: name.trim(), code: code.trim().toLowerCase().replace(/[^a-z0-9-_]/g, ""), description: description.trim() || undefined };
      if (editing) return api.patch(`/accounting/organizations/${orgId}/cost-centres/${editing.id}`, { name: payload.name, description: payload.description });
      return api.post(`/accounting/organizations/${orgId}/cost-centres`, payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cost-centres"] }); toast.success(editing ? "Updated" : "Created"); setOpen(false); setEditing(null); setName(""); setCode(""); setDescription(""); },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/accounting/organizations/${orgId}/cost-centres/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cost-centres"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Cost Centres"
        subtitle="Allocate expenses/income to departments or projects"
        actions={canEdit ? (
          <Button size="sm" className="gradient-primary text-white" onClick={() => { setEditing(null); setName(""); setCode(""); setDescription(""); setOpen(true); }}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Cost Centre
          </Button>
        ) : undefined}
      />

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry</Button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Postings</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground"><Target className="mx-auto mb-2 h-6 w-6" />No cost centres</TableCell></TableRow>
                ) : items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="font-mono text-xs">{c.code}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.description ?? "—"}</TableCell>
                    <TableCell className="text-center text-sm">{c._count?.journalLines ?? 0}</TableCell>
                    <TableCell>
                      {canEdit && (
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(c); setName(c.name); setCode(c.code); setDescription(c.description ?? ""); setOpen(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm(`Delete "${c.name}"?`)) remove.mutate(c.id); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Cost Centre" : "New Cost Centre"}</DialogTitle><DialogDescription>Cost centres split revenue/expense across departments or projects.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sales Department" /></div>
            <div className="space-y-1.5"><Label>Code *</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. sales-dept" disabled={!!editing} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="gradient-primary text-white" disabled={save.isPending || !name.trim() || !code.trim()} onClick={() => save.mutate()}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
