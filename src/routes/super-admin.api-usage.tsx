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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/super-admin/api-usage")({
  head: () => ({ meta: [{ title: "API Usage — Super Admin — ERPX" }] }),
  component: () => (
    <RequireSuperAdmin>
      <SuperAdminApiUsage />
    </RequireSuperAdmin>
  ),
});

type OrgUsage = {
  organizationId: string;
  organizationName: string;
  totalRequests: number;
  uniqueEndpoints: number;
  lastRequestAt: string;
  topEndpoints: { path: string; count: number }[];
};

type ApiUsageSummary = {
  totalRequests: number;
  totalOrganizations: number;
  periodStart: string;
  periodEnd: string;
  orgUsage: OrgUsage[];
}

function SuperAdminApiUsage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"requests" | "org">("requests");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["super-admin-api-usage"],
    queryFn: () => api.get<ApiUsageSummary>("/super-admin/api-usage"),
  });

  const usage = data?.orgUsage ?? [];

  const filtered = useMemo(() => {
    let list = usage;
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((u) =>
        u.organizationName.toLowerCase().includes(s)
      );
    }
    return [...list].sort((a, b) =>
      sortBy === "requests"
        ? b.totalRequests - a.totalRequests
        : a.organizationName.localeCompare(b.organizationName)
    );
  }, [usage, search, sortBy]);

  const chartData = useMemo(
    () =>
      filtered.slice(0, 10).map((u) => ({
        name: u.organizationName.length > 15
          ? u.organizationName.slice(0, 15) + "..."
          : u.organizationName,
        requests: u.totalRequests,
      })),
    [filtered]
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="API Usage"
        subtitle={
          data
            ? `${(data.totalRequests / 1000).toFixed(1)}K requests across ${data.totalOrganizations} orgs`
            : "Monitor API consumption across organizations"
        }
      />

      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Total Requests</p>
              <p className="mt-1 text-2xl font-bold">
                {data.totalRequests.toLocaleString("en-IN")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Active Organizations</p>
              <p className="mt-1 text-2xl font-bold">{data.totalOrganizations}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Period</p>
              <p className="mt-1 text-sm font-medium">
                {format(new Date(data.periodStart), "MMM dd")} –{" "}
                {format(new Date(data.periodEnd), "MMM dd, yyyy")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Organizations by Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [value.toLocaleString("en-IN"), "Requests"]}
                  />
                  <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search organizations…"
            className="h-9 border-0 bg-muted/50 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as "requests" | "org")}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="requests">Requests (high)</SelectItem>
            <SelectItem value="org">Organization (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-semibold">Failed to load API usage data</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Activity className="h-6 w-6" />
              </div>
              <p className="font-semibold">
                {search ? "No organizations match your search" : "No API usage data"}
              </p>
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Try a different search term."
                  : "Data will appear once organizations start using the API."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Total Requests</TableHead>
                  <TableHead>Unique Endpoints</TableHead>
                  <TableHead>Last Request</TableHead>
                  <TableHead>Top Endpoints</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((org) => (
                  <TableRow key={org.organizationId}>
                    <TableCell className="font-medium">{org.organizationName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          {org.totalRequests.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{org.uniqueEndpoints}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(org.lastRequestAt), "MMM dd, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {org.topEndpoints.slice(0, 3).map((ep) => (
                          <Badge key={ep.path} variant="secondary" className="text-[10px] font-mono">
                            {ep.path.split("/").pop()}
                            <span className="ml-1 text-muted-foreground">({ep.count})</span>
                          </Badge>
                        ))}
                        {org.topEndpoints.length > 3 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{org.topEndpoints.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
