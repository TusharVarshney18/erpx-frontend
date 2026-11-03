import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays, format, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useActiveOrgId } from "@/features/self-service/use-my-employee";

type DailyStatus =
  | "PRESENT"
  | "LATE"
  | "HALF_DAY"
  | "ON_LEAVE"
  | "HOLIDAY"
  | "WEEKEND"
  | "ABSENT"
  | "NOT_CHECKED_IN";

type DailyRow = {
  employeeId: string;
  employeeCode: string;
  name: string;
  department: string | null;
  designation: string | null;
  status: DailyStatus;
  checkIn: string | null;
  checkOut: string | null;
  isLate: boolean;
  leaveType: string | null;
  source: string | null;
};

type DailyAttendance = {
  date: string;
  rows: DailyRow[];
  totals: Partial<Record<DailyStatus, number>>;
};
type Department = { id: string; name: string };

const STATUS: Record<DailyStatus, { label: string; className: string }> = {
  PRESENT: { label: "Present", className: "bg-success/10 text-success border-success/30" },
  LATE: { label: "Late", className: "bg-warning/10 text-warning border-warning/30" },
  HALF_DAY: { label: "Half day", className: "bg-warning/10 text-warning border-warning/30" },
  ON_LEAVE: { label: "On leave", className: "bg-info/10 text-info border-info/30" },
  HOLIDAY: { label: "Holiday", className: "bg-muted text-muted-foreground" },
  WEEKEND: { label: "Weekend", className: "bg-muted text-muted-foreground" },
  ABSENT: {
    label: "Absent",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
  NOT_CHECKED_IN: { label: "Not checked in", className: "bg-muted text-muted-foreground" },
};

const ALL = "__all__";

function time(iso: string | null) {
  return iso ? format(new Date(iso), "hh:mm a") : "";
}

function hours(r: DailyRow) {
  if (!r.checkIn || !r.checkOut) return "";
  const m = Math.max(0, Math.round((+new Date(r.checkOut) - +new Date(r.checkIn)) / 60000));
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

function csvCell(v: string) {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function downloadCsv(date: string, rows: DailyRow[]) {
  const header = [
    "Date",
    "Employee code",
    "Name",
    "Department",
    "Designation",
    "Status",
    "Late",
    "Check in",
    "Check out",
    "Worked",
    "Leave type",
    "Source",
  ];
  const lines = rows.map((r) =>
    [
      date,
      r.employeeCode,
      r.name,
      r.department ?? "",
      r.designation ?? "",
      STATUS[r.status].label,
      r.isLate ? "Yes" : "No",
      time(r.checkIn),
      time(r.checkOut),
      hours(r),
      r.leaveType ?? "",
      r.source ?? "",
    ]
      .map(csvCell)
      .join(","),
  );
  // BOM so Excel opens UTF-8 names correctly.
  const blob = new Blob(["﻿" + [header.join(","), ...lines].join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `attendance-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * HR / Admin daily board: one row per active employee with the day's status
 * (present, late, absent, on leave…). The backend scopes it: HR/Admin see
 * everyone, a line manager only their team.
 */
export function AttendanceBoard() {
  const orgId = useActiveOrgId();
  const [day, setDay] = useState(() => new Date());
  const [departmentId, setDepartmentId] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [search, setSearch] = useState("");
  const dateKey = format(day, "yyyy-MM-dd");

  const departments = useQuery({
    queryKey: ["departments", orgId],
    enabled: !!orgId,
    staleTime: 5 * 60_000,
    queryFn: () => api.get<Department[]>(`/hrms/organizations/${orgId}/departments`),
  });

  const board = useQuery({
    queryKey: ["attendance", "daily", orgId, dateKey, departmentId],
    enabled: !!orgId,
    refetchInterval: isToday(day) ? 60_000 : false,
    queryFn: () =>
      api.get<DailyAttendance>(`/hrms/organizations/${orgId}/attendance/daily`, {
        params: { date: dateKey, ...(departmentId !== ALL && { departmentId }) },
      }),
  });

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (board.data?.rows ?? []).filter(
      (r) =>
        (status === ALL || r.status === status) &&
        (!needle || `${r.name} ${r.employeeCode}`.toLowerCase().includes(needle)),
    );
  }, [board.data, status, search]);
  const totals = board.data?.totals ?? {};
  const present = (totals.PRESENT ?? 0) + (totals.LATE ?? 0) + (totals.HALF_DAY ?? 0);

  const summary: { label: string; value: number; key?: DailyStatus }[] = [
    { label: "Employees", value: board.data?.rows.length ?? 0 },
    { label: "Present", value: present, key: "PRESENT" },
    { label: "Late", value: totals.LATE ?? 0, key: "LATE" },
    { label: "On leave", value: totals.ON_LEAVE ?? 0, key: "ON_LEAVE" },
    isToday(day)
      ? { label: "Not checked in", value: totals.NOT_CHECKED_IN ?? 0, key: "NOT_CHECKED_IN" }
      : { label: "Absent", value: totals.ABSENT ?? 0, key: "ABSENT" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous day"
            onClick={() => setDay((d) => addDays(d, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            type="date"
            className="w-[160px]"
            value={dateKey}
            max={format(new Date(), "yyyy-MM-dd")}
            onChange={(e) => e.target.value && setDay(new Date(`${e.target.value}T00:00:00`))}
          />
          <Button
            variant="outline"
            size="icon"
            aria-label="Next day"
            disabled={isToday(day)}
            onClick={() => setDay((d) => addDays(d, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All departments</SelectItem>
            {(departments.data ?? []).map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {(Object.keys(STATUS) as DailyStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search name or code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          disabled={!rows.length}
          onClick={() => downloadCsv(dateKey, rows)}
        >
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {summary.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setStatus(s.key && status !== s.key ? s.key : ALL)}
            className={cn(
              "rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/50",
              s.key && status === s.key && "border-primary",
            )}
          >
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-semibold tabular-nums">{board.isLoading ? "–" : s.value}</p>
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {board.isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : board.error ? (
            <p className="p-6 text-sm text-destructive">
              {(board.error as Error).message || "Couldn't load attendance."}
            </p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No employees match these filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check in</TableHead>
                  <TableHead>Check out</TableHead>
                  <TableHead className="hidden sm:table-cell">Worked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.employeeId}>
                    <TableCell>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {[r.employeeCode, r.designation].filter(Boolean).join(" · ")}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{r.department ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS[r.status].className}>
                        {STATUS[r.status].label}
                        {r.status === "ON_LEAVE" && r.leaveType
                          ? ` · ${r.leaveType.toLowerCase()}`
                          : ""}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{time(r.checkIn) || "—"}</TableCell>
                    <TableCell className="tabular-nums">{time(r.checkOut) || "—"}</TableCell>
                    <TableCell className="hidden tabular-nums sm:table-cell">
                      {hours(r) || "—"}
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
