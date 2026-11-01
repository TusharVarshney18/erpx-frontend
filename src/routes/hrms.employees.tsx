import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Link2Off } from "lucide-react";
import { toast } from "sonner";
import { DataModule, statusBadge } from "@/lib/crud/DataModule";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAccess } from "@/hooks/useAccess";
import { useActiveOrgId } from "@/features/self-service/use-my-employee";
import { employeeLinkApi, type LinkableUser } from "@/lib/api/self-service";

export const Route = createFileRoute("/hrms/employees")({
  head: () => ({ meta: [{ title: "Employees - ERPX" }] }),
  component: EmployeesPage,
});

type LinkTarget = {
  id: string;
  name: string;
  email: string | null;
  userId: string | null;
  refresh: () => void;
};

function userLabel(u: Pick<LinkableUser, "firstName" | "lastName" | "email">) {
  const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
  return name ? `${name} (${u.email})` : u.email;
}

function EmployeesPage() {
  const orgId = useActiveOrgId();
  const access = useAccess();
  const canLink = access.canAny(["employee:update"]);
  const [target, setTarget] = useState<LinkTarget | null>(null);

  const users = useQuery({
    queryKey: ["employees", "linkable-users", orgId],
    enabled: !!orgId && canLink,
    queryFn: () => employeeLinkApi.linkableUsers(orgId!),
  });
  const usersById = useMemo(() => new Map((users.data ?? []).map((u) => [u.id, u])), [users.data]);

  return (
    <div className="max-w-[1400px] mx-auto">
      <DataModule
        title="Employees"
        table="employees"
        permissionPrefix="employee"
        newLabel="New Employee"
        searchKeys={["employeeCode", "firstName", "lastName", "email"]}
        fields={[
          { key: "employeeCode", label: "Code", required: true },
          { key: "firstName", label: "First Name", required: true },
          { key: "lastName", label: "Last Name", required: true },
          { key: "email", label: "Email", type: "email" },
          { key: "phone", label: "Phone", type: "tel" },
          {
            key: "userId",
            label: "Login account",
            hideInForm: true,
            format: (v) => {
              if (!v) return <span className="text-xs text-muted-foreground">Not linked</span>;
              const u = usersById.get(v);
              return (
                <Badge variant="secondary" className="bg-success/10 text-success" title={u?.email}>
                  <Link2 className="mr-1 h-3 w-3" />
                  {u ? `${u.firstName} ${u.lastName}`.trim() || u.email : "Linked"}
                </Badge>
              );
            },
          },
          {
            key: "departmentId",
            label: "Department",
            type: "lookup",
            lookupTable: "departments",
            hideInTable: true,
          },
          {
            key: "designationId",
            label: "Designation",
            type: "lookup",
            lookupTable: "designations",
            hideInTable: true,
          },
          { key: "joiningDate", label: "Join Date", type: "date" },
          {
            key: "managerId",
            label: "Manager",
            type: "lookup",
            lookupTable: "employees",
            lookupLabelKey: "firstName",
            hideInTable: true,
          },
          {
            key: "employmentStatus",
            label: "Status",
            type: "select",
            options: ["ACTIVE", "INACTIVE", "TERMINATED"],
            defaultValue: "ACTIVE",
            badge: statusBadge,
          },
        ]}
        rowActions={(row, { refresh }) =>
          canLink ? (
            <>
              <DropdownMenuItem
                onClick={() =>
                  setTarget({
                    id: row.id,
                    name: `${row.firstName} ${row.lastName}`,
                    email: row.email ?? null,
                    userId: row.userId ?? null,
                    refresh,
                  })
                }
              >
                <Link2 className="mr-2 h-4 w-4" />{" "}
                {row.userId ? "Change linked account" : "Link user account"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null
        }
      />

      {target && orgId && (
        <LinkUserDialog
          orgId={orgId}
          target={target}
          users={users.data ?? []}
          loading={users.isLoading}
          onClose={() => setTarget(null)}
        />
      )}
    </div>
  );
}

function LinkUserDialog({
  orgId,
  target,
  users,
  loading,
  onClose,
}: {
  orgId: string;
  target: LinkTarget;
  users: LinkableUser[];
  loading: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  // Pre-select the current link, else the member whose email matches.
  const suggested =
    target.userId ??
    users.find(
      (u) =>
        target.email && u.email.toLowerCase() === target.email.toLowerCase() && !u.linkedEmployee,
    )?.id ??
    "";
  const [userId, setUserId] = useState<string>(suggested);

  const save = useMutation({
    mutationFn: (value: string | null) => employeeLinkApi.setUser(orgId, target.id, value),
    onSuccess: (_d, value) => {
      toast.success(value ? `${target.name} can now check in and apply leave` : "Account unlinked");
      qc.invalidateQueries({ queryKey: ["employees", "linkable-users"] });
      target.refresh();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message || "Could not update link"),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link user account</DialogTitle>
          <DialogDescription>
            Choose the login account that belongs to <strong>{target.name}</strong>. They&apos;ll
            get My Attendance and My Leave on the web and mobile app.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>User account</Label>
          <Select value={userId} onValueChange={setUserId} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder={loading ? "Loading members…" : "Select a team member"} />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => {
                const takenByOther = u.linkedEmployee && u.linkedEmployee.id !== target.id;
                return (
                  <SelectItem key={u.id} value={u.id} disabled={!!takenByOther}>
                    {userLabel(u)}
                    {takenByOther ? ` — linked to ${u.linkedEmployee!.name}` : ""}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {!loading && users.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No team members yet. Invite the employee from Admin → Users first.
            </p>
          )}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {target.userId ? (
            <Button
              variant="ghost"
              className="text-destructive"
              disabled={save.isPending}
              onClick={() => save.mutate(null)}
            >
              <Link2Off className="mr-2 h-4 w-4" /> Unlink
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={!userId || userId === target.userId || save.isPending}
              onClick={() => save.mutate(userId)}
            >
              {save.isPending ? "Saving…" : "Link account"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
