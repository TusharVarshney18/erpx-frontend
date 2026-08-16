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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Shield,
  Plus,
  Search,
  Users,
  KeyRound,
  Loader2,
  Inbox,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Save,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/roles")({
  head: () => ({ meta: [{ title: "Roles & Permissions — Acme ERP" }] }),
  component: RolesPage,
});

type Role = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  isOwner: boolean;
  userCount?: number;
  permissionsCount?: number;
  _count?: {
    userRoles: number;
    rolePermissions: number;
  };
  createdAt: string;
};

type Permission = {
  id: string;
  groupId: string;
  resource: string;
  action: string;
  description: string | null;
  group?: { id: string; name: string; slug: string };
};

type FieldPermissionEntry = {
  resource: string;
  field: string;
  canRead: boolean;
  canWrite: boolean;
};

const FIELD_GROUPS: { resource: string; fields: string[] }[] = [
  { resource: "invoice", fields: ["unitPrice", "discount", "taxRate", "grandTotal", "notes"] },
  { resource: "salesOrder", fields: ["unitPrice", "discount", "taxRate", "grandTotal"] },
  { resource: "product", fields: ["sellingPrice", "purchasePrice", "taxRate"] },
  { resource: "vendorBill", fields: ["unitCost", "taxRate", "grandTotal"] },
  { resource: "employee", fields: ["salaryStructure", "bankAccount", "pan", "aadhaar"] },
  { resource: "payroll", fields: ["grossPay", "netPay", "deductions", "bankAccount"] },
  { resource: "customer", fields: ["creditLimit", "annualRevenue", "gstNumber"] },
  { resource: "journalEntry", fields: ["debit", "credit", "description"] },
];

