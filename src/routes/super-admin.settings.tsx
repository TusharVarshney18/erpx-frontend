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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Settings,
  Search,
  Save,
  Loader2,
  AlertCircle,
  RefreshCw,
  Pencil,
  Plus,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/super-admin/settings")({
  head: () => ({ meta: [{ title: "System Settings — Super Admin — Acme ERP" }] }),
  component: () => (
    <RequireSuperAdmin>
      <SuperAdminSettings />
    </RequireSuperAdmin>
  ),
});

type SystemSetting = {
  id: string;
  key: string;
  value: string;
  description: string | null;
  category: string;
  isEncrypted: boolean;
  createdAt: string;
  updatedAt: string;
};

const valueType = (value: string): "boolean" | "number" | "string" => {
  if (value === "true" || value === "false") return "boolean";
  if (value.trim() !== "" && !Number.isNaN(Number(value))) return "number";
  return "string";
};

function SuperAdminSettings() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<SystemSetting | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newDescription, setNewDescription] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["super-admin-settings"],
    queryFn: () => api.get<Record<string, SystemSetting[]>>("/super-admin/settings"),
  });

  const settings = useMemo(
    () => Object.values(data ?? {}).flat(),
    [data],
  );

  const updateSetting = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      return api.put(`/super-admin/settings/${editing.key}`, {
        key: editing.key,
        value: editValue,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-settings"] });
      toast.success("Setting saved");
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  const createSetting = useMutation({
    mutationFn: async () => {
      return api.put(`/super-admin/settings/${newKey}`, {
        key: newKey,
        value: newValue,
        description: newDescription.trim() || null,
        category: newCategory.trim() || "general",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-settings"] });
      toast.success("Setting created");
      setShowCreate(false);
      setNewKey("");
      setNewValue("");
      setNewCategory("general");
      setNewDescription("");
    },
    onError: (e: any) => toast.error(e.message ?? "Create failed"),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return settings;
    const s = search.toLowerCase();
    return settings.filter(
      (st) =>
        st.key.toLowerCase().includes(s) ||
        (st.description ?? "").toLowerCase().includes(s) ||
        st.value.toLowerCase().includes(s),
    );
  }, [settings, search]);

  const handleEditOpen = (setting: SystemSetting) => {
    setEditing(setting);
    setEditValue(setting.value);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="System Settings"
        subtitle="Platform-wide configuration"
        actions={
          <Button size="sm" className="gradient-primary text-white" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Setting
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search settings…"
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
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-semibold">Failed to load settings</p>
              <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Settings className="h-6 w-6" />
              </div>
              <p className="font-semibold">
                {search ? "No settings match your search" : "No settings yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {search ? "Try a different search term." : "Add system-wide settings to configure the platform."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-mono text-sm font-medium">{setting.key}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{setting.value}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{setting.category}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {setting.description ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditOpen(setting)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Setting</DialogTitle>
            <DialogDescription>
              Update value for <strong className="font-mono">{editing?.key}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Value *</Label>
              {valueType(editing?.value ?? "") === "boolean" ? (
                <Switch
                  checked={editValue === "true"}
                  onCheckedChange={(v) => setEditValue(v ? "true" : "false")}
                />
              ) : valueType(editing?.value ?? "") === "number" ? (
                <Input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              ) : (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              )}
            </div>
            {editing?.description && (
              <p className="text-xs text-muted-foreground">{editing.description}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button className="gradient-primary text-white" disabled={updateSetting.isPending} onClick={() => updateSetting.mutate()}>
              {updateSetting.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-1.5 h-3.5 w-3.5" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) { setShowCreate(false); setNewKey(""); setNewValue(""); setNewCategory("general"); setNewDescription(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Setting</DialogTitle>
            <DialogDescription>Create a new system-wide setting.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Key *</Label>
              <Input
                placeholder="e.g. max_upload_size_mb"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
              />
              <p className="text-xs text-muted-foreground">Lowercase, underscore-separated.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Value *</Label>
              <Input placeholder="e.g. 50" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input
                placeholder="e.g. general"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                placeholder="e.g. Maximum file upload size in MB"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="gradient-primary text-white" disabled={createSetting.isPending || !newKey.trim() || !newValue.trim()} onClick={() => createSetting.mutate()}>
              {createSetting.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
