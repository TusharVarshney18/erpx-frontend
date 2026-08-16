import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useAccess } from "@/hooks/useAccess";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Plus,
  Search,
  Mail,
  MoreHorizontal,
  Shield,
  Ban,
  Loader2,
  Inbox,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — Acme ERP" }] }),
  component: UsersPage,
});

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  phone: string | null;
  status: string;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  userRoles: {
    role: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
};

type Role = {
  id: string;
  name: string;
  slug: string;
};

function UsersPage() {
  const qc = useQueryClient();
  const { activeOrganizationId } = useAuth();
  const access = useAccess();
  const canCreate = access.hasPermission("user:create");
  const canUpdate = access.hasPermission("user:update");
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [editingRole, setEditingRole] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [deactivating, setDeactivating] = useState<User | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");

  const { data: users = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-users", activeOrganizationId],
    queryFn: () => api.get<User[]>("/auth/users"),
    enabled: !!activeOrganizationId,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-roles-list", activeOrganizationId],
    queryFn: () => api.get<Role[]>("/rbac/roles"),
    enabled: !!activeOrganizationId,
  });

  const inviteUser = useMutation({
    mutationFn: async () => {
      return api.post("/auth/users/invite", {
        email: inviteEmail.trim(),
        firstName: inviteFirstName.trim(),
        lastName: inviteLastName.trim(),
        roleId: inviteRoleId || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Invitation sent");
      setShowInvite(false);
      setInviteEmail("");
      setInviteFirstName("");
      setInviteLastName("");
      setInviteRoleId("");
    },
    onError: (e: any) => toast.error(e.message ?? "Invite failed"),
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      return api.patch(`/auth/users/${userId}/role`, { roleId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role updated");
      setEditingRole(null);
      setSelectedRoleId("");
    },
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  const deactivateUser = useMutation({
    mutationFn: async (user: User) => {
      return api.patch(`/auth/users/${user.id}/status`, { status: "DISABLED" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deactivated");
      setDeactivating(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Deactivate failed"),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const s = search.toLowerCase();
    return users.filter(
      (u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        u.userRoles?.some((ur) => ur.role.name.toLowerCase().includes(s)),
    );
  }, [users, search]);

  const initials = (u: User) =>
    `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase();

  const roleName = (u: User) =>
    u.userRoles?.length ? u.userRoles[0].role.name : "—";

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—";

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Users"
        subtitle="Team members with access"
        actions={
          canCreate ? (
            <Button
              size="sm"
              className="gradient-primary text-white"
              onClick={() => setShowInvite(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Invite User
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users…"
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
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-semibold">Failed to load users</p>
              <p className="text-sm text-muted-foreground">
                Check your connection and try again.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Users className="h-6 w-6" />
              </div>
              <p className="font-semibold">
                {search ? "No users match your search" : "No users yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Try a different search term."
                  : "Invite your first team member to get started."}
              </p>
              {!search && (
                <Button
                  size="sm"
                  className="gradient-primary text-white"
                  onClick={() => setShowInvite(true)}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Invite User
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {initials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal"
                      >
                        {roleName(user)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === "ACTIVE" ? "default" : "secondary"
                        }
                        className={
                          user.status === "ACTIVE"
                            ? "bg-success/15 text-success"
                            : user.status === "INVITED"
                              ? "bg-info/15 text-info"
                              : "bg-muted text-muted-foreground"
                        }
                      >
                        {user.status === "ACTIVE"
                          ? "Active"
                          : user.status === "INVITED"
                            ? "Invited"
                            : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(user.lastLoginAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canUpdate && (
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingRole(user);
                                setSelectedRoleId(
                                  user.userRoles?.[0]?.role?.id ?? "",
                                );
                              }}
                            >
                              <Shield className="mr-2 h-4 w-4" /> Change Role
                            </DropdownMenuItem>
                          )}
                          {canUpdate && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeactivating(user)}
                              disabled={user.status !== "ACTIVE"}
                            >
                              <Ban className="mr-2 h-4 w-4" /> Deactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showInvite}
        onOpenChange={(o) => {
          if (!o) {
            setShowInvite(false);
            setInviteEmail("");
            setInviteFirstName("");
            setInviteLastName("");
            setInviteRoleId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Send an invitation email to join this organization.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input
                  placeholder="John"
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input
                  placeholder="Doe"
                  value={inviteLastName}
                  onChange={(e) => setInviteLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="john@acme.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={inviteRoleId} onValueChange={setInviteRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role…" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInvite(false)}
            >
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              disabled={
                inviteUser.isPending ||
                !inviteEmail.trim() ||
                !inviteFirstName.trim() ||
                !inviteLastName.trim()
              }
              onClick={() => inviteUser.mutate()}
            >
              {inviteUser.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Mail className="mr-1.5 h-4 w-4" />
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingRole}
        onOpenChange={(o) => {
          if (!o) {
            setEditingRole(null);
            setSelectedRoleId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the role for{" "}
              <strong>
                {editingRole?.firstName} {editingRole?.lastName}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-1.5">
              <Label>New Role</Label>
              <Select
                value={selectedRoleId}
                onValueChange={setSelectedRoleId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role…" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingRole(null);
                setSelectedRoleId("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              disabled={updateRole.isPending || !selectedRoleId}
              onClick={() =>
                editingRole &&
                updateRole.mutate({
                  userId: editingRole.id,
                  roleId: selectedRoleId,
                })
              }
            >
              {updateRole.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deactivating}
        onOpenChange={(o) => {
          if (!o) setDeactivating(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate{" "}
              <strong>
                {deactivating?.firstName} {deactivating?.lastName}
              </strong>{" "}
              ({deactivating?.email}). They will not be able to log in until
              reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() =>
                deactivating && deactivateUser.mutate(deactivating)
              }
            >
              {deactivateUser.isPending && (
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
