import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { statusBadge } from "@/lib/crud/DataModule";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Wallet,
  Plus,
  Eye,
  PlayCircle,
  CheckCircle2,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Banknote,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/hrms/payroll")({
  head: () => ({ meta: [{ title: "Payroll — Acme ERP" }] }),
  component: PayrollPage,
});

type Employee = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string | null;
};

type SalaryStructure = {
  id: string;
  employeeId: string;
  basicPay: number | string;
  hra: number | string;
  specialAllowance: number | string;
  conveyance: number | string;
  otherEarnings: number | string;
  providentFund: number | string;
  esi: number | string;
  professionalTax: number | string;
  otherDeductions: number | string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  employee: Employee;
};

type PayrollRunItem = {
  id: string;
  employeeId: string;
  grossPay: number | string;
  totalDeductions: number | string;
  netPay: number | string;
  earnings: Record<string, number | string> | null;
  deductions: Record<string, number | string> | null;
  status: string;
  employee: Employee;
};

type PayrollRun = {
  id: string;
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  status: "DRAFT" | "PROCESSED" | "PAID" | "CANCELLED";
  totalGross: number | string;
  totalDeductions: number | string;
  totalNet: number | string;
  processedBy: string | null;
  processedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { items: number };
  items?: PayrollRunItem[];
};

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const fmtMoney = (v: number | string | undefined | null) =>
  money.format(Number(v ?? 0));

const fmtDate = (v: string) => (v ? format(parseISO(v), "dd MMM yyyy") : "—");

const fmtPeriod = (v: string) => (v ? format(parseISO(v), "MMM yyyy") : "—");

const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

function statusClass(status: string) {
  return statusBadge[status] ?? "bg-muted text-muted-foreground";
}

function StatusCell({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={statusClass(status)}>
      {status}
    </Badge>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <p className="font-semibold">Failed to load {message}</p>
      <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
      </Button>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
        {icon}
      </div>
      <p className="font-semibold">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{subtitle}</p>
      {action}
    </div>
  );
}

function employeeName(e: Employee) {
  return `${e.firstName} ${e.lastName}`.trim();
}

