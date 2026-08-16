import { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { RequireSuperAdmin } from "@/components/guards/RequireSuperAdmin";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Users,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Inbox,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/super-admin/users")({
  head: () => ({ meta: [{ title: "All Users — Super Admin — Acme ERP" }] }),
  component: () => (
    <RequireSuperAdmin>
      <SuperAdminUsers />
    </RequireSuperAdmin>
  ),
});

type SAUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    code: string;
  };
  userRoles: {
    role: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
};

const PAGE_SIZE = 20;

function SuperAdminUsers() {
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: users = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["super-admin-users"],
    queryFn: () =>
      api.get<SAUser[]>(
        `/super-admin/users?limit=500`,
      ),
  });

  const { data: allOrgs = [] } = useQuery({
    queryKey: ["super-admin-orgs-simple"],
    queryFn: async () => {
      const orgs = await api.get<{ id: string; name: string; code: string; status: string }[]>(
        "/super-admin/organizations?limit=500",
      );
      return orgs.map((o) => ({ id: o.id, name: o.name }));
    },
  });

  const filtered = useMemo(() => {
    let list = users;
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s),
      );
    }
    if (orgFilter !== "all") {
      list = list.filter((u) => u.organization.id === orgFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((u) => u.status === statusFilter);
    }
    return list;
  }, [users, search, orgFilter, statusFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageUsers = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const initials = (u: SAUser) =>
    `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase();

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—";

  const roleName = (u: SAUser) =>
    u.userRoles?.length ? u.userRoles[0].role.name : "—";

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const delta = 2;
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    pages.push(1);
    if (left > 2) pages.push("ellipsis");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("ellipsis");
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="All Users"
        subtitle={`${total} users across all organizations`}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            className="h-9 border-0 bg-muted/50 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={orgFilter} onValueChange={(v) => { setOrgFilter(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="Organization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            {allOrgs.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INVITED">Invited</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="DISABLED">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-semibold">Failed to load users</p>
              <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
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
                {search || orgFilter !== "all" || statusFilter !== "all"
                  ? "No users match your filters"
                  : "No users yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {search || orgFilter !== "all" || statusFilter !== "all"
                  ? "Try different search terms or filters."
                  : "Users will appear here once they sign up."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{initials(user)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-muted-foreground">Joined {formatDate(user.createdAt)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {user.organization.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs font-normal">{roleName(user)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.status === "ACTIVE" ? "default" : "secondary"}
                        className={
                          user.status === "ACTIVE"
                            ? "bg-success/15 text-success"
                            : user.status === "SUSPENDED"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-muted text-muted-foreground"
                        }
                      >
                        {user.status === "ACTIVE"
                          ? "Active"
                          : user.status === "SUSPENDED"
                            ? "Suspended"
                            : user.status === "INVITED"
                              ? "Invited"
                              : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(user.lastLoginAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {getPageNumbers().map((p, i) =>
              p === "ellipsis" ? (
                <PaginationItem key={`e-${i}`}>
                  <span className="flex h-9 w-9 items-center justify-center text-sm">...</span>
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={page === p}
                    onClick={() => setPage(p)}
                    className="cursor-pointer"
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
