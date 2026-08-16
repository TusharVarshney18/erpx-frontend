import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Separator } from "@/components/ui/separator";
import {
  History,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  Filter,
  Clock,
  User,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/audit-log")({
  head: () => ({ meta: [{ title: "Audit Log — Acme ERP" }] }),
  component: AuditLogPage,
});

type AuditEntry = {
  id: string;
  event: string;
  resource: string;
  resourceId: string | null;
  action: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  severity: string;
  createdAt: string;
  actor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

const EVENT_COLORS: Record<string, string> = {
  user_login: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  user_logout: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
  user_created: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  user_deleted: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  role_created: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  role_updated: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  permission_updated: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  settings_updated: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

const SEVERITY_COLORS: Record<string, string> = {
  INFO: "bg-muted text-muted-foreground",
  WARNING: "bg-warning/15 text-warning",
  WARN: "bg-warning/15 text-warning",
  ERROR: "bg-destructive/15 text-destructive",
  CRITICAL: "bg-destructive/20 text-destructive font-bold",
};

function AuditLogPage() {
  const { activeOrganizationId } = useAuth();
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-audit-log", activeOrganizationId, page],
    queryFn: () =>
      api.get<AuditEntry[]>(
        `/audit-logs?page=${page}&limit=${pageSize}&sortBy=createdAt&sortOrder=desc`,
      ),
    enabled: !!activeOrganizationId,
  });

  const entries = data ?? [];

  const filtered = useMemo(() => {
    let result = entries;
    if (eventFilter !== "all") {
      result = result.filter((e) => e.event === eventFilter);
    }
    if (severityFilter !== "all") {
      result = result.filter((e) => e.severity === severityFilter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.event.toLowerCase().includes(s) ||
          e.resource.toLowerCase().includes(s) ||
          e.action.toLowerCase().includes(s) ||
          (e.actor &&
            `${e.actor.firstName} ${e.actor.lastName}`.toLowerCase().includes(s)) ||
          (e.details && JSON.stringify(e.details).toLowerCase().includes(s)),
      );
    }
    return result;
  }, [entries, search, eventFilter, severityFilter]);

  const events = useMemo(() => {
    const set = new Set(entries.map((e) => e.event));
    return Array.from(set).sort();
  }, [entries]);

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const getEventBadge = (event: string) => {
    const color = EVENT_COLORS[event] ?? "bg-muted text-muted-foreground";
    return (
      <Badge className={`${color} text-xs font-normal border-0`}>
        {event.replace(/_/g, " ")}
      </Badge>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Audit Log"
        subtitle="Track all administrative actions in your organization"
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <div className="relative min-w-0 flex-[2]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search audit log…"
            className="h-9 border-0 bg-muted/50 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="h-9 w-40 border-0 bg-muted/50">
              <SelectValue placeholder="Event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event} value={event}>
                  {event.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="h-9 w-36 border-0 bg-muted/50">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
              <SelectItem value="WARNING">Warning</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-semibold">Failed to load audit log</p>
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
                <History className="h-6 w-6" />
              </div>
              <p className="font-semibold">
                {search || eventFilter !== "all" || severityFilter !== "all"
                  ? "No entries match your filters"
                  : "No audit log entries yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {search || eventFilter !== "all" || severityFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "Audit entries will appear here as actions are performed."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDateTime(entry.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>{getEventBadge(entry.event)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="capitalize">{entry.resource.replace(/_/g, " ")}</span>
                        {entry.resourceId && (
                          <code className="text-[10px] text-muted-foreground">
                            #{entry.resourceId.slice(0, 8)}
                          </code>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.actor ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {entry.actor.firstName} {entry.actor.lastName}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">System</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${SEVERITY_COLORS[entry.severity] ?? "bg-muted text-muted-foreground"} text-xs border-0`}
                      >
                        {entry.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.details ? (
                        <div className="relative group">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              toast.info(
                                <pre className="max-w-md overflow-auto whitespace-pre-wrap text-xs">
                                  {JSON.stringify(entry.details, null, 2)}
                                </pre>,
                                { duration: 5000 },
                              );
                            }}
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!isLoading && entries.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing page {page} ({filtered.length} entries)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={entries.length < pageSize}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
