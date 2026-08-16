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
import { KeyRound, Search, AlertCircle, RefreshCw, Layers } from "lucide-react";

export const Route = createFileRoute("/super-admin/permissions")({
  head: () => ({ meta: [{ title: "Permissions — Super Admin — Acme ERP" }] }),
  component: () => (
    <RequireSuperAdmin>
      <SuperAdminPermissions />
    </RequireSuperAdmin>
  ),
});

type Permission = {
  id: string;
  resource: string;
  action: string;
  description: string | null;
  group: { id: string; name: string; slug: string } | null;
  _count: { rolePermissions: number };
};

type PermissionGroup = {
  id: string;
  name: string;
  slug: string;
  _count: { permissions: number };
};

function SuperAdminPermissions() {
  const [tab, setTab] = useState("permissions");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["super-admin-permissions", search],
    queryFn: () =>
      api.get<{ data: Permission[]; meta: { total: number } }>("/super-admin/permissions", {
        params: { search, limit: "500" },
      }),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["super-admin-permission-groups"],
    queryFn: () => api.get<PermissionGroup[]>("/super-admin/permission-groups"),
  });

  const perms = useMemo(() => data?.data ?? [], [data]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader title="Permissions" subtitle="Platform permission catalog" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="permissions" className="gap-1.5"><KeyRound className="h-4 w-4" /> Permissions</TabsTrigger>
          <TabsTrigger value="groups" className="gap-1.5"><Layers className="h-4 w-4" /> Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="mt-4 space-y-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-9 pl-9" placeholder="Search resource, action…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-semibold">Failed to load permissions</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry</Button>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permission</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead className="text-center">Roles using it</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perms.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="py-12 text-center text-muted-foreground">No permissions found</TableCell></TableRow>
                    ) : (
                      perms.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="flex items-center gap-2 font-mono text-xs font-medium">
                              <span className="text-primary">{p.resource}</span>
                              <span className="text-muted-foreground">:</span>
                              <span>{p.action}</span>
                            </div>
                            {p.description && <div className="text-xs text-muted-foreground">{p.description}</div>}
                          </TableCell>
                          <TableCell><Badge variant="secondary" className="text-[10px]">{p.group?.name ?? "—"}</Badge></TableCell>
                          <TableCell className="text-center text-sm">{p._count.rolePermissions}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="groups" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <Card key={g.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base capitalize">{g.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{g.slug}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <Badge variant="secondary">{g._count.permissions} permissions</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
