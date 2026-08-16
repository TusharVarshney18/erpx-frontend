import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { RequireSuperAdmin } from "@/components/guards/RequireSuperAdmin";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Shield, Search, AlertCircle, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/super-admin/roles")({
  head: () => ({ meta: [{ title: "Roles — Super Admin — Acme ERP" }] }),
  component: () => (
    <RequireSuperAdmin>
      <SuperAdminRoles />
    </RequireSuperAdmin>
  ),
});

type Role = {
  id: string;
  name: string;
  slug: string;
  isSystem: boolean;
  isOwner: boolean;
  organization: { id: string; name: string; code: string } | null;
  _count: { userRoles: number; rolePermissions: number };
};

function SuperAdminRoles() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["super-admin-roles", search, page],
    queryFn: () =>
      api.get<{ data: Role[]; meta: { total: number; page: number; totalPages: number } }>(
        "/super-admin/roles",
        { params: { search, page: String(page), limit: "50" } },
      ),
  });

  const roles = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader title="Roles" subtitle="Roles across all organizations" />

      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-9 pl-9" placeholder="Search roles…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="font-semibold">Failed to load roles</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry</Button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Members</TableHead>
                  <TableHead className="text-center">Permissions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">No roles found</TableCell></TableRow>
                ) : (
                  roles.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium">
                          {r.isOwner && <Shield className="h-4 w-4 text-primary" />}
                          {r.name}
                        </div>
                        <div className="text-xs text-muted-foreground">{r.slug}</div>
                      </TableCell>
                      <TableCell className="text-sm">{r.organization?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={r.isSystem ? "default" : "secondary"} className="text-[10px]">
                          {r.isOwner ? "Owner" : r.isSystem ? "System" : "Custom"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">{r._count.userRoles}</TableCell>
                      <TableCell className="text-center text-sm">{r._count.rolePermissions}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{meta.total} roles</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="px-2 py-1.5">Page {meta.page} of {meta.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
