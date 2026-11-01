import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, format } from "date-fns";
import { CalendarPlus, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { selfServiceApi, type LeaveRequest, type LeaveType } from "@/lib/api/self-service";
import { useMyEmployee } from "./use-my-employee";
import { NotLinkedCard } from "./not-linked-card";

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: "CASUAL", label: "Casual" },
  { value: "SICK", label: "Sick" },
  { value: "ANNUAL", label: "Annual" },
  { value: "UNPAID", label: "Unpaid" },
];

const STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-warning/15 text-warning",
  APPROVED: "bg-success/15 text-success",
  REJECTED: "bg-destructive/15 text-destructive",
};

function days(l: { startDate: string; endDate: string }) {
  return differenceInCalendarDays(new Date(l.endDate), new Date(l.startDate)) + 1;
}

function typeLabel(t: string) {
  return LEAVE_TYPES.find((x) => x.value === t)?.label ?? t;
}

export function MyLeavePage() {
  const { orgId, employee, isLoading } = useMyEmployee();
  const [open, setOpen] = useState(false);

  const leaves = useQuery({
    queryKey: ["self", "leave", orgId],
    enabled: !!orgId && !!employee,
    queryFn: () => selfServiceApi.leave(orgId!),
  });

  const list = leaves.data ?? [];
  const year = new Date().getFullYear();
  const approvedThisYear = list
    .filter((l) => l.status === "APPROVED" && new Date(l.startDate).getFullYear() === year)
    .reduce((n, l) => n + days(l), 0);
  const pending = list.filter((l) => l.status === "PENDING").length;

  return (
    <div className="mx-auto max-w-[1000px] space-y-6">
      <PageHeader
        title="My Leave"
        subtitle="Apply for leave and track your requests"
        actions={
          employee ? (
            <Button onClick={() => setOpen(true)}>
              <CalendarPlus className="mr-2 h-4 w-4" /> Apply leave
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : !employee || !orgId ? (
        <NotLinkedCard action="apply for leave" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryTile label={`Days taken in ${year}`} value={approvedThisYear} />
            <SummaryTile label="Pending requests" value={pending} />
            <SummaryTile label="Total requests" value={list.length} />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">My requests</CardTitle>
            </CardHeader>
            <CardContent>
              {leaves.isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : list.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                  <CalendarDays className="h-8 w-8" />
                  You haven&apos;t applied for any leave yet.
                </div>
              ) : (
                <ul className="divide-y">
                  {list.map((l) => (
                    <LeaveRow key={l.id} leave={l} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <ApplyLeaveDialog orgId={orgId} open={open} onClose={() => setOpen(false)} />
        </>
      )}
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function LeaveRow({ leave }: { leave: LeaveRequest }) {
  const n = days(leave);
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 py-3">
      <div className="min-w-0 space-y-0.5">
        <p className="font-medium">
          {typeLabel(leave.leaveType)} leave · {n} day{n === 1 ? "" : "s"}
        </p>
        <p className="text-sm text-muted-foreground">
          {format(new Date(leave.startDate), "d MMM yyyy")}
          {n > 1 && ` – ${format(new Date(leave.endDate), "d MMM yyyy")}`}
        </p>
        {leave.reason && <p className="text-sm text-muted-foreground">“{leave.reason}”</p>}
        {leave.status === "REJECTED" && leave.rejectionReason && (
          <p className="text-sm text-destructive">Reason: {leave.rejectionReason}</p>
        )}
      </div>
      <Badge variant="secondary" className={STATUS_CLASS[leave.status]}>
        {leave.status.charAt(0) + leave.status.slice(1).toLowerCase()}
      </Badge>
    </li>
  );
}

function ApplyLeaveDialog({
  orgId,
  open,
  onClose,
}: {
  orgId: string;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const [leaveType, setLeaveType] = useState<LeaveType>("CASUAL");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState("");

  const apply = useMutation({
    mutationFn: () =>
      selfServiceApi.applyLeave(orgId, {
        leaveType,
        startDate,
        endDate,
        reason: reason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Leave request sent for approval");
      qc.invalidateQueries({ queryKey: ["self", "leave"] });
      setReason("");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message || "Could not apply for leave"),
  });

  const invalid = !startDate || !endDate || endDate < startDate;
  const n = invalid ? 0 : differenceInCalendarDays(new Date(endDate), new Date(startDate)) + 1;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply for leave</DialogTitle>
          <DialogDescription>Your manager / HR will be notified to approve it.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!invalid) apply.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label>Leave type</Label>
            <Select value={leaveType} onValueChange={(v) => setLeaveType(v as LeaveType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="leave-from">From</Label>
              <Input
                id="leave-from"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leave-to">To</Label>
              <Input
                id="leave-to"
                type="date"
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="leave-reason">Reason (optional)</Label>
            <Textarea
              id="leave-reason"
              rows={3}
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Family function"
            />
          </div>
          <DialogFooter className="items-center gap-2 sm:justify-between">
            <span className="text-sm text-muted-foreground">
              {invalid
                ? "End date must be on or after start date"
                : `${n} day${n === 1 ? "" : "s"}`}
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={invalid || apply.isPending}>
                {apply.isPending ? "Sending…" : "Submit request"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
