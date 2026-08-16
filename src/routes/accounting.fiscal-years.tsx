import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useAccess } from "@/hooks/useAccess";
import { PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { CalendarRange, Loader2, Lock, Unlock, Plus, AlertCircle, Save } from "lucide-react";

export const Route = createFileRoute("/accounting/fiscal-years")({
  head: () => ({ meta: [{ title: "Fiscal Years — ERPX" }] }),
  component: FiscalYearsPage,
});

type Period = {
  id: string;
  periodNumber: number;
  startDate: string;
  endDate: string;
  isClosed: boolean;
};

type FiscalYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  periods: Period[];
};

function FiscalYearsPage() {
  const qc = useQueryClient();
  const { activeOrganizationId } = useAuth();
  const orgId = activeOrganizationId;
  const access = useAccess();
  const canClose = access.canAny(["fiscal_year:close"]);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [confirmClose, setConfirmClose] = useState<FiscalYear | null>(null);

  const { data: fiscalYears = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["fiscal-years", orgId],
    queryFn: () => api.get<FiscalYear[]>(`/accounting/organizations/${orgId}/fiscal-years`),
    enabled: !!orgId,
  });

  const createFy = useMutation({
    mutationFn: async () => {
      const periods = buildPeriods(newStart, newEnd);
      return api.post(`/accounting/organizations/${orgId}/fiscal-years`, {
        name: newName.trim(),
        startDate: newStart,
        endDate: newEnd,
        periods,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fiscal-years", orgId] });
      toast.success("Fiscal year created");
      setShowCreate(false);
      setNewName("");
      setNewStart("");
      setNewEnd("");
    },
    onError: (e: any) => toast.error(e.message ?? "Create failed"),
  });

  const closeFy = useMutation({
    mutationFn: async (fy: FiscalYear) =>
      api.post(`/accounting/organizations/${orgId}/fiscal-years/${fy.id}/close`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fiscal-years", orgId] });
      toast.success("Fiscal year closed");
      setConfirmClose(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Close failed"),
  });

  const togglePeriod = useMutation({
    mutationFn: async ({ periodId, close }: { periodId: string; close: boolean }) =>
      api.post(`/accounting/organizations/${orgId}/fiscal-years/periods/${periodId}/${close ? "close" : "open"}`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fiscal-years", orgId] });
      toast.success("Period updated");
    },
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  const canCreate = newName.trim().length > 0 && !!newStart && !!newEnd && newEnd > newStart;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        title="Fiscal Years"
        subtitle="Manage fiscal years and lock/unlock accounting periods"
        actions={
          <Button size="sm" className="gradient-primary text-white" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Fiscal Year
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-sm text-muted-foreground">Failed to load fiscal years.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      ) : fiscalYears.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <CalendarRange className="h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">No fiscal years yet</p>
          <p className="text-sm text-muted-foreground">
            Create a fiscal year to enable period-aware posting and reporting.
          </p>
          <Button size="sm" className="gradient-primary text-white" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Fiscal Year
          </Button>
        </div>
      ) : (
        fiscalYears.map((fy) => (
          <Card key={fy.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarRange className="h-4 w-4 text-primary" /> {fy.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(fy.startDate).toLocaleDateString("en-IN")} →{" "}
                  {new Date(fy.endDate).toLocaleDateString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={fy.isClosed ? "secondary" : "default"} className={fy.isClosed ? "" : "bg-success/15 text-success"}>
                  {fy.isClosed ? "CLOSED" : "OPEN"}
                </Badge>
                {canClose && !fy.isClosed && (
                  <Button size="sm" variant="outline" className="h-8" onClick={() => setConfirmClose(fy)}>
                    Close Year
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Status</TableHead>
                    {canClose && <TableHead className="w-24" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fy.periods.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                        No monthly periods defined.
                      </TableCell>
                    </TableRow>
                  ) : (
                    fy.periods.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">Period {p.periodNumber}</TableCell>
                        <TableCell className="tabular-nums">{new Date(p.startDate).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell className="tabular-nums">{new Date(p.endDate).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={p.isClosed ? "" : "bg-success/15 text-success"}>
                            {p.isClosed ? "Locked" : "Open"}
                          </Badge>
                        </TableCell>
                        {canClose && (
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1.5"
                              disabled={fy.isClosed || togglePeriod.isPending}
                              onClick={() =>
                                togglePeriod.mutate({ periodId: p.id, close: !p.isClosed })
                              }
                            >
                              {p.isClosed ? (
                                <>
                                  <Unlock className="h-3.5 w-3.5" /> Re-open
                                </>
                              ) : (
                                <>
                                  <Lock className="h-3.5 w-3.5" /> Lock
                                </>
                              )}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={showCreate} onOpenChange={(o) => !o && setShowCreate(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Fiscal Year</DialogTitle>
            <DialogDescription>Create a fiscal year with 12 monthly periods.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input placeholder="FY 2026-27" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start *</Label>
                <Input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End *</Label>
                <Input type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              12 monthly accounting periods will be created automatically.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              className="gradient-primary text-white"
              disabled={!canCreate || createFy.isPending}
              onClick={() => createFy.mutate()}
            >
              {createFy.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmClose} onOpenChange={(o) => !o && setConfirmClose(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close fiscal year {confirmClose?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This locks all periods and blocks further postings into this year. This action cannot be
              reversed per period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => confirmClose && closeFy.mutate(confirmClose)}
            >
              <Save className="mr-2 h-4 w-4" /> Close Year
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function buildPeriods(startStr: string, endStr: string): { periodNumber: number; startDate: string; endDate: string }[] {
  const start = new Date(startStr);
  const periods: { periodNumber: number; startDate: string; endDate: string }[] = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  let n = 1;
  while (n <= 12) {
    const periodStart = new Date(cursor);
    const periodEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    periods.push({
      periodNumber: n,
      startDate: periodStart.toISOString().slice(0, 10),
      endDate: periodEnd.toISOString().slice(0, 10),
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    n++;
  }
  return periods;
}
