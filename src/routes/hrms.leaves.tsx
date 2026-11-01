import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAccess } from "@/hooks/useAccess";
import { leaveApprovalApi } from "@/lib/api/self-service";

export const Route = createFileRoute("/hrms/leaves")({
  head: () => ({ meta: [{ title: "Leaves - ERPX" }] }),
  component: LeavesPage,
});

type Pending = { orgId: string; id: string; refresh: () => void };

function LeavesPage() {
  const access = useAccess();
  const canApprove = access.canAny(["leave:approve"]);
  const canReject = access.canAny(["leave:reject"]);
  const [rejecting, setRejecting] = useState<Pending | null>(null);
  const [reason, setReason] = useState("");

  // Approve/reject go through the HRMS workflow API so the employee is
  // notified (in-app + mobile push) and the decision is audit-logged.
  const approve = useMutation({
    mutationFn: (p: Pending) => leaveApprovalApi.approve(p.orgId, p.id),
    onSuccess: (_d, p) => {
      toast.success("Leave approved — the employee has been notified");
      p.refresh();
    },
    onError: (e: Error) => toast.error(e.message || "Could not approve leave"),
  });
  const reject = useMutation({
    mutationFn: (p: Pending) => leaveApprovalApi.reject(p.orgId, p.id, reason.trim() || undefined),
    onSuccess: (_d, p) => {
      toast.success("Leave rejected — the employee has been notified");
      p.refresh();
      setRejecting(null);
      setReason("");
    },
    onError: (e: Error) => toast.error(e.message || "Could not reject leave"),
  });

  return (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Leave Requests"
        subtitle="Review and approve team leave. Employees apply from My Leave or the mobile app."
        table="leaves"
        permissionPrefix="leave"
        newLabel="Add Leave"
        searchKeys={["leaveType", "reason"]}
        fields={[
          {
            key: "employeeId",
            label: "Employee",
            type: "lookup",
            lookupTable: "employees",
            lookupLabelKey: "firstName",
            required: true,
          },
          {
            key: "leaveType",
            label: "Type",
            type: "select",
            options: ["CASUAL", "SICK", "ANNUAL", "UNPAID"],
            required: true,
          },
          { key: "startDate", label: "From", type: "date", required: true },
          { key: "endDate", label: "To", type: "date", required: true },
          { key: "reason", label: "Reason", type: "textarea", hideInTable: true },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["PENDING", "APPROVED", "REJECTED"],
            badge: statusBadge,
            hideInForm: true,
          },
        ]}
        rowActions={(row, { orgId, refresh }) =>
          row.status === "PENDING" && orgId && (canApprove || canReject) ? (
            <>
              {canApprove && (
                <DropdownMenuItem
                  className="text-success"
                  onClick={() => approve.mutate({ orgId, id: row.id, refresh })}
                >
                  <Check className="mr-2 h-4 w-4" /> Approve
                </DropdownMenuItem>
              )}
              {canReject && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setRejecting({ orgId, id: row.id, refresh })}
                >
                  <X className="mr-2 h-4 w-4" /> Reject
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          ) : null
        }
      />

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject leave request</DialogTitle>
            <DialogDescription>The employee will see this reason.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">Reason (optional)</Label>
            <Textarea
              id="reject-reason"
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Quarter-end close — please pick another week"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={reject.isPending}
              onClick={() => rejecting && reject.mutate(rejecting)}
            >
              {reject.isPending ? "Rejecting…" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
