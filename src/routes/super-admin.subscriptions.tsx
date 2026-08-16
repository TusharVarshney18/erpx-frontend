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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  CreditCard,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  Pencil,
  Check,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/super-admin/subscriptions")({
  head: () => ({ meta: [{ title: "Subscriptions — Super Admin — Acme ERP" }] }),
  component: () => (
    <RequireSuperAdmin>
      <SuperAdminSubscriptions />
    </RequireSuperAdmin>
  ),
});

type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  billingInterval: string;
  features: { id: string; feature: { id: string; name: string; slug: string } }[];
  isActive: boolean;
  createdAt: string;
};

type Feature = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  group: string | null;
  createdAt: string;
};

const INTERVAL_OPTIONS = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function SuperAdminSubscriptions() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("plans");

  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanDescription, setNewPlanDescription] = useState("");
  const [newPlanPrice, setNewPlanPrice] = useState("");
  const [newPlanInterval, setNewPlanInterval] = useState("MONTHLY");

  const [editPlanName, setEditPlanName] = useState("");
  const [editPlanDescription, setEditPlanDescription] = useState("");
  const [editPlanPrice, setEditPlanPrice] = useState("");
  const [editPlanInterval, setEditPlanInterval] = useState("MONTHLY");

  const [showCreateFeature, setShowCreateFeature] = useState(false);
  const [newFeatureName, setNewFeatureName] = useState("");
  const [newFeatureDescription, setNewFeatureDescription] = useState("");

  const { data: plans = [], isLoading: plansLoading, isError: plansError, refetch: refetchPlans } = useQuery({
    queryKey: ["super-admin-plans"],
    queryFn: () => api.get<Plan[]>("/super-admin/plans"),
  });

  const { data: features = [], isLoading: featuresLoading, isError: featuresError, refetch: refetchFeatures } = useQuery({
    queryKey: ["super-admin-features"],
    queryFn: () => api.get<Feature[]>("/super-admin/features"),
  });

  const createPlan = useMutation({
    mutationFn: async () => {
      return api.post("/super-admin/plans", {
        name: newPlanName.trim(),
        slug: slugify(newPlanName),
        description: newPlanDescription.trim() || null,
        price: Number(newPlanPrice) || 0,
        billingInterval: newPlanInterval,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-plans"] });
      toast.success("Plan created");
      setShowCreatePlan(false);
      setNewPlanName("");
      setNewPlanDescription("");
      setNewPlanPrice("");
      setNewPlanInterval("MONTHLY");
    },
    onError: (e: any) => toast.error(e.message ?? "Create failed"),
  });

  const updatePlan = useMutation({
    mutationFn: async () => {
      if (!editingPlan) return;
      return api.patch(`/super-admin/plans/${editingPlan.id}`, {
        name: editPlanName.trim(),
        description: editPlanDescription.trim() || null,
        price: Number(editPlanPrice) || 0,
        billingInterval: editPlanInterval,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-plans"] });
      toast.success("Plan updated");
      setEditingPlan(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  const createFeature = useMutation({
    mutationFn: async () => {
      return api.post("/super-admin/features", {
        name: newFeatureName.trim(),
        slug: slugify(newFeatureName),
        description: newFeatureDescription.trim() || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-features"] });
      toast.success("Feature created");
      setShowCreateFeature(false);
      setNewFeatureName("");
      setNewFeatureDescription("");
    },
    onError: (e: any) => toast.error(e.message ?? "Create failed"),
  });

  const toggleFeature = useMutation({
    mutationFn: async ({ planId, featureId, enabled }: { planId: string; featureId: string; enabled: boolean }) => {
      if (enabled) {
        return api.post(`/super-admin/features/${featureId}/assign/${planId}`, { value: "true" });
      } else {
        return api.delete(`/super-admin/features/${featureId}/remove/${planId}`);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-plans"] });
      toast.success("Feature toggled");
    },
    onError: (e: any) => toast.error(e.message ?? "Toggle failed"),
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(price);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader title="Subscriptions" subtitle="Manage plans and feature flags" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="plans" className="gap-1.5">
            <CreditCard className="h-4 w-4" /> Plans
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-1.5">
            <Zap className="h-4 w-4" /> Features
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="gradient-primary text-white" onClick={() => setShowCreatePlan(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Plan
            </Button>
          </div>

          {plansLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : plansError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-semibold">Failed to load plans</p>
              <Button variant="outline" size="sm" onClick={() => refetchPlans()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">No plans yet</p>
              <p className="text-sm text-muted-foreground">Create your first subscription plan.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className={plan.isActive ? "" : "opacity-60"}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg capitalize">{plan.name}</CardTitle>
                        {plan.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{plan.description}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                        setEditingPlan(plan);
                        setEditPlanName(plan.name);
                        setEditPlanDescription(plan.description ?? "");
                        setEditPlanPrice(String(plan.price));
                        setEditPlanInterval(plan.billingInterval);
                      }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {formatPrice(plan.price)}
                      <span className="text-sm font-normal text-muted-foreground">/{plan.billingInterval.toLowerCase()}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {plan.features.map((f) => (
                        <Badge key={f.id} variant="secondary" className="text-[10px]">{f.feature.name}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {plans.length > 0 && features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Feature Toggles per Plan</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
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
                        <TableCell className="font-medium">{feat.name}</TableCell>
                        {plans.map((p) => {
                          const enabled = p.features.some((f) => f.feature.slug === feat.slug);
                          return (
                            <TableCell key={p.id} className="text-center">
                              <Switch
                                checked={enabled}
                                onCheckedChange={(v) =>
                                  toggleFeature.mutate({ planId: p.id, featureId: feat.id, enabled: v })
                                }
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

        <TabsContent value="features" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="gradient-primary text-white" onClick={() => setShowCreateFeature(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Feature
            </Button>
          </div>

          {featuresLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : featuresError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-semibold">Failed to load features</p>
              <Button variant="outline" size="sm" onClick={() => refetchFeatures()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : features.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Zap className="h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">No features yet</p>
              <p className="text-sm text-muted-foreground">Create features to toggle per plan.</p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {features.map((feat) => (
                      <TableRow key={feat.id}>
                        <TableCell className="font-medium">{feat.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{feat.slug}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{feat.description ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(feat.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCreatePlan} onOpenChange={(o) => { if (!o) { setShowCreatePlan(false); setNewPlanName(""); setNewPlanDescription(""); setNewPlanPrice(""); setNewPlanInterval("MONTHLY"); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Plan</DialogTitle>
            <DialogDescription>Define a new subscription plan.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Plan Name *</Label>
              <Input placeholder="e.g. Pro" value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="e.g. For growing businesses" value={newPlanDescription} onChange={(e) => setNewPlanDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price (₹) *</Label>
                <Input type="number" min={0} placeholder="0" value={newPlanPrice} onChange={(e) => setNewPlanPrice(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Interval *</Label>
                <Select value={newPlanInterval} onValueChange={setNewPlanInterval}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVAL_OPTIONS.map((i) => (
                      <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePlan(false)}>Cancel</Button>
            <Button className="gradient-primary text-white" disabled={createPlan.isPending || !newPlanName.trim()} onClick={() => createPlan.mutate()}>
              {createPlan.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPlan} onOpenChange={(o) => { if (!o) setEditingPlan(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>Update plan details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Plan Name *</Label>
              <Input value={editPlanName} onChange={(e) => setEditPlanName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={editPlanDescription} onChange={(e) => setEditPlanDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price (₹) *</Label>
                <Input type="number" min={0} value={editPlanPrice} onChange={(e) => setEditPlanPrice(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Interval *</Label>
                <Select value={editPlanInterval} onValueChange={setEditPlanInterval}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVAL_OPTIONS.map((i) => (
                      <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlan(null)}>Cancel</Button>
            <Button className="gradient-primary text-white" disabled={updatePlan.isPending} onClick={() => updatePlan.mutate()}>
              {updatePlan.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateFeature} onOpenChange={(o) => { if (!o) { setShowCreateFeature(false); setNewFeatureName(""); setNewFeatureDescription(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Feature</DialogTitle>
            <DialogDescription>Define a new feature flag.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Feature Name *</Label>
              <Input placeholder="e.g. AI Insights" value={newFeatureName} onChange={(e) => setNewFeatureName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="e.g. AI-powered analytics dashboard" value={newFeatureDescription} onChange={(e) => setNewFeatureDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFeature(false)}>Cancel</Button>
            <Button className="gradient-primary text-white" disabled={createFeature.isPending || !newFeatureName.trim()} onClick={() => createFeature.mutate()}>
              {createFeature.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
