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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  Zap,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/super-admin/features")({
  head: () => ({ meta: [{ title: "Features — Super Admin — Acme ERP" }] }),
  component: () => (
    <RequireSuperAdmin>
      <SuperAdminFeatures />
    </RequireSuperAdmin>
  ),
});

type Feature = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  group: string;
  isActive: boolean;
  createdAt: string;
};

type Plan = {
  id: string;
  name: string;
  features: { id: string; feature: { id: string; slug: string } }[];
};

const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function SuperAdminFeatures() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("features");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Feature | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [group, setGroup] = useState("general");

  const { data: features = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["super-admin-features"],
    queryFn: () => api.get<Feature[]>("/super-admin/features"),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["super-admin-plans"],
    queryFn: () => api.get<Plan[]>("/super-admin/plans"),
  });

  const filtered = useMemo(
    () => features.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()) || f.slug.includes(search.toLowerCase())),
    [features, search],
  );

  const groups = useMemo(() => Array.from(new Set(features.map((f) => f.group || "general"))), [features]);

  const createFeature = useMutation({
    mutationFn: async () =>
      api.post("/super-admin/features", {
        name: name.trim(),
        slug: slugify(name),
        description: description.trim() || null,
        group: group,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-features"] });
      toast.success("Feature created");
      setShowCreate(false);
      setName("");
      setDescription("");
      setGroup("general");
    },
    onError: (e: any) => toast.error(e.message ?? "Create failed"),
  });

  const updateFeature = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      return api.patch(`/super-admin/features/${editing.id}`, {
        name: name.trim(),
        description: description.trim() || null,
        group,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-features"] });
      toast.success("Feature updated");
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  const deleteFeature = useMutation({
    mutationFn: (id: string) => api.delete(`/super-admin/features/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-features"] });
      toast.success("Feature deleted");
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  const toggleOnPlan = useMutation({
    mutationFn: async ({ planId, featureId, enabled }: { planId: string; featureId: string; enabled: boolean }) => {
      if (enabled) {
        return api.post(`/super-admin/features/${featureId}/assign/${planId}`, { value: "true" });
      }
      return api.delete(`/super-admin/features/${featureId}/remove/${planId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-plans"] });
      toast.success("Feature assignment updated");
    },
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader title="Features" subtitle="Platform feature flags and plan entitlements" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="features" className="gap-1.5"><Zap className="h-4 w-4" /> Features</TabsTrigger>
          <TabsTrigger value="entitlements" className="gap-1.5"><Plus className="h-4 w-4" /> Plan Entitlements</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-9 pl-9" placeholder="Search features…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button size="sm" className="gradient-primary text-white" onClick={() => { setEditing(null); setName(""); setDescription(""); setGroup("general"); setShowCreate(true); }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Feature
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-semibold">Failed to load features</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Zap className="h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">No features found</p>
              <p className="text-sm text-muted-foreground">Create features to control plan entitlements.</p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((feat) => (
                      <TableRow key={feat.id}>
                        <TableCell>
                          <div className="font-medium">{feat.name}</div>
                          <div className="text-xs text-muted-foreground">{feat.slug}</div>
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{feat.group || "general"}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={feat.isActive ? "default" : "secondary"} className="text-[10px]">
                            {feat.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(feat.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              setEditing(feat);
                              setName(feat.name);
                              setDescription(feat.description ?? "");
                              setGroup(feat.group || "general");
                            }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                              if (confirm(`Delete feature "${feat.name}"? This removes it from all plans.`)) deleteFeature.mutate(feat.id);
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="entitlements" className="mt-4 space-y-4">
          {features.length === 0 || plans.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Plus className="h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">No data to show</p>
              <p className="text-sm text-muted-foreground">Create features and plans first.</p>
            </div>
          ) : (
            <Card>
              <CardHeader><CardTitle className="text-base">Feature Entitlement Matrix</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      {plans.map((p) => (
                        <TableHead key={p.id} className="text-center capitalize">{p.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {features.map((feat) => (
                      <TableRow key={feat.id}>
                        <TableCell>
                          <div className="font-medium">{feat.name}</div>
                          <div className="text-xs text-muted-foreground">{feat.slug}</div>
                        </TableCell>
                        {plans.map((p) => {
                          const enabled = p.features.some((f) => f.feature.slug === feat.slug);
                          return (
                            <TableCell key={p.id} className="text-center">
                              <Switch
                                checked={enabled}
                                onCheckedChange={(v) => toggleOnPlan.mutate({ planId: p.id, featureId: feat.id, enabled: v })}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCreate || !!editing} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Feature" : "Create Feature"}</DialogTitle>
            <DialogDescription>{editing ? "Update feature details." : "Define a new platform feature."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input placeholder="e.g. AI Insights" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Group</Label>
              <Input placeholder="e.g. intelligence" value={group} onChange={(e) => setGroup(e.target.value)} list="feature-groups" />
              <datalist id="feature-groups">
                {groups.map((g) => <option key={g} value={g} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="e.g. AI-powered analytics dashboard" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditing(null); }}>Cancel</Button>
            <Button className="gradient-primary text-white" disabled={(createFeature.isPending || updateFeature.isPending) || !name.trim()} onClick={() => (editing ? updateFeature.mutate() : createFeature.mutate())}>
              {(createFeature.isPending || updateFeature.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
