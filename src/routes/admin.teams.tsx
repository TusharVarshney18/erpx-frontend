import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Plus, MoreHorizontal, Pencil, Trash2, Users, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/teams")({
  head: () => ({ meta: [{ title: "Teams — Acme ERP" }] }),
  component: TeamsPage,
});

function TeamsPage() {
  const qc = useQueryClient();
  const { activeOrganizationId } = useAuth();
  const orgId = activeOrganizationId;

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [managing, setManaging] = useState<any | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const basePath = `/hrms/organizations/${orgId}/teams`;

  const { data: teams = [], isLoading, error } = useQuery({
    queryKey: ["teams", orgId],
    queryFn: async () => {
      const res = await api.get<any>(basePath, { params: { limit: "100" } });
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    enabled: !!orgId,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees", orgId],
    queryFn: async () => {
      const res = await api.get<any>(`/business-data/organizations/${orgId}/employees`);
      return res?.data ?? res ?? [];
    },
    enabled: !!orgId && !!managing,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return teams;
    const s = search.toLowerCase();
    return (teams as any[]).filter((t) =>
      String(t.name ?? "").toLowerCase().includes(s),
    );
  }, [teams, search]);

  const createTeam = useMutation({
    mutationFn: async () =>
      api.post(basePath, { name: name.trim(), description: description.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams", orgId] });
      toast.success("Team created");
      setShowCreate(false);
      setName("");
      setDescription("");
    },
    onError: (e: any) => toast.error(e.message ?? "Create failed"),
  });

  const updateTeam = useMutation({
    mutationFn: async () =>
      api.patch(`${basePath}/${editing.id}`, {
        name: name.trim(),
        description: description.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams", orgId] });
      toast.success("Team updated");
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  const deleteTeam = useMutation({
    mutationFn: async (team: any) => api.delete(`${basePath}/${team.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams", orgId] });
      toast.success("Team deleted");
      setDeleting(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  const saveMembers = useMutation({
    mutationFn: async () =>
      api.post(`${basePath}/${managing.id}/members`, { memberIds: selectedMembers }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams", orgId] });
      toast.success("Members updated");
      setManaging(null);
      setSelectedMembers([]);
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const removeMember = useMutation({
    mutationFn: async ({ teamId, employeeId }: { teamId: string; employeeId: string }) =>
      api.delete(`${basePath}/${teamId}/members/${employeeId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams", orgId] });
      toast.success("Member removed");
    },
    onError: (e: any) => toast.error(e.message ?? "Remove failed"),
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Teams"
        subtitle="Group employees into functional teams"
        actions={
          <Button
            size="sm"
            className="gradient-primary text-white"
            onClick={() => {
              setEditing(null);
              setName("");
              setDescription("");
              setShowCreate(true);
            }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Team
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            className="h-9 border-0 bg-muted/50 pl-9 pr-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch("")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
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
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <Users className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold">Failed to load teams</div>
              <p className="text-sm text-muted-foreground">{(error as Error)?.message ?? "Unknown error"}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Users className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold">No teams yet</div>
              <p className="max-w-md text-sm text-muted-foreground">
                Create your first team to group employees together.
              </p>
              <Button
                size="sm"
                className="gradient-primary text-white"
                onClick={() => {
                  setEditing(null);
                  setShowCreate(true);
                }}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> New Team
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Members</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((team: any) => {
                  const lead = team.members?.find((m: any) => m.employeeId === team.leadId)?.employee;
                  return (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell className="max-w-md truncate text-muted-foreground">
                        {team.description || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{team._count?.members ?? team.members?.length ?? 0}</Badge>
                      </TableCell>
                      <TableCell>
                        {lead ? `${lead.firstName} ${lead.lastName}` : "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setManaging(team);
                                setSelectedMembers(team.members?.map((m: any) => m.employeeId) ?? []);
                              }}
                            >
                              <Users className="mr-2 h-4 w-4" /> Manage Members
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(team);
                                setName(team.name);
                                setDescription(team.description ?? "");
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleting(team)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate || !!editing} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Team" : "New Team"}</DialogTitle>
            <DialogDescription>Create or update a functional team.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Team Name *</Label>
              <Input placeholder="e.g. Customer Success" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="What does this team do?" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditing(null); }}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              disabled={(!name.trim()) || (editing ? updateTeam.isPending : createTeam.isPending)}
              onClick={() => (editing ? updateTeam.mutate() : createTeam.mutate())}
            >
              {(editing ? updateTeam.isPending : createTeam.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!managing} onOpenChange={(o) => { if (!o) { setManaging(null); setSelectedMembers([]); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Members — {managing?.name}</DialogTitle>
            <DialogDescription>Select employees to include in this team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {employees.length === 0 && <p className="text-sm text-muted-foreground">No employees found.</p>}
            {employees.map((emp: any) => {
              const checked = selectedMembers.includes(emp.id);
              return (
                <label
                  key={emp.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent/50"
                >
                  <span className="font-medium">
                    {emp.firstName} {emp.lastName}
                    <span className="ml-2 text-xs text-muted-foreground">{emp.employeeCode}</span>
                  </span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={checked}
                    onChange={() =>
                      setSelectedMembers((prev) =>
                        checked ? prev.filter((id) => id !== emp.id) : [...prev, emp.id],
                      )
                    }
                  />
                </label>
              );
            })}
          </div>
          <DialogFooter className="gap-2">
            {managing?.members?.length > 0 && (
              <span className="mr-auto text-xs text-muted-foreground">
                {managing.members.length} current member(s)
              </span>
            )}
            <Button variant="outline" onClick={() => { setManaging(null); setSelectedMembers([]); }}>
              Cancel
            </Button>
            <Button className="gradient-primary text-white" disabled={saveMembers.isPending} onClick={() => saveMembers.mutate()}>
              {saveMembers.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Members
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete team?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate <strong>{deleting?.name}</strong>. Existing member links are preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleting && deleteTeam.mutate(deleting)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
