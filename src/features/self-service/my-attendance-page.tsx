import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  isSameMonth,
  isToday,
  isWeekend,
  startOfDay,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Clock, LogIn, LogOut, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { browserLocation, selfServiceApi, type AttendanceRecord } from "@/lib/api/self-service";
import { formatDuration, useMyEmployee, workedMinutes } from "./use-my-employee";
import { NotLinkedCard } from "./not-linked-card";

const STATUS_STYLE: Record<string, { dot: string; cell: string; label: string }> = {
  PRESENT: { dot: "bg-success", cell: "bg-success/10 text-success", label: "Present" },
  HALF_DAY: { dot: "bg-warning", cell: "bg-warning/10 text-warning", label: "Half day" },
  ABSENT: { dot: "bg-destructive", cell: "bg-destructive/10 text-destructive", label: "Absent" },
  LEAVE: { dot: "bg-info", cell: "bg-info/10 text-info", label: "Leave" },
};

function dayKey(record: AttendanceRecord): string {
  if (record.checkIn) return format(new Date(record.checkIn), "yyyy-MM-dd");
  return record.date.slice(0, 10);
}

function timeOf(iso: string | null): string {
  return iso ? format(new Date(iso), "hh:mm a") : "—";
}

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function MyAttendancePage() {
  const { orgId, employee, isLoading } = useMyEmployee();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <PageHeader
        title="My Attendance"
        subtitle={
          employee
            ? `${employee.firstName} ${employee.lastName} · ${employee.employeeCode}${
                employee.department ? ` · ${employee.department.name}` : ""
              }`
            : "Check in, check out and track your month"
        }
      />
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : !employee || !orgId ? (
        <NotLinkedCard action="check in and see your attendance" />
      ) : (
        <>
          <TodayCard orgId={orgId} />
          <MonthView orgId={orgId} month={month} onMonthChange={setMonth} />
        </>
      )}
    </div>
  );
}

