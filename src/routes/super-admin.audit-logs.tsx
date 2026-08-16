import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  ScrollArea,
  ScrollBar,
} from "@/components/ui/scroll-area";
import {
  Search,
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw,
  CalendarIcon,
  X,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/super-admin/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs — Super Admin — ERPX" }] }),
  component: () => (
    <RequireSuperAdmin>
      <SuperAdminAuditLogs />
    </RequireSuperAdmin>
  ),
});

type AuditLog = {
  id: string;
  event: string;
  resource: string;
  resourceId: string;
  actor: { id: string; name: string; email: string };
  organization: { id: string; name: string };
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
};

type PaginatedLogs = {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const EVENT_TYPES = [
  "user.login",
  "user.logout",
  "user.created",
  "user.updated",
  "user.deleted",
  "org.created",
  "org.updated",
  "org.status_changed",
  "subscription.created",
  "subscription.updated",
  "subscription.cancelled",
  "role.created",
  "role.updated",
  "permission.updated",
  "settings.updated",
  "api.key_created",
  "api.key_revoked",
  "data.exported",
  "data.imported",
  "system.config_changed",
];

const PAGE_SIZE = 25;

function SuperAdminAuditLogs() {
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", String(PAGE_SIZE));
  if (eventFilter !== "all") queryParams.set("event", eventFilter);
  if (dateFrom) queryParams.set("from", dateFrom.toISOString());
  if (dateTo) queryParams.set("to", dateTo.toISOString());
  if (search.trim()) queryParams.set("q", search.trim());

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["super-admin-audit-logs", page, eventFilter, dateFrom, dateTo, search],
    queryFn: () =>
      api.get<PaginatedLogs>(`/super-admin/audit-logs?${queryParams.toString()}`),
  });

  const logs = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const clearFilters = () => {
    setEventFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearch("");
    setPage(1);
  };

  const hasFilters = eventFilter !== "all" || dateFrom || dateTo || search.trim();

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
        title="Audit Logs"
        subtitle={`${total} events recorded`}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events, actors, resources…"
            className="h-9 border-0 bg-muted/50 pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={eventFilter} onValueChange={(v) => { setEventFilter(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {EVENT_TYPES.map((evt) => (
              <SelectItem key={evt} value={evt}>
                {evt.replace(/\./g, " · ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 justify-start text-left font-normal",
                !dateFrom && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={(d) => { setDateFrom(d); setPage(1); }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 justify-start text-left font-normal",
                !dateTo && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, "MMM dd, yyyy") : "To"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={(d) => { setDateTo(d); setPage(1); }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-9" onClick={clearFilters}>
            <X className="mr-1.5 h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-semibold">Failed to load audit logs</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <History className="h-6 w-6" />
              </div>
              <p className="font-semibold">
                {hasFilters ? "No logs match your filters" : "No audit logs yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {hasFilters
                  ? "Try different search terms or filters."
                  : "Audit logs will appear here as events occur."}
              </p>
            </div>
          ) : (
            <ScrollArea>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Timestamp</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), "MMM dd, HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          {log.event}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-sm">
                        {log.resource}
                        <span className="text-xs text-muted-foreground">
                          #{log.resourceId.slice(0, 8)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col">
                          <span>{log.actor.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {log.actor.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.organization.name}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {log.details && Object.keys(log.details).length > 0 ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                View
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                              <div className="space-y-1">
                                {Object.entries(log.details).map(([k, v]) => (
                                  <div key={k} className="flex justify-between gap-2 text-xs">
                                    <span className="font-medium text-muted-foreground">{k}:</span>
                                    <span className="max-w-[200px] truncate text-right">
                                      {typeof v === "object" ? JSON.stringify(v) : String(v)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
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
              )
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
