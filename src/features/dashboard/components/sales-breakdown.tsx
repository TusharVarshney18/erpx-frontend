import { motion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Link } from "@tanstack/react-router";
import { Package, PieChart as PieIcon } from "lucide-react";
import { formatINR, formatINRCompact } from "@/lib/format";
import { Panel, PanelEmpty } from "./panel";

export interface NamedValue {
  name: string;
  value: number;
}

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

/** Ranked list of best-selling products by revenue, with share-of-top bars. */
export function TopProducts({ items }: { items: NamedValue[] }) {
  const rows = items.filter((i) => i.value > 0).slice(0, 5);
  const max = Math.max(...rows.map((r) => r.value), 1);
  const total = rows.reduce((s, r) => s + r.value, 0);

  return (
    <Panel
      title="Top products"
      subtitle="By sales revenue"
      icon={Package}
      action={
        <Link
          to="/inventory/products"
          className="rounded-lg px-2 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
        >
          View all
        </Link>
      }
    >
      {rows.length === 0 ? (
        <PanelEmpty>Product sales will appear here once orders are booked.</PanelEmpty>
      ) : (
        <ol className="space-y-4">
          {rows.map((r, i) => (
            <li key={r.name}>
              <div className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted font-mono text-[11px] font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium" title={r.name}>
                  {r.name}
                </span>
                <span className="text-sm font-semibold tabular-nums" title={formatINR(r.value)}>
                  {formatINRCompact(r.value)}
                </span>
                <span className="w-11 text-right text-[11px] tabular-nums text-muted-foreground">
                  {((r.value / total) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="ml-10 mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(r.value / max) * 100}%` }}
                  transition={{ duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ background: PALETTE[i % PALETTE.length] }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

const prettyStatus = (s: string) =>
  s
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());

/** Sales orders by status: donut with total count in the middle. */
export function OrderStatus({ items }: { items: NamedValue[] }) {
  const rows = items.filter((i) => i.value > 0);
  const total = rows.reduce((s, r) => s + r.value, 0);

  return (
    <Panel
      title="Orders by status"
      subtitle="All sales orders"
      icon={PieIcon}
      action={
        <Link
          to="/sales/sales-orders"
          className="rounded-lg px-2 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
        >
          View all
        </Link>
      }
    >
      {rows.length === 0 ? (
        <PanelEmpty>No sales orders yet.</PanelEmpty>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
          <div className="relative h-[170px] w-[170px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={80}
                  paddingAngle={rows.length > 1 ? 3 : 0}
                  cornerRadius={6}
                  stroke="none"
                >
                  {rows.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, n: string) => [`${v} orders`, prettyStatus(n)]}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                    boxShadow: "var(--shadow-dropdown)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <div className="font-display text-2xl font-bold tabular-nums">{total}</div>
                <div className="text-[11px] text-muted-foreground">orders</div>
              </div>
            </div>
          </div>
          <ul className="w-full min-w-0 flex-1 space-y-2.5">
            {rows.map((r, i) => (
              <li key={r.name} className="flex items-center gap-2.5 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-[4px]"
                  style={{ background: PALETTE[i % PALETTE.length] }}
                />
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  {prettyStatus(r.name)}
                </span>
                <span className="font-semibold tabular-nums">{r.value}</span>
                <span className="w-10 text-right text-[11px] tabular-nums text-muted-foreground">
                  {((r.value / total) * 100).toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