function TodayCard({ orgId }: { orgId: string }) {
  const qc = useQueryClient();
  const now = useNow();
  const today = useQuery({
    queryKey: ["self", "attendance", "today", orgId],
    queryFn: () => selfServiceApi.today(orgId),
    refetchInterval: 60_000,
  });

  const policy = useQuery({
    queryKey: ["self", "attendance", "policy", orgId],
    queryFn: () => selfServiceApi.policy(orgId),
    staleTime: 5 * 60_000,
  });
  // Geofenced companies need the browser location; selfie mode is mobile-only.
  const punchBlocked =
    policy.data?.mode === "DISABLED"
      ? "Self check-in is turned off for your company. HR records attendance."
      : policy.data?.requiresSelfie
        ? "Your company requires a selfie at check-in. Use the ERPX mobile app."
        : null;
  const location = () => (policy.data?.requiresLocation ? browserLocation() : Promise.resolve({}));

  const refresh = () => qc.invalidateQueries({ queryKey: ["self", "attendance"] });
  const checkIn = useMutation({
    mutationFn: async () => selfServiceApi.checkIn(orgId, await location()),
    onSuccess: () => {
      toast.success("Checked in. Have a productive day!");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message || "Could not check in"),
  });
  const checkOut = useMutation({
    mutationFn: async () => selfServiceApi.checkOut(orgId, await location()),
    onSuccess: () => {
      toast.success("Checked out. See you tomorrow!");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message || "Could not check out"),
  });

  const record = today.data ?? null;
  const state = !record ? "out" : record.checkOut ? "done" : "in";
  const minutes = record ? workedMinutes(record, now) : 0;

  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-primary" />
      <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">{format(now, "EEEE, d MMMM yyyy")}</p>
            <p className="text-4xl font-bold tabular-nums tracking-tight">
              {format(now, "hh:mm a")}
            </p>
          </div>
          <div className="grid max-w-md grid-cols-3 gap-3">
            <Stat label="Check in" value={timeOf(record?.checkIn ?? null)} />
            <Stat label="Check out" value={timeOf(record?.checkOut ?? null)} />
            <Stat label="Worked" value={record ? formatDuration(minutes) : "—"} />
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 md:min-w-[220px]">
          {today.isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : punchBlocked && state !== "done" ? (
            <p className="rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              {punchBlocked}
            </p>
          ) : state === "out" ? (
            <Button
              size="lg"
              className="h-12 text-base"
              onClick={() => checkIn.mutate()}
              disabled={checkIn.isPending}
            >
              <LogIn className="mr-2 h-5 w-5" /> {checkIn.isPending ? "Checking in…" : "Check in"}
            </Button>
          ) : state === "in" ? (
            <Button
              size="lg"
              variant="destructive"
              className="h-12 text-base"
              onClick={() => checkOut.mutate()}
              disabled={checkOut.isPending}
            >
              <LogOut className="mr-2 h-5 w-5" />{" "}
              {checkOut.isPending ? "Checking out…" : "Check out"}
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
              <CheckCircle2 className="h-5 w-5" /> Day complete
            </div>
          )}
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {state === "in"
              ? "You're checked in — timer running"
              : state === "done"
                ? "Attendance recorded for today"
                : "Not checked in yet"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function MonthView({
  orgId,
  month,
  onMonthChange,
}: {
  orgId: string;
  month: Date;
  onMonthChange: (d: Date) => void;
}) {
  const from = startOfMonth(month);
  const to = endOfMonth(month);
  const records = useQuery({
    queryKey: ["self", "attendance", "month", orgId, format(month, "yyyy-MM")],
    queryFn: () => selfServiceApi.attendance(orgId, from.toISOString(), to.toISOString()),
  });

  const byDay = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const r of records.data ?? []) map.set(dayKey(r), r);
    return map;
  }, [records.data]);

  const summary = useMemo(() => {
    const s = { present: 0, halfDay: 0, absent: 0, leave: 0, minutes: 0, worked: 0, unmarked: 0 };
    for (const r of byDay.values()) {
      if (r.status === "PRESENT") s.present += 1;
      else if (r.status === "HALF_DAY") s.halfDay += 1;
      else if (r.status === "ABSENT") s.absent += 1;
      else if (r.status === "LEAVE") s.leave += 1;
      if (r.checkIn && r.checkOut) {
        s.minutes += workedMinutes(r);
        s.worked += 1;
      }
    }
    const todayStart = startOfDay(new Date());
    for (const d of eachDayOfInterval({ start: from, end: to })) {
      if (isWeekend(d) || !isAfter(todayStart, d)) continue;
      if (!byDay.has(format(d, "yyyy-MM-dd"))) s.unmarked += 1;
    }
    return s;
  }, [byDay, from, to]);

  const days = eachDayOfInterval({
    start: startOfWeek(from, { weekStartsOn: 1 }),
    end: endOfWeek(to, { weekStartsOn: 1 }),
  });
  const isCurrentMonth = isSameMonth(month, new Date());

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">{format(month, "MMMM yyyy")}</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous month"
              onClick={() => onMonthChange(addMonths(month, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isCurrentMonth}
              onClick={() => onMonthChange(startOfMonth(new Date()))}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Next month"
              disabled={isCurrentMonth}
              onClick={() => onMonthChange(addMonths(month, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase text-muted-foreground">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          {records.isLoading ? (
            <Skeleton className="mt-1 h-72 w-full" />
          ) : (
            <div className="mt-1 grid grid-cols-7 gap-1">
              {days.map((d) => {
                const key = format(d, "yyyy-MM-dd");
                const record = byDay.get(key);
                const inMonth = isSameMonth(d, month);
                const style = record ? STATUS_STYLE[record.status] : undefined;
                const title = record
                  ? `${style?.label ?? record.status} · in ${timeOf(record.checkIn)} · out ${timeOf(record.checkOut)}`
                  : isWeekend(d)
                    ? "Weekend"
                    : undefined;
                return (
                  <div
                    key={key}
                    title={title}
                    className={cn(
                      "flex aspect-square min-h-[44px] flex-col items-center justify-center rounded-lg text-sm",
                      !inMonth && "opacity-30",
                      style?.cell ?? (isWeekend(d) ? "bg-muted/50 text-muted-foreground" : ""),
                      isToday(d) && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                    )}
                  >
                    <span className="font-medium tabular-nums">{format(d, "d")}</span>
                    {record?.checkIn && inMonth && (
                      <span className="hidden text-[10px] tabular-nums sm:block">
                        {format(new Date(record.checkIn), "HH:mm")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {Object.values(STATUS_STYLE).map((s) => (
              <span key={s.label} className="flex items-center gap-1.5">
                <span className={cn("h-2.5 w-2.5 rounded-full", s.dot)} /> {s.label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Monthly summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SummaryRow label="Present" value={summary.present} dot="bg-success" />
          <SummaryRow label="Half day" value={summary.halfDay} dot="bg-warning" />
          <SummaryRow label="Leave" value={summary.leave} dot="bg-info" />
          <SummaryRow label="Absent" value={summary.absent} dot="bg-destructive" />
          <SummaryRow
            label="Unmarked weekdays"
            value={summary.unmarked}
            dot="bg-muted-foreground/40"
          />
          <div className="grid grid-cols-2 gap-3 border-t pt-3">
            <Stat label="Total hours" value={formatDuration(summary.minutes)} />
            <Stat
              label="Avg / day"
              value={summary.worked ? formatDuration(summary.minutes / summary.worked) : "—"}
            />
          </div>
          {summary.unmarked > 0 && (
            <Badge
              variant="secondary"
              className="w-full justify-center bg-warning/10 py-1.5 text-warning"
            >
              {summary.unmarked} past weekday{summary.unmarked === 1 ? "" : "s"} without attendance
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryRow({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className={cn("h-2.5 w-2.5 rounded-full", dot)} /> {label}
      </span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
