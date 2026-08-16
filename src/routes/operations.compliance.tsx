import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { statusBadge } from "@/lib/crud/DataModule";
import { toast } from "sonner";
import {
  type LucideIcon,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Gauge,
  AlertTriangle,
  FileText,
  Lock,
  ShieldAlert,
  ScrollText,
  Inbox,
  Database,
  UserX,
  FileCheck2,
  Download,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  LockOpen,
} from "lucide-react";

export const Route = createFileRoute("/operations/compliance")({
  head: () => ({ meta: [{ title: "Compliance — Acme ERP" }] }),
  component: CompliancePage,
});

const RISK_CATEGORIES = [
  "Data Privacy",
  "Cybersecurity",
  "Operational",
  "Legal & Regulatory",
  "Financial",
  "Third Party",
  "IT Infrastructure",
  "HR & People",
];

const POLICY_TYPES = [
  "data_retention",
  "data_protection",
  "acceptable_use",
  "access_control",
  "password",
  "incident_response",
  "vendor_management",
  "backup",
];

const PRIVACY_REQUEST_TYPES = ["ACCESS", "RECTIFICATION", "ERASURE", "PORTABILITY", "CONSENT_WITHDRAWAL"];

const REVIEW_STATUSES = ["APPROVED", "REJECTED", "CANCELLED"];

const RETENTION_MODULES = ["invoices", "payments", "sales", "purchases", "inventory", "hrms", "crm", "audit_logs"];

const RETENTION_ACTIONS = ["delete", "archive", "anonymize"];

const LEGAL_HOLD_TARGET_TYPES = ["document", "record", "email", "file", "account", "data_object"];

const EXTRA_BADGES: Record<string, string> = {
  RELEASED: "bg-muted text-muted-foreground",
  released: "bg-muted text-muted-foreground",
  identified: "bg-warning/15 text-warning",
  mitigated: "bg-success/15 text-success",
  accepted: "bg-muted text-muted-foreground",
  reviewing: "bg-info/15 text-info",
  escalated: "bg-destructive/15 text-destructive",
};

function badgeCls(value: string | null | undefined) {
  if (!value) return "bg-muted text-muted-foreground";
  return statusBadge[String(value)] ?? EXTRA_BADGES[String(value)] ?? "bg-muted text-muted-foreground";
}

function StatusBadge({ value }: { value: string | null | undefined }) {
  if (value == null || value === "") return <span className="text-muted-foreground">&mdash;</span>;
  return (
    <Badge variant="secondary" className={badgeCls(value)}>
      {value}
    </Badge>
  );
}

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function fmtId(id: string | null | undefined) {
  if (!id) return "—";
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
}

function RiskScoreBadge({ score }: { score: number }) {
  let cls = "bg-success/15 text-success";
  if (score >= 80) cls = "bg-destructive/15 text-destructive";
  else if (score >= 50) cls = "bg-warning/15 text-warning";
  else if (score >= 20) cls = "bg-info/15 text-info";
  return (
    <Badge variant="secondary" className={cls}>
      {score ?? "—"}
    </Badge>
  );
}

function NewButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button size="sm" className="gradient-primary text-white" onClick={onClick}>
      <Plus className="mr-1.5 h-3.5 w-3.5" /> {label}
    </Button>
  );
}

