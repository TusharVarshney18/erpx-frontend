import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, LineChart as LineIcon, Trophy } from "lucide-react";
import { formatINR, formatINRCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Panel, PanelEmpty, Segmented } from "./panel";

export interface MonthPoint {
  month: string;
  value: number;
}

const RANGES = ["3M", "6M", "YTD"] as const;
type Range = (typeof RANGES)[number];

/**
 * Sales booked per month for the current calendar year. Every number here is
 * computed from the API series — nothing is estimated or synthesised.
 */
export function RevenuePerformance({ points }: { points: MonthPoint[] }) {
  const [range, setRange] = useState<Range>("YTD");

  // Backend returns Jan–Dec; months after the current one are always zero.
  const elapsed = useMemo(() => points.slice(0, new Date().getMonth() + 1), [points]);

  const visible = useMemo(() => {
    if (range === "3M") return elapsed.slice(-3);
    if (range === "6M") return elapsed.slice(-6);
    return elapsed;
  }, [elapsed, range]);

  const stats = useMemo(() => {
    const total = visible.reduce((s, p) => s + p.value, 0);
    const current = elapsed.at(-1)?.value ?? 0;
    const previous = elapsed.at(-2)?.value ?? 0;
    const change = previous > 0 ? ((current - previous) / previous) * 100 : null;
    const best = visible.reduce<MonthPoint | null>(
      (b, p) => (p.value > (b?.value ?? 0) ? p : b),
      null,
    );
    const active = visible.filter((p) => p.value > 0).length;
    return { total, current, change, best, avg: active ? total / active : 0 };
  }, [visible, elapsed]);

  const hasData = elapsed.some((p) => p.value > 0);
  const year = new Date().getFullYear();
  const up = (stats.change ?? 0) >= 0;

  return (
    <Panel
      title="Sales performance"
      subtitle={`Sales orders booked · ${year}`}
      icon={LineIcon}
      action={<Segmented value={range} options={RANGES} onChange={setRange} />}
    >
      {!hasData ? (
        <PanelEmpty>No sales orders booked this year yet.</PanelEmpty>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                {range === "YTD" ? "Year to date" : `Last ${range.replace("M", " months")}`}
              </div>
              <div className="mt-1 flex items-center gap-2.5">
                <span className="font-display text-[32px] font-bold leading-none tracking-tight tabular-nums">
                  {formatINRCompact(stats.total)}
                </span>
                {stats.change !== null && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset",
                      up
                        ? "bg-success/10 text-success ring-success/20"
                        : "bg-destructive/10 text-destructive ring-destructive/20",
                    )}
                    title="This month (to date) vs last month"
                  >
                    {up ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                    {Math.abs(stats.change).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <Stat label="This month" value={formatINRCompact(stats.current)} />
            <Stat label="Monthly average" value={formatINRCompact(stats.avg)} />
            {stats.best && (
              <Stat
                label="Best month"
                value={`${stats.best.month} · ${formatINRCompact(stats.best.value)}`}
                icon={<Trophy className="h-3.5 w-3.5 text-amber-500" />}
              />
            )}
          </div>

          <div className="-mx-2 mt-6 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visible} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="perfStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--primary-3)" />
                    <stop offset="60%" stopColor="var(--chart-1)" />
                    <stop offset="100%" stopColor="var(--primary-2)" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 6" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={11}
                  stroke="var(--muted-foreground)"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  fontSize={11}
                  stroke="var(--muted-foreground)"
                  tickFormatter={(v: number) => formatINRCompact(v)}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: "var(--chart-1)", strokeOpacity: 0.3, strokeDasharray: "4 4" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="url(#perfStroke)"
                  strokeWidth={2.5}
                  fill="url(#perfFill)"
                  activeDot={{ r: 5, strokeWidth: 3, stroke: "var(--card)", fill: "var(--chart-1)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Panel>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="border-l border-border pl-5">
      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-[15px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover/95 px-3 py-2 shadow-dropdown backdrop-blur-xl">
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums">
        {formatINR(Number(payload[0].value ?? 0))}
      </div>
    </div>
  );
}