function RolesPage() {
  const qc = useQueryClient();
  const { activeOrganizationId } = useAuth();
  const access = useAccess();
  const canCreate = access.hasPermission("role:create");
  const canUpdate = access.hasPermission("role:update");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [tab, setTab] = useState<"permissions" | "fields">("permissions");
  const [changedPermissions, setChangedPermissions] = useState<Record<string, boolean>>({});

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const {
    data: roles = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-roles", activeOrganizationId],
    queryFn: () => api.get<Role[]>("/rbac/roles"),
    enabled: !!activeOrganizationId,
  });

  const { data: allPermissions = [], isLoading: permLoading } = useQuery({
    queryKey: ["admin-permissions"],
    queryFn: () => api.get<Permission[]>("/rbac/permissions"),
    enabled: !!activeOrganizationId,
  });

  const { data: rolePermissions = [], isLoading: rolePermLoading } = useQuery({
    queryKey: ["admin-role-permissions", selectedRole?.id],
    queryFn: () => api.get<Permission[]>(`/rbac/roles/${selectedRole!.id}/permissions`),
    enabled: !!selectedRole,
  });

  const createRole = useMutation({
    mutationFn: async () => {
      const slug = newName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return api.post("/rbac/roles", {
        name: newName.trim(),
        slug,
        description: newDescription.trim() || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-roles"] });
      toast.success("Role created");
      setShowCreate(false);
      setNewName("");
      setNewDescription("");
    },
    onError: (e: any) => toast.error(e.message ?? "Create failed"),
  });

  const savePermissions = useMutation({
    mutationFn: async (permissionIds: string[]) => {
      return api.put(`/rbac/roles/${selectedRole!.id}/permissions`, {
        permissionIds,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin-role-permissions", selectedRole?.id],
      });
      qc.invalidateQueries({ queryKey: ["admin-roles"] });
      toast.success("Permissions saved");
      setChangedPermissions({});
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const { data: fieldPermissions = [], isLoading: fieldPermLoading } = useQuery({
    queryKey: ["admin-role-field-permissions", selectedRole?.id],
    queryFn: () =>
      api.get<FieldPermissionEntry[]>(`/rbac/roles/${selectedRole!.id}/field-permissions`),
    enabled: !!selectedRole,
  });

  const [changedFieldPerms, setChangedFieldPerms] = useState<
    Record<string, { canRead: boolean; canWrite: boolean }>
  >({});

  const saveFieldPermissions = useMutation({
    mutationFn: async (entries: FieldPermissionEntry[]) => {
      return api.put(`/rbac/roles/${selectedRole!.id}/field-permissions`, {
        entries,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin-role-field-permissions", selectedRole?.id],
      });
      toast.success("Field permissions saved");
      setChangedFieldPerms({});
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const resolveFieldPerm = (key: string) => {
    const changed = changedFieldPerms[key];
    if (changed) return changed;
    return (
      fieldPermissions.find((f) => `${f.resource}.${f.field}` === key) ?? {
        canRead: false,
        canWrite: false,
      }
    );
  };

  const toggleFieldPerm = (
    key: string,
    prop: "canRead" | "canWrite",
    resource: string,
    field: string,
  ) => {
    setChangedFieldPerms((prev) => {
      const current = prev[key] ?? resolveFieldPerm(key);
      return {
        ...prev,
        [key]: { ...current, [prop]: !current[prop] },
      };
    });
  };

  const hasFieldPermChanges = Object.keys(changedFieldPerms).length > 0;

  const displayFieldPerms = useMemo(() => {
    const map = new Map<string, FieldPermissionEntry>();
    fieldPermissions.forEach((f) => map.set(`${f.resource}.${f.field}`, f));
    Object.entries(changedFieldPerms).forEach(([key, v]) => {
      const [resource, field] = key.split(".");
      map.set(key, { resource, field, ...v });
    });
    return Array.from(map.values());
  }, [fieldPermissions, changedFieldPerms]);

  const fieldPermModules = useMemo(() => {
    const map: Record<string, FieldPermissionEntry[]> = {};
    displayFieldPerms.forEach((f) => {
      if (!map[f.resource]) map[f.resource] = [];
      map[f.resource].push(f);
    });
    return map;
  }, [displayFieldPerms]);

  const filteredRoles = useMemo(() => {
    if (!search.trim()) return roles;
    const s = search.toLowerCase();
    return roles.filter(
      (r) => r.name.toLowerCase().includes(s) || (r.description ?? "").toLowerCase().includes(s),
    );
  }, [roles, search]);

  const permissionModules = useMemo(() => {
    const map: Record<string, Permission[]> = {};
    allPermissions.forEach((p) => {
      const module = p.group?.slug ?? p.resource;
      if (!map[module]) map[module] = [];
      map[module].push(p);
    });
    return map;
  }, [allPermissions]);

  const closeSheet = () => {
    setSelectedRole(null);
    setChangedPermissions({});
    setChangedFieldPerms({});
    setTab("permissions");
  };

  const togglePermission = (permId: string) => {
    setChangedPermissions((prev) => {
      const base = rolePermissions.some((p) => p.id === permId);
      const changed = prev[permId];
      const effective = changed !== undefined ? changed : base;
      return { ...prev, [permId]: !effective };
    });
  };

  const isPermissionGranted = (permId: string) => {
    const changed = changedPermissions[permId];
    if (changed !== undefined) return changed;
    return rolePermissions.some((p) => p.id === permId);
  };

  const hasPermissionChanges = Object.keys(changedPermissions).length > 0;

  const displayRolePermissions = useMemo(() => {
    const grantedIds = new Set(rolePermissions.map((p) => p.id));
    Object.entries(changedPermissions).forEach(([permId, granted]) => {
      if (granted) grantedIds.add(permId);
      else grantedIds.delete(permId);
    });
    return grantedIds;
  }, [rolePermissions, changedPermissions]);

  const changedCount = useMemo(
    () =>
      Object.entries(changedPermissions).filter(([permId, newVal]) => {
        const orig = rolePermissions.some((p) => p.id === permId);
        return orig !== newVal;
      }).length,
    [changedPermissions, rolePermissions],
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Role-based access control"
        actions={
          canCreate ? (
            <Button
              size="sm"
              className="gradient-primary text-white"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Role
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search roles…"
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
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-semibold">Failed to load roles</p>
              <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Shield className="h-6 w-6" />
              </div>
              <p className="font-semibold">
                {search ? "No roles match your search" : "No roles yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Try a different search term."
                  : "Create your first role to define access permissions."}
              </p>
              {!search && (
                <Button
                  size="sm"
                  className="gradient-primary text-white"
                  onClick={() => setShowCreate(true)}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Role
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow
                    key={role.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedRole(role)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="font-medium">{role.name}</span>
                        {role.isSystem && (
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            System
                          </Badge>
                        )}
                        {role.isOwner && (
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            Owner
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[260px] truncate">
                      {role.description ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {role._count?.userRoles ?? role.userCount ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                        {role._count?.rolePermissions ?? role.permissionsCount ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
          if (!o) {
            setShowCreate(false);
            setNewName("");
            setNewDescription("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
            <DialogDescription>Define a new role for your organization.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Role Name *</Label>
              <Input
                placeholder="e.g. Manager"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="e.g. Can manage team members and approve requests"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-white"
              disabled={createRole.isPending || !newName.trim()}
              onClick={() => createRole.mutate()}
            >
              {createRole.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!selectedRole} onOpenChange={(o) => !o && closeSheet()}>
        <SheetContent className="w-full max-w-lg sm:max-w-xl">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {selectedRole?.name}
            </SheetTitle>
            <SheetDescription>
              {selectedRole?.description ?? "Configure permissions for this role."}
            </SheetDescription>
          </SheetHeader>

          <Separator className="my-4" />

          <Tabs defaultValue="permissions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="permissions"
                className="gap-1.5"
                onClick={() => setTab("permissions")}
              >
                <KeyRound className="h-4 w-4" /> Permissions
              </TabsTrigger>
              <TabsTrigger value="fields" className="gap-1.5" onClick={() => setTab("fields")}>
                <Shield className="h-4 w-4" /> Field-level
              </TabsTrigger>
            </TabsList>

            <TabsContent value="permissions" className="mt-3">
              {rolePermLoading || permLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : allPermissions.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <KeyRound className="h-8 w-8 text-muted-foreground" />
                  <p className="font-semibold">No permissions available</p>
                  <p className="text-sm text-muted-foreground">
                    Define permissions in the backend first.
                  </p>
                </div>
              ) : (
                <ScrollArea className="flex-1 pr-4" style={{ height: "calc(100vh - 320px)" }}>
                  <div className="space-y-6">
                    {Object.entries(permissionModules).map(([module, permissions]) => {
                      const grantedCount = permissions.filter((p) =>
                        isPermissionGranted(p.id),
                      ).length;
                      const totalCount = permissions.length;
                      const allGranted = grantedCount === totalCount;

                      return (
                        <div key={module}>
                          <div className="mb-2 flex items-center justify-between">
                            <h4 className="text-sm font-semibold capitalize">
                              {module.replace(/_/g, " ").toLowerCase()}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {grantedCount}/{totalCount}
                            </span>
                          </div>
                          <div className="space-y-1 rounded-lg border border-border p-1">
                            {permissions.map((perm) => {
                              const granted = isPermissionGranted(perm.id);
                              return (
                                <div
                                  key={perm.id}
                                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent/50 transition-colors"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium capitalize">
                                      {perm.action.replace(/_/g, " ").toLowerCase()}
                                    </p>
                                    {perm.description && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {perm.description}
                                      </p>
                                    )}
                                  </div>
                                  <Switch
                                    checked={granted}
                                    onCheckedChange={() => togglePermission(perm.id)}
                                    disabled={
                                      !canUpdate ||
                                      selectedRole?.isOwner ||
                                      savePermissions.isPending
                                    }
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="fields" className="mt-3">
              {selectedRole?.isOwner ? (
                <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                  The Owner role always has unrestricted field access.
                </p>
              ) : fieldPermLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="flex-1 pr-4" style={{ height: "calc(100vh - 320px)" }}>
                  <div className="space-y-6">
                    {FIELD_GROUPS.map((group) => (
                      <div key={group.resource}>
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="text-sm font-semibold capitalize">
                            {group.resource.replace(/_/g, " ")}
                          </h4>
                        </div>
                        <div className="overflow-hidden rounded-lg border border-border">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                                <th className="px-3 py-2 font-medium">Field</th>
                                <th className="px-3 py-2 text-center font-medium">Read</th>
                                <th className="px-3 py-2 text-center font-medium">Write</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.fields.map((field) => {
                                const key = `${group.resource}.${field}`;
                                const perm = resolveFieldPerm(key);
                                return (
                                  <tr key={key} className="border-b border-border last:border-0">
                                    <td className="px-3 py-2 font-mono text-xs">{field}</td>
                                    <td className="px-3 py-2 text-center">
                                      <Switch
                                        checked={perm.canRead}
                                        onCheckedChange={() =>
                                          toggleFieldPerm(key, "canRead", group.resource, field)
                                        }
                                        disabled={!canUpdate || saveFieldPermissions.isPending}
                                      />
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <Switch
                                        checked={perm.canWrite}
                                        onCheckedChange={() =>
                                          toggleFieldPerm(key, "canWrite", group.resource, field)
                                        }
                                        disabled={!canUpdate || saveFieldPermissions.isPending}
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>

          <SheetFooter className="mt-4 pt-4 border-t border-border">
            <div className="flex w-full items-center justify-between gap-3">
              {tab === "fields" ? (
                <>
                  {hasFieldPermChanges && (
                    <p className="text-xs text-muted-foreground">
                      {Object.keys(changedFieldPerms).length} field change
                      {Object.keys(changedFieldPerms).length > 1 ? "s" : ""} pending
                    </p>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <Button variant="outline" onClick={closeSheet}>
                      <X className="mr-1.5 h-3.5 w-3.5" /> Cancel
                    </Button>
                    {canUpdate && !selectedRole?.isOwner && (
                      <Button
                        className="gradient-primary text-white"
                        disabled={!hasFieldPermChanges || saveFieldPermissions.isPending}
                        onClick={() => saveFieldPermissions.mutate(displayFieldPerms)}
                      >
                        {saveFieldPermissions.isPending ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Save Field Permissions
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {changedCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {changedCount} change{changedCount > 1 ? "s" : ""} pending
                    </p>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <Button variant="outline" onClick={closeSheet}>
                      <X className="mr-1.5 h-3.5 w-3.5" /> Cancel
                    </Button>
                    {canUpdate && (
                      <Button
                        className="gradient-primary text-white"
                        disabled={!hasPermissionChanges || savePermissions.isPending}
                        onClick={() => savePermissions.mutate(Array.from(displayRolePermissions))}
                      >
                        {savePermissions.isPending ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Save Changes
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