function TabSection({
  title,
  description,
  action,
  loading,
  error,
  onRetry,
  empty,
  emptyTitle,
  emptyBody,
  emptyIcon: EmptyIcon,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  loading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  empty: boolean;
  emptyTitle: string;
  emptyBody: string;
  emptyIcon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="text-base font-semibold">Failed to load {title.toLowerCase()}</div>
            <p className="max-w-md text-sm text-muted-foreground">
              {(error as Error)?.message ?? "Unknown error"}
            </p>
            {onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            )}
          </div>
        ) : empty ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
              <EmptyIcon className="h-6 w-6" />
            </div>
            <div className="text-base font-semibold">{emptyTitle}</div>
            <p className="max-w-md text-sm text-muted-foreground">{emptyBody}</p>
            {action}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function CompliancePage() {
  const [tab, setTab] = useState("overview");

  const dashboard = useQuery({
    queryKey: ["compliance-dashboard"],
    queryFn: async () => {
      const res = await api.get<any>("/compliance/dashboard");
      return res ?? {};
    },
  });

  const kpis = useMemo(
    () => [
      {
        label: "Risk Score",
        value: dashboard.data?.riskScore,
        suffix: "/100",
        icon: Gauge,
        color: "bg-warning/15 text-warning",
      },
      {
        label: "Open Violations",
        value: dashboard.data?.policyViolations,
        icon: AlertTriangle,
        color: "bg-destructive/15 text-destructive",
      },
      {
        label: "Pending Privacy Requests",
        value: dashboard.data?.pendingRequests,
        icon: FileText,
        color: "bg-info/15 text-info",
      },
      {
        label: "Active Legal Holds",
        value: dashboard.data?.openLegalHolds,
        icon: Lock,
        color: "bg-primary/15 text-primary",
      },
    ],
    [dashboard.data],
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader title="Compliance" subtitle="Privacy, risk and data governance" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                {dashboard.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                      <p className="text-2xl font-bold">
                        {kpi.value == null
                          ? "—"
                          : Number(kpi.value).toLocaleString("en-IN")}
                        {kpi.suffix && kpi.value != null && (
                          <span className="text-sm font-medium text-muted-foreground"> {kpi.suffix}</span>
                        )}
                      </p>
                    </div>
                    <div className={`grid place-items-center rounded-xl p-2.5 ${kpi.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risks">Risk Assessments</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="privacy">Privacy Requests</TabsTrigger>
          <TabsTrigger value="retention">Data Retention</TabsTrigger>
          <TabsTrigger value="holds">Legal Holds</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <OverviewTab
            stats={dashboard.data}
            loading={dashboard.isLoading}
            error={dashboard.error}
            onRetry={() => {
              dashboard.refetch();
            }}
            onNavigate={setTab}
          />
        </TabsContent>

        <TabsContent value="risks" className="mt-4 space-y-4">
          <RiskAssessmentsTab />
        </TabsContent>

        <TabsContent value="policies" className="mt-4 space-y-4">
          <PoliciesTab />
        </TabsContent>

        <TabsContent value="privacy" className="mt-4 space-y-4">
          <PrivacyRequestsTab />
        </TabsContent>

        <TabsContent value="retention" className="mt-4 space-y-4">
          <RetentionTab />
        </TabsContent>

        <TabsContent value="holds" className="mt-4 space-y-4">
          <LegalHoldsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({
  stats,
  loading,
  error,
  onRetry,
  onNavigate,
}: {
  stats: any;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  onNavigate: (tab: string) => void;
}) {
  const secondary = [
    {
      label: "Expired Consents",
      value: stats?.expiredConsents,
      icon: UserX,
      color: "bg-destructive/15 text-destructive",
    },
    {
      label: "Active Retention Policies",
      value: stats?.retentionStats?.activePolicies,
      extra: `of ${stats?.retentionStats?.totalPolicies ?? 0}`,
      icon: Database,
      color: "bg-success/15 text-success",
    },
    {
      label: "Pending Exports",
      value: stats?.exportStats?.pending,
      icon: Download,
      color: "bg-warning/15 text-warning",
    },
    {
      label: "Completed Exports",
      value: stats?.exportStats?.completed,
      icon: FileCheck2,
      color: "bg-primary/15 text-primary",
    },
  ];

  const links = [
    { label: "Risk Assessments", desc: "Log and score compliance risks", tab: "risks", icon: ShieldAlert },
    { label: "Policies", desc: "Manage compliance policies", tab: "policies", icon: ScrollText },
    { label: "Privacy Requests", desc: "Handle data subject requests", tab: "privacy", icon: Inbox },
    { label: "Data Retention", desc: "Configure retention schedules", tab: "retention", icon: Database },
    { label: "Legal Holds", desc: "Place and release legal holds", tab: "holds", icon: Lock },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : error ? (
          <Card className="lg:col-span-4">
            <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold">Failed to load dashboard stats</div>
              <p className="text-sm text-muted-foreground">
                {(error as Error)?.message ?? "Unknown error"}
              </p>
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          secondary.map((k) => {
            const Icon = k.icon;
            return (
              <Card key={k.label}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
                      <p className="text-2xl font-bold">
                        {(k.value ?? 0).toLocaleString("en-IN")}
                        {k.extra && (
                          <span className="text-sm font-medium text-muted-foreground"> {k.extra}</span>
                        )}
                      </p>
                    </div>
                    <div className={`grid place-items-center rounded-xl p-2.5 ${k.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Links</CardTitle>
          <p className="text-sm text-muted-foreground">Jump straight to a compliance workspace.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((l) => {
              const Icon = l.icon;
              return (
                <button
                  key={l.tab}
                  onClick={() => onNavigate(l.tab)}
                  className="flex items-start gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-accent/50"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{l.label}</p>
                    <p className="text-xs text-muted-foreground">{l.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3">
            <p className="text-sm font-medium text-muted-foreground">Related:</p>
            <Link to="/admin/audit-log" className="text-sm text-primary hover:underline">
              Audit Log
            </Link>
            <Link to="/admin/api-keys" className="text-sm text-primary hover:underline">
              API Keys
            </Link>
            <Link to="/admin/users" className="text-sm text-primary hover:underline">
              Users
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function RiskAssessmentsTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(RISK_CATEGORIES[0]);
  const [likelihood, setLikelihood] = useState("3");
  const [impact, setImpact] = useState("3");

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ["compliance-risks"],
    queryFn: async () => {
      const res = await api.get<any>("/compliance/risk-assessments");
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
  });

  const create = useMutation({
    mutationFn: async () =>
      api.post("/compliance/risk-assessments", {
        name: name.trim(),
        category,
        likelihood: Number(likelihood),
        impact: Number(impact),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compliance-risks"] });
      qc.invalidateQueries({ queryKey: ["compliance-dashboard"] });
      toast.success("Risk assessment created");
      setOpen(false);
      setName("");
      setCategory(RISK_CATEGORIES[0]);
      setLikelihood("3");
      setImpact("3");
    },
    onError: (e: any) => toast.error(e.message ?? "Create failed"),
  });

  const openDialog = () => {
    setName("");
    setCategory(RISK_CATEGORIES[0]);
    setLikelihood("3");
    setImpact("3");
    setOpen(true);
  };

  const rows = (data as any[]).filter((r) => !r.deletedAt);

  return (
    <>
      <TabSection
        title="Risk Assessments"
        description="Log and score compliance risks across the organization"
        action={<NewButton onClick={openDialog} label="New Assessment" />}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        empty={rows.length === 0}
        emptyTitle="No risk assessments yet"
        emptyBody="Create your first risk assessment to start tracking compliance risk."
        emptyIcon={ShieldAlert}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Likelihood</TableHead>
              <TableHead className="text-center">Impact</TableHead>
              <TableHead className="text-center">Risk Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.category}</TableCell>
                <TableCell className="text-center">{r.likelihood}/10</TableCell>
                <TableCell className="text-center">{r.impact}/10</TableCell>
                <TableCell className="text-center">
                  <RiskScoreBadge score={r.riskScore} />
                </TableCell>
                <TableCell>
                  <StatusBadge value={r.status} />
                </TableCell>
                <TableCell title={r.ownerId ?? undefined} className="text-muted-foreground">
                  {fmtId(r.ownerId)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabSection>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Risk Assessment</DialogTitle>
            <DialogDescription>Assess likelihood and impact on a 1–10 scale.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                placeholder="e.g. Phishing susceptibility"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {RISK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Likelihood (1–10) *</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  value={likelihood}
                  onChange={(e) => setLikelihood(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Impact (1–10) *</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              disabled={!name.trim() || !category || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PoliciesTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [policyType, setPolicyType] = useState(POLICY_TYPES[0]);
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ["compliance-policies"],
    queryFn: async () => {
      const res = await api.get<any>("/compliance/policies");
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        return api.patch(`/compliance/policies/${editing.id}`, {
          name: name.trim(),
          description: description.trim() || null,
          isActive: active,
        });
      }
      return api.post("/compliance/policies", {
        name: name.trim(),
        slug: slug.trim(),
        policyType,
        description: description.trim() || undefined,
        scope: "organization",
        rules: {},
        isActive: active,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compliance-policies"] });
      qc.invalidateQueries({ queryKey: ["compliance-dashboard"] });
      toast.success(editing ? "Policy updated" : "Policy created");
      setOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const del = useMutation({
    mutationFn: async (p: any) => api.delete(`/compliance/policies/${p.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compliance-policies"] });
      qc.invalidateQueries({ queryKey: ["compliance-dashboard"] });
      toast.success("Policy deleted");
      setDeleting(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  const openCreate = () => {
    setEditing(null);
    setName("");
    setSlug("");
    setPolicyType(POLICY_TYPES[0]);
    setDescription("");
    setActive(true);
    setOpen(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setName(p.name);
    setSlug(p.slug);
    setPolicyType(p.policyType);
    setDescription(p.description ?? "");
    setActive(p.isActive);
    setOpen(true);
  };

  const rows = (data as any[]).filter((p) => !p.deletedAt);

  return (
    <>
      <TabSection
        title="Policies"
        description="Define and manage compliance policies"
        action={<NewButton onClick={openCreate} label="New Policy" />}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        empty={rows.length === 0}
        emptyTitle="No policies yet"
        emptyBody="Create a policy to codify how your organization stays compliant."
        emptyIcon={ScrollText}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Effective From</TableHead>
              <TableHead className="text-center">Version</TableHead>
              <TableHead className="w-20 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{p.policyType}</Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge value={p.isActive ? "ACTIVE" : "INACTIVE"} />
                </TableCell>
                <TableCell>{fmtDate(p.effectiveFrom)}</TableCell>
                <TableCell className="text-center">v{p.version}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(p)}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleting(p)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabSection>

      <Dialog open={open} onOpenChange={(o) => { if (!o) { setOpen(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Policy" : "New Policy"}</DialogTitle>
            <DialogDescription>Define or update a compliance policy.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                placeholder="e.g. GDPR Data Retention Policy"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Slug *</Label>
                <Input
                  placeholder="e.g. gdpr-data-retention"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={!!editing}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Policy Type *</Label>
                <Select value={policyType} onValueChange={setPolicyType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {POLICY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="What does this policy cover?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Enabled policies are enforced.</p>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setEditing(null); }}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              disabled={!name.trim() || !slug.trim() || !policyType || save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete policy?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate <strong>{deleting?.name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleting && del.mutate(deleting)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PrivacyRequestsTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [requestType, setRequestType] = useState(PRIVACY_REQUEST_TYPES[0]);
  const [description, setDescription] = useState("");
  const [reviewing, setReviewing] = useState<any | null>(null);
  const [reviewStatus, setReviewStatus] = useState("APPROVED");
  const [reviewNotes, setReviewNotes] = useState("");

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ["compliance-privacy"],
    queryFn: async () => {
      const res = await api.get<any>("/compliance/privacy-requests");
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
  });

  const create = useMutation({
    mutationFn: async () =>
      api.post("/compliance/privacy-requests", {
        requestType,
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compliance-privacy"] });
      qc.invalidateQueries({ queryKey: ["compliance-dashboard"] });
      toast.success("Privacy request created");
      setOpen(false);
      setRequestType(PRIVACY_REQUEST_TYPES[0]);
      setDescription("");
    },
    onError: (e: any) => toast.error(e.message ?? "Create failed"),
  });

  const review = useMutation({
    mutationFn: async () =>
      api.patch(`/compliance/privacy-requests/${reviewing.id}/review`, {
        status: reviewStatus,
        notes: reviewNotes.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compliance-privacy"] });
      qc.invalidateQueries({ queryKey: ["compliance-dashboard"] });
      toast.success("Privacy request reviewed");
      setReviewing(null);
      setReviewNotes("");
    },
    onError: (e: any) => toast.error(e.message ?? "Review failed"),
  });

  const openDialog = () => {
    setRequestType(PRIVACY_REQUEST_TYPES[0]);
    setDescription("");
    setOpen(true);
  };

  const openReview = (r: any) => {
    setReviewing(r);
    setReviewStatus("APPROVED");
    setReviewNotes("");
  };

  const rows = (data as any[]).filter((r) => !r.deletedAt);

  return (
    <>
      <TabSection
        title="Privacy Requests"
        description="Handle data subject requests under GDPR"
        action={<NewButton onClick={openDialog} label="New Request" />}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        empty={rows.length === 0}
        emptyTitle="No privacy requests yet"
        emptyBody="Create a request to start managing data subject workflows."
        emptyIcon={Inbox}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead className="w-24 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.requestType}</TableCell>
                <TableCell>
                  <StatusBadge value={r.status} />
                </TableCell>
                <TableCell>{fmtDate(r.createdAt)}</TableCell>
                <TableCell title={r.userId ?? undefined} className="text-muted-foreground">
                  {fmtId(r.userId)}
                </TableCell>
                <TableCell className="text-right">
                  {r.status === "PENDING" ? (
                    <Button size="sm" variant="outline" onClick={() => openReview(r)}>
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Review
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">&mdash;</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabSection>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Privacy Request</DialogTitle>
            <DialogDescription>Create a data subject request.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Request Type *</Label>
              <Select value={requestType} onValueChange={setRequestType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select request type" />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_REQUEST_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="What data is this request about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              disabled={!requestType || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reviewing} onOpenChange={(o) => { if (!o) { setReviewing(null); setReviewNotes(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Request — {reviewing?.requestType}</DialogTitle>
            <DialogDescription>Approve, reject or cancel this data subject request.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select value={reviewStatus} onValueChange={setReviewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REVIEW_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add a note about this decision"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReviewing(null); setReviewNotes(""); }}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              disabled={!reviewStatus || review.isPending}
              onClick={() => review.mutate()}
            >
              {review.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RetentionTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [module, setModule] = useState(RETENTION_MODULES[0]);
  const [retentionDays, setRetentionDays] = useState("365");
  const [action, setAction] = useState(RETENTION_ACTIONS[0]);

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ["compliance-retention"],
    queryFn: async () => {
      const res = await api.get<any>("/compliance/retention-policies");
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
  });

  const create = useMutation({
    mutationFn: async () =>
      api.post("/compliance/retention-policies", {
        name: name.trim(),
        slug: slug.trim(),
        module,
        retentionDays: Number(retentionDays),
        action,
        isActive: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compliance-retention"] });
      qc.invalidateQueries({ queryKey: ["compliance-dashboard"] });
      toast.success("Retention policy created");
      setOpen(false);
      setName("");
      setSlug("");
      setModule(RETENTION_MODULES[0]);
      setRetentionDays("365");
      setAction(RETENTION_ACTIONS[0]);
    },
    onError: (e: any) => toast.error(e.message ?? "Create failed"),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/compliance/retention-policies/${id}/toggle`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compliance-retention"] });
      qc.invalidateQueries({ queryKey: ["compliance-dashboard"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Toggle failed"),
  });

  const del = useMutation({
    mutationFn: async (p: any) => api.delete(`/compliance/retention-policies/${p.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compliance-retention"] });
      qc.invalidateQueries({ queryKey: ["compliance-dashboard"] });
      toast.success("Retention policy deleted");
      setDeleting(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  const openDialog = () => {
    setName("");
    setSlug("");
    setModule(RETENTION_MODULES[0]);
    setRetentionDays("365");
    setAction(RETENTION_ACTIONS[0]);
    setOpen(true);
  };

  const rows = (data as any[]).filter((p) => !p.deletedAt);

  return (
    <>
      <TabSection
        title="Data Retention"
        description="Configure how long different data modules are retained"
        action={<NewButton onClick={openDialog} label="New Policy" />}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        empty={rows.length === 0}
        emptyTitle="No retention policies yet"
        emptyBody="Create a retention policy to automate data lifecycle management."
        emptyIcon={Database}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Module</TableHead>
              <TableHead className="text-center">Retention Days</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-14 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{p.module}</Badge>
                </TableCell>
                <TableCell className="text-center">{p.retentionDays}</TableCell>
                <TableCell>{p.action}</TableCell>
                <TableCell>
                  <Switch
                    checked={p.isActive}
                    disabled={toggle.isPending && toggle.variables?.id === p.id}
                    onCheckedChange={(c) => toggle.mutate({ id: p.id, isActive: c })}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setDeleting(p)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabSection>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Retention Policy</DialogTitle>
            <DialogDescription>Define how long data is retained before an action is taken.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                placeholder="e.g. Invoice Records Retention"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug *</Label>
              <Input
                placeholder="e.g. invoice-retention"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Module *</Label>
                <Select value={module} onValueChange={setModule}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RETENTION_MODULES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Retention Days *</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Action *</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RETENTION_ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              disabled={!name.trim() || !slug.trim() || !module || !Number(retentionDays) || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete retention policy?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate <strong>{deleting?.name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleting && del.mutate(deleting)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function LegalHoldsTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [releasing, setReleasing] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetType, setTargetType] = useState(LEGAL_HOLD_TARGET_TYPES[0]);
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ["compliance-holds"],
    queryFn: async () => {
      const res = await api.get<any>("/compliance/legal-holds");
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
  });

  const create = useMutation({
    mutationFn: async () =>
      api.post("/compliance/legal-holds", {
        name: name.trim(),
        description: description.trim() || undefined,
        targetType,
        targetId: targetId.trim(),
        reason: reason.trim(),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compliance-holds"] });
      qc.invalidateQueries({ queryKey: ["compliance-dashboard"] });
      toast.success("Legal hold placed");
      setOpen(false);
      setName("");
      setDescription("");
      setTargetType(LEGAL_HOLD_TARGET_TYPES[0]);
      setTargetId("");
      setReason("");
      setExpiresAt("");
    },
    onError: (e: any) => toast.error(e.message ?? "Create failed"),
  });

  const release = useMutation({
    mutationFn: async () =>
      api.post(`/compliance/legal-holds/${releasing.id}/release`, {
        notes: releaseNotes.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compliance-holds"] });
      qc.invalidateQueries({ queryKey: ["compliance-dashboard"] });
      toast.success("Legal hold released");
      setReleasing(null);
      setReleaseNotes("");
    },
    onError: (e: any) => toast.error(e.message ?? "Release failed"),
  });

  const openDialog = () => {
    setName("");
    setDescription("");
    setTargetType(LEGAL_HOLD_TARGET_TYPES[0]);
    setTargetId("");
    setReason("");
    setExpiresAt("");
    setOpen(true);
  };

  const openRelease = (h: any) => {
    setReleasing(h);
    setReleaseNotes("");
  };

  const rows = (data as any[]).filter((h) => !h.deletedAt);

  return (
    <>
      <TabSection
        title="Legal Holds"
        description="Place and release holds on data that must be preserved"
        action={<NewButton onClick={openDialog} label="Place Hold" />}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        empty={rows.length === 0}
        emptyTitle="No legal holds yet"
        emptyBody="Place a legal hold to preserve data for litigation or investigation."
        emptyIcon={Lock}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Placed By</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-24 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((h: any) => (
              <TableRow key={h.id}>
                <TableCell className="font-medium">{h.name}</TableCell>
                <TableCell>
                  <span>{h.targetType}</span>
                  <span className="ml-1 text-xs text-muted-foreground">· {fmtId(h.targetId)}</span>
                </TableCell>
                <TableCell>
                  <StatusBadge value={h.status} />
                </TableCell>
                <TableCell title={h.placedBy ?? undefined} className="text-muted-foreground">
                  {fmtId(h.placedBy)}
                </TableCell>
                <TableCell>{fmtDate(h.expiresAt)}</TableCell>
                <TableCell className="text-right">
                  {h.status === "ACTIVE" ? (
                    <Button size="sm" variant="outline" onClick={() => openRelease(h)}>
                      <LockOpen className="mr-1.5 h-3.5 w-3.5" /> Release
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">&mdash;</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabSection>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Place Legal Hold</DialogTitle>
            <DialogDescription>Freeze data associated with a target for preservation.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                placeholder="e.g. Q3 Contract Dispute"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Target Type *</Label>
                <Select value={targetType} onValueChange={setTargetType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEGAL_HOLD_TARGET_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Target ID *</Label>
                <Input
                  placeholder="e.g. invoice-id"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason *</Label>
              <Textarea
                placeholder="Why is this hold being placed?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Additional context (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Expires</Label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              disabled={!name.trim() || !targetType || !targetId.trim() || !reason.trim() || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Place Hold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!releasing} onOpenChange={(o) => { if (!o) { setReleasing(null); setReleaseNotes(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Release Hold — {releasing?.name}</DialogTitle>
            <DialogDescription>The preserved data will be released for normal lifecycle processing.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add a note about this release"
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReleasing(null); setReleaseNotes(""); }}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              disabled={release.isPending}
              onClick={() => release.mutate()}
            >
              {release.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