function PayrollPage() {
  const { activeOrganizationId } = useAuth();
  const orgId = activeOrganizationId;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Payroll"
        subtitle="Salary structures and payroll run processing"
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4 text-primary" />
            Monthly compensation processing
          </div>
        }
      />

      <Tabs defaultValue="runs">
        <TabsList>
          <TabsTrigger value="runs">Payroll Runs</TabsTrigger>
          <TabsTrigger value="structures">Salary Structures</TabsTrigger>
        </TabsList>
        <TabsContent value="runs">
          <RunsTab orgId={orgId} />
        </TabsContent>
        <TabsContent value="structures">
          <StructuresTab orgId={orgId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RunsTab({ orgId }: { orgId: string | null }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<PayrollRun | null>(null);
  const [periodStart, setPeriodStart] = useState(monthStart);
  const [periodEnd, setPeriodEnd] = useState(monthEnd);

  const {
    data: runs = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["payroll-runs", orgId],
    queryFn: () =>
      api.get<PayrollRun[]>(`/payroll/organizations/${orgId}/runs?limit=100`),
    enabled: !!orgId,
  });

  const createRun = useMutation({
    mutationFn: async () => {
      return api.post(`/payroll/organizations/${orgId}/runs`, {
        periodStart,
        periodEnd,
        notes: null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-runs", orgId] });
      toast.success("Payroll run created");
      setShowCreate(false);
      setPeriodStart(monthStart);
      setPeriodEnd(monthEnd);
    },
    onError: (e: any) => toast.error(e.message ?? "Create failed"),
  });

  const processRun = useMutation({
    mutationFn: (run: PayrollRun) =>
      api.post(`/payroll/organizations/${orgId}/runs/${run.id}/process`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-runs", orgId] });
      toast.success("Payroll run processed");
    },
    onError: (e: any) => toast.error(e.message ?? "Processing failed"),
  });

  const markPaid = useMutation({
    mutationFn: (run: PayrollRun) =>
      api.post(`/payroll/organizations/${orgId}/runs/${run.id}/mark-paid`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-runs", orgId] });
      toast.success("Payroll run marked as paid");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to mark paid"),
  });

  const deleteRun = useMutation({
    mutationFn: (run: PayrollRun) =>
      api.delete(`/payroll/organizations/${orgId}/runs/${run.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-runs", orgId] });
      toast.success("Payroll run deleted");
      setDeleting(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  const actionsFor = (run: PayrollRun) => {
    const actions = [];
    actions.push(
      <Button
        key="view"
        variant="ghost"
        size="sm"
        className="h-8"
        onClick={() => setViewId(run.id)}
      >
        <Eye className="mr-1 h-3.5 w-3.5" /> View
      </Button>,
    );
    if (run.status === "DRAFT") {
      actions.push(
        <Button
          key="process"
          variant="ghost"
          size="sm"
          className="h-8"
          disabled={processRun.isPending}
          onClick={() => processRun.mutate(run)}
        >
          <PlayCircle className="mr-1 h-3.5 w-3.5" /> Process
        </Button>,
        <Button
          key="delete"
          variant="ghost"
          size="sm"
          className="h-8 text-destructive"
          onClick={() => setDeleting(run)}
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
        </Button>,
      );
    }
    if (run.status === "PROCESSED") {
      actions.push(
        <Button
          key="paid"
          variant="ghost"
          size="sm"
          className="h-8"
          disabled={markPaid.isPending}
          onClick={() => markPaid.mutate(run)}
        >
          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark Paid
        </Button>,
      );
    }
    return actions;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Create a run for a pay period, then process it to compute salaries.
        </p>
        <Button
          size="sm"
          className="gradient-primary text-white"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Run
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingRows />
          ) : isError ? (
            <ErrorState message="payroll runs" onRetry={() => refetch()} />
          ) : runs.length === 0 ? (
            <EmptyState
              icon={<Banknote className="h-6 w-6" />}
              title="No payroll runs yet"
              subtitle="Create your first payroll run for a pay period to start processing salaries."
              action={
                <Button
                  size="sm"
                  className="gradient-primary text-white"
                  onClick={() => setShowCreate(true)}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Run
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Gross</TableHead>
                  <TableHead className="text-right">Total Deductions</TableHead>
                  <TableHead className="text-right">Total Net</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="w-72" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <div className="font-medium">{fmtPeriod(run.periodStart)}</div>
                      <div className="text-xs text-muted-foreground">
                        {fmtDate(run.periodStart)} → {fmtDate(run.periodEnd)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusCell status={run.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtMoney(run.totalGross)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtMoney(run.totalDeductions)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {fmtMoney(run.totalNet)}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {run._count?.items ?? 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {actionsFor(run)}
                      </div>
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
          if (!o) setShowCreate(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Payroll Run</DialogTitle>
            <DialogDescription>
              Pick the pay period for this run. You can process it once it is created.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Period Start *</Label>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Period End *</Label>
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              disabled={createRun.isPending || !periodStart || !periodEnd}
              onClick={() => createRun.mutate()}
            >
              {createRun.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {viewId && <RunViewDialog orgId={orgId} runId={viewId} onClose={() => setViewId(null)} />}

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => {
          if (!o) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payroll Run?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete the run for <strong>{deleting ? fmtPeriod(deleting.periodStart) : ""}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleting && deleteRun.mutate(deleting)}
            >
              {deleteRun.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RunViewDialog({
  orgId,
  runId,
  onClose,
}: {
  orgId: string | null;
  runId: string;
  onClose: () => void;
}) {
  const {
    data: run,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["payroll-run", orgId, runId],
    queryFn: () => api.get<PayrollRun>(`/payroll/organizations/${orgId}/runs/${runId}`),
    enabled: !!orgId,
  });

  const items = run?.items ?? [];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Payroll Run — {run ? fmtPeriod(run.periodStart) : "…"}</DialogTitle>
          <DialogDescription>
            {run ? (
              <>
                {fmtDate(run.periodStart)} → {fmtDate(run.periodEnd)} ·{" "}
                {items.length} employee{items.length === 1 ? "" : "s"}
              </>
            ) : (
              "Loading run details…"
            )}
          </DialogDescription>
        </DialogHeader>

        {run && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-muted/40">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Gross</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {fmtMoney(run.totalGross)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/40">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Deductions</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {fmtMoney(run.totalDeductions)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/40">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Net</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {fmtMoney(run.totalNet)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <StatusCell status={run?.status ?? "DRAFT"} />
          {run?.processedAt && (
            <span className="text-xs text-muted-foreground">
              Processed {fmtDate(run.processedAt)}
            </span>
          )}
          {run?.notes && (
            <span className="truncate text-xs text-muted-foreground">{run.notes}</span>
          )}
        </div>

        {isLoading ? (
          <LoadingRows />
        ) : isError ? (
          <ErrorState message="payroll run" onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Banknote className="h-6 w-6" />}
            title="No items computed"
            subtitle="Process this run to compute pay for employees with an active salary structure."
          />
        ) : (
          <div className="max-h-[320px] overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{employeeName(item.employee)}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.employee.employeeCode}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtMoney(item.grossPay)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtMoney(item.totalDeductions)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {fmtMoney(item.netPay)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const structureGross = (s: SalaryStructure) =>
  Number(s.basicPay ?? 0) +
  Number(s.hra ?? 0) +
  Number(s.specialAllowance ?? 0) +
  Number(s.conveyance ?? 0) +
  Number(s.otherEarnings ?? 0);

const structureDeductions = (s: SalaryStructure) =>
  Number(s.providentFund ?? 0) +
  Number(s.esi ?? 0) +
  Number(s.professionalTax ?? 0) +
  Number(s.otherDeductions ?? 0);

type StructureForm = {
  employeeId: string;
  basicPay: string;
  hra: string;
  specialAllowance: string;
  conveyance: string;
  otherEarnings: string;
  providentFund: string;
  esi: string;
  professionalTax: string;
  otherDeductions: string;
  effectiveFrom: string;
};

const emptyStructureForm = (): StructureForm => ({
  employeeId: "",
  basicPay: "",
  hra: "",
  specialAllowance: "",
  conveyance: "",
  otherEarnings: "",
  providentFund: "",
  esi: "",
  professionalTax: "",
  otherDeductions: "",
  effectiveFrom: monthStart,
});

const STRUCTURE_FIELDS: { key: keyof StructureForm; label: string }[] = [
  { key: "basicPay", label: "Basic Pay" },
  { key: "hra", label: "HRA" },
  { key: "specialAllowance", label: "Special Allowance" },
  { key: "conveyance", label: "Conveyance" },
  { key: "otherEarnings", label: "Other Earnings" },
  { key: "providentFund", label: "Provident Fund" },
  { key: "esi", label: "ESI" },
  { key: "professionalTax", label: "Professional Tax" },
  { key: "otherDeductions", label: "Other Deductions" },
];

function StructuresTab({ orgId }: { orgId: string | null }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SalaryStructure | null>(null);
  const [deleting, setDeleting] = useState<SalaryStructure | null>(null);
  const [form, setForm] = useState<StructureForm>(emptyStructureForm);

  const {
    data: structures = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["payroll-structures", orgId],
    queryFn: () =>
      api.get<SalaryStructure[]>(
        `/payroll/organizations/${orgId}/salary-structures?limit=100`,
      ),
    enabled: !!orgId,
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ["payroll-employees", orgId],
    queryFn: () =>
      api.get<Employee[]>(`/business-data/organizations/${orgId}/employees`),
    enabled: !!orgId,
  });

  const setField = (key: keyof StructureForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyStructureForm());
    setShowForm(true);
  };

  const openEdit = (s: SalaryStructure) => {
    setEditing(s);
    setForm({
      employeeId: s.employeeId,
      basicPay: String(s.basicPay),
      hra: String(s.hra),
      specialAllowance: String(s.specialAllowance),
      conveyance: String(s.conveyance),
      otherEarnings: String(s.otherEarnings),
      providentFund: String(s.providentFund),
      esi: String(s.esi),
      professionalTax: String(s.professionalTax),
      otherDeductions: String(s.otherDeductions),
      effectiveFrom: s.effectiveFrom.slice(0, 10),
    });
    setShowForm(true);
  };

  const saveStructure = useMutation({
    mutationFn: async () => {
      const payload = {
        employeeId: form.employeeId,
        basicPay: Number(form.basicPay) || 0,
        hra: Number(form.hra) || 0,
        specialAllowance: Number(form.specialAllowance) || 0,
        conveyance: Number(form.conveyance) || 0,
        otherEarnings: Number(form.otherEarnings) || 0,
        providentFund: Number(form.providentFund) || 0,
        esi: Number(form.esi) || 0,
        professionalTax: Number(form.professionalTax) || 0,
        otherDeductions: Number(form.otherDeductions) || 0,
        effectiveFrom: form.effectiveFrom,
      };
      if (editing) {
        return api.patch(
          `/payroll/organizations/${orgId}/salary-structures/${editing.id}`,
          payload,
        );
      }
      return api.post(`/payroll/organizations/${orgId}/salary-structures`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-structures", orgId] });
      toast.success(editing ? "Salary structure updated" : "Salary structure created");
      setShowForm(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const deleteStructure = useMutation({
    mutationFn: (s: SalaryStructure) =>
      api.delete(`/payroll/organizations/${orgId}/salary-structures/${s.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-structures", orgId] });
      toast.success("Salary structure deactivated");
      setDeleting(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Define monthly compensation for employees. Active structures are used
          when processing payroll runs.
        </p>
        <Button
          size="sm"
          className="gradient-primary text-white"
          onClick={openCreate}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Structure
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingRows />
          ) : isError ? (
            <ErrorState message="salary structures" onRetry={() => refetch()} />
          ) : structures.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No salary structures yet"
              subtitle="Create salary structures for employees so payroll runs can be computed."
              action={
                <Button
                  size="sm"
                  className="gradient-primary text-white"
                  onClick={openCreate}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Structure
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Basic Pay</TableHead>
                  <TableHead className="text-right">HRA</TableHead>
                  <TableHead className="text-right">Allowances</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Structure</TableHead>
                  <TableHead>Effective From</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {structures.map((s) => {
                  const gross = structureGross(s);
                  const deductions = structureDeductions(s);
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">{employeeName(s.employee)}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.employee.employeeCode}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtMoney(s.basicPay)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtMoney(s.hra)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtMoney(
                          Number(s.specialAllowance ?? 0) +
                            Number(s.conveyance ?? 0) +
                            Number(s.otherEarnings ?? 0),
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtMoney(deductions)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {fmtMoney(gross - deductions)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {fmtDate(s.effectiveFrom)}
                      </TableCell>
                      <TableCell>
                        <StatusCell status={s.isActive ? "ACTIVE" : "INACTIVE"} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(s)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleting(s)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(o) => !o && setShowForm(false)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Salary Structure" : "Create Salary Structure"}
            </DialogTitle>
            <DialogDescription>
              Set monthly earnings and deductions for the employee. Values are used
              when processing payroll runs.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Employee *</Label>
              <Select
                value={form.employeeId}
                onValueChange={(v) => setField("employeeId", v)}
                disabled={!!editing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employeesLoading && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Loading employees…
                    </div>
                  )}
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {employeeName(e)} ({e.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {STRUCTURE_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label>{f.label}</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form[f.key]}
                    onChange={(e) => setField(f.key, e.target.value)}
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label>Effective From *</Label>
                <Input
                  type="date"
                  value={form.effectiveFrom}
                  onChange={(e) => setField("effectiveFrom", e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              disabled={
                saveStructure.isPending ||
                !form.employeeId ||
                !form.effectiveFrom
              }
              onClick={() => saveStructure.mutate()}
            >
              {saveStructure.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => {
          if (!o) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Salary Structure?</AlertDialogTitle>
            <AlertDialogDescription>
              Deactivate the structure for{" "}
              <strong>{deleting ? employeeName(deleting.employee) : ""}</strong>?
              It will no longer be used in payroll processing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleting && deleteStructure.mutate(deleting)}
            >
              {deleteStructure.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
