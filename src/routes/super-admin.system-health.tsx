import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { RequireSuperAdmin } from "@/components/guards/RequireSuperAdmin";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
  RefreshCw,
  AlertCircle,
  Activity,
  Database,
  Clock,
  Cpu,
  MemoryStick,
  Boxes,
  ShieldCheck,
  KeyRound,
  Users,
} from "lucide-react";
export const Route = createFileRoute("/super-admin/system-health")({
  head: () => ({ meta: [{ title: "System Health — Super Admin — Acme ERP" }] }),
  component: () => (
    <RequireSuperAdmin>
      <SuperAdminSystemHealth />
    </RequireSuperAdmin>
  ),
});

type HealthData = {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  uptimeHuman: string;
  responseTime: number;
  database: {
    status: string;
    latency: number;
  };
  system: {
    memory: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
    nodeVersion: string;
    platform: string;
    cpuLoad: { user: number; system: number };
  };
  counts: {
    organizations: number;
    users: number;
    activeSubscriptions: number;
  };
};

type Role = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  isOwner: boolean;
  organization: { id: string; name: string; code: string };
  _count: { userRoles: number; rolePermissions: number };
};

type Permission = {
  id: string;
  resource: string;
  action: string;
  description: string | null;
  group: { id: string; name: string; slug: string };
  _count: { rolePermissions: number };
};

type PermissionGroup = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { permissions: number };
};

const HEALTH_STYLES: Record<string, string> = {
  healthy: "bg-success/15 text-success",
  degraded: "bg-warning/15 text-warning",
  unhealthy: "bg-destructive/15 text-destructive",
};

const PAGE_SIZE = 20;

function TablePagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages: (number | "ellipsis")[] = [];
  const delta = 2;
  const left = Math.max(2, page - delta);
  const right = Math.min(totalPages - 1, page + delta);
  pages.push(1);
  if (left > 2) pages.push("ellipsis");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push("ellipsis");
  if (totalPages > 1) pages.push(totalPages);

  return (
    <div className="flex items-center justify-end gap-1.5 border-t p-3">
      <Button variant="outline" size="sm" className="h-8" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e-${i}`} className="px-1 text-sm text-muted-foreground">…</span>
        ) : (
          <Button
            key={p}
            size="sm"
            variant={page === p ? "default" : "ghost"}
            className="h-8 w-8 px-0"
            onClick={() => onChange(p)}
          >
            {p}
          </Button>
        ),
      )}
      <Button variant="outline" size="sm" className="h-8" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <p className="font-semibold">Failed to load</p>
      <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
      </Button>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">{icon}</div>
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function SuperAdminSystemHealth() {
  const [tab, setTab] = useState("health");

  const { data: health, isLoading: healthLoading, isError: healthError, refetch: refetchHealth } = useQuery({
    queryKey: ["super-admin-health"],
    queryFn: () => api.get<HealthData>("/super-admin/health"),
  });

  const { data: roles = [], isLoading: rolesLoading, isError: rolesError, refetch: refetchRoles } = useQuery({
    queryKey: ["super-admin-roles"],
    queryFn: () => api.get<Role[]>("/super-admin/roles?limit=500"),
  });

  const { data: permissions = [], isLoading: permsLoading, isError: permsError, refetch: refetchPerms } = useQuery({
    queryKey: ["super-admin-permissions"],
    queryFn: () => api.get<Permission[]>("/super-admin/permissions?limit=500"),
  });

  const { data: groups = [], isLoading: groupsLoading, isError: groupsError, refetch: refetchGroups } = useQuery({
    queryKey: ["super-admin-permission-groups"],
    queryFn: () => api.get<PermissionGroup[]>("/super-admin/permission-groups"),
  });

  const [roleSearch, setRoleSearch] = useState("");
  const [rolePage, setRolePage] = useState(1);

  const [permSearch, setPermSearch] = useState("");
  const [permPage, setPermPage] = useState(1);

  const filteredRoles = useMemo(() => {
    let list = roles;
    if (roleSearch.trim()) {
      const s = roleSearch.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(s) ||
          r.slug.toLowerCase().includes(s) ||
          (r.organization?.name ?? "").toLowerCase().includes(s),
      );
    }
    return list;
  }, [roles, roleSearch]);

  const roleTotalPages = Math.max(1, Math.ceil(filteredRoles.length / PAGE_SIZE));
  const pagedRoles = filteredRoles.slice((rolePage - 1) * PAGE_SIZE, rolePage * PAGE_SIZE);

  const filteredPermissions = useMemo(() => {
    let list = permissions;
    if (permSearch.trim()) {
      const s = permSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.resource.toLowerCase().includes(s) ||
          p.action.toLowerCase().includes(s) ||
          (p.group?.name ?? "").toLowerCase().includes(s),
      );
    }
    return list;
  }, [permissions, permSearch]);

  const permTotalPages = Math.max(1, Math.ceil(filteredPermissions.length / PAGE_SIZE));
  const pagedPermissions = filteredPermissions.slice((permPage - 1) * PAGE_SIZE, permPage * PAGE_SIZE);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader title="System Health" subtitle="Runtime status, platform counts, and RBAC overview" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="health" className="gap-1.5">
            <Activity className="h-4 w-4" /> Health
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-1.5">
            <Users className="h-4 w-4" /> Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-1.5">
            <KeyRound className="h-4 w-4" /> Permissions
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Permission Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="mt-4 space-y-4">
          {healthLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : healthError ? (
            <ErrorState onRetry={() => refetchHealth()} />
          ) : health ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Overall Status</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <Badge className={HEALTH_STYLES[health.status]}>{health.status}</Badge>
                    <p className="mt-1 text-xs text-muted-foreground capitalize">
                      Response {health.responseTime}ms
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Database</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <Badge
                      className={
                        health.database.status === "connected"
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }
                    >
                      {health.database.status}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">{health.database.latency}ms latency</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Uptime</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{health.uptimeHuman}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{Math.round(health.uptime)} seconds</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Runtime</CardTitle>
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{health.system.nodeVersion}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground capitalize">{health.system.platform}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-1.5 text-base">
                      <MemoryStick className="h-4 w-4" /> Memory
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-2xl font-bold">{health.system.memory.heapUsed} MB</p>
                        <p className="text-xs text-muted-foreground">Heap used</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{health.system.memory.heapTotal} MB</p>
                        <p className="text-xs text-muted-foreground">Heap total</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{health.system.memory.rss} MB</p>
                        <p className="text-xs text-muted-foreground">RSS</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-1.5 text-base">
                      <Boxes className="h-4 w-4" /> Platform Counts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-2xl font-bold">{health.counts.organizations}</p>
                        <p className="text-xs text-muted-foreground">Organizations</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{health.counts.users}</p>
                        <p className="text-xs text-muted-foreground">Users</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{health.counts.activeSubscriptions}</p>
                        <p className="text-xs text-muted-foreground">Active subscriptions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="roles" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search roles by name, slug, or organization…"
                className="h-9 border-0 bg-muted/50 pl-9"
                value={roleSearch}
                onChange={(e) => { setRoleSearch(e.target.value); setRolePage(1); }}
              />
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              {rolesLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : rolesError ? (
                <ErrorState onRetry={() => refetchRoles()} />
              ) : filteredRoles.length === 0 ? (
                <EmptyState
                  icon={<Users className="h-6 w-6" />}
                  title={roleSearch ? "No roles match your search" : "No roles found"}
                  subtitle={roleSearch ? "Try a different search term." : "Roles assigned to users across organizations will appear here."}
                />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Users</TableHead>
                        <TableHead>Permissions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedRoles.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {r.name}
                              {r.isOwner && <Badge variant="secondary" className="text-[10px]">Owner</Badge>}
                              {r.isSystem && <Badge variant="outline" className="text-[10px]">System</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.slug}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {r.organization?.name ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm">{r._count.userRoles}</TableCell>
                          <TableCell className="text-sm">{r._count.rolePermissions}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination page={rolePage} totalPages={roleTotalPages} onChange={setRolePage} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search permissions by resource, action, or group…"
                className="h-9 border-0 bg-muted/50 pl-9"
                value={permSearch}
                onChange={(e) => { setPermSearch(e.target.value); setPermPage(1); }}
              />
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              {permsLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : permsError ? (
                <ErrorState onRetry={() => refetchPerms()} />
              ) : filteredPermissions.length === 0 ? (
                <EmptyState
                  icon={<KeyRound className="h-6 w-6" />}
                  title={permSearch ? "No permissions match your search" : "No permissions found"}
                  subtitle={permSearch ? "Try a different search term." : "Permissions granted to roles across organizations will appear here."}
                />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resource</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Used by Roles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedPermissions.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-sm font-medium">{p.resource}</TableCell>
                          <TableCell className="text-sm">{p.action}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{p.group?.name ?? "—"}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[260px] truncate text-sm text-muted-foreground">
                            {p.description ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm">{p._count.rolePermissions}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination page={permPage} totalPages={permTotalPages} onChange={setPermPage} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-0">
              {groupsLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : groupsError ? (
                <ErrorState onRetry={() => refetchGroups()} />
              ) : groups.length === 0 ? (
                <EmptyState
                  icon={<ShieldCheck className="h-6 w-6" />}
                  title="No permission groups found"
                  subtitle="Permission groups bundle related permissions together."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Permissions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{g.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{g.slug}</TableCell>
                        <TableCell className="max-w-[320px] truncate text-sm text-muted-foreground">
                          {g.description ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">{g._count.permissions}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
