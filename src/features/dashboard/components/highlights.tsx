import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, CheckCircle2, Info, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINRCompact } from "@/lib/format";
import { Panel, PanelEmpty } from "./panel";
import type { OwnerKpis } from "./money-position";
import type { MonthPoint } from "./revenue-performance";
import type { NamedValue } from "./sales-breakdown";

export interface Highlight {
  id: string;
  tone: "positive" | "warning" | "info";
  title: string;
  detail: string;
  href?: string;
  cta?: string;
}

/**
 * Rule-based observations computed from the dashboard's own numbers. Each one
 * states the figures it is based on, so nothing reads as an unexplained claim.
 */
export function buildHighlights({
  owner,
  trend,
  topProducts,
}: {
  owner?: OwnerKpis;
  trend: MonthPoint[];
  topProducts: NamedValue[];
}): Highlight[] {
  const out: Highlight[] = [];

  if (owner) {
    const { cashAndBank: cash, receivables: recv, payables: pay } = owner;
    if (recv > 0 && recv > cash) {
      out.push({
        id: "collections",
        tone: "warning",
        title: "Collections need attention",
        detail: `${formatINRCompact(recv)} is waiting to be collected — more than the ${formatINRCompact(cash)} in your bank.`,
        href: "/accounting/receivables",
        cta: "Review receivables",
      });
    }
    if (pay > 0) {
      const cover = cash / pay;
      out.push({
        id: "coverage",
        tone: cover >= 1 ? "positive" : "warning",
        title:
          cover >= 1
            ? `Cash covers payables ${cover.toFixed(1)}×`
            : "Cash is short of payables",
        detail: `${formatINRCompact(cash)} in bank against ${formatINRCompact(pay)} of open vendor bills.`,
        href: "/purchases/bills",
        cta: "See bills",
      });
    }
  }

  const elapsed = trend.slice(0, new Date().getMonth() + 1);
  const cur = elapsed.at(-1)?.value ?? 0;
  const prev = elapsed.at(-2)?.value ?? 0;
  if (prev > 0) {
    const pct = ((cur - prev) / prev) * 100;
    out.push({
      id: "momentum",
      tone: pct >= 0 ? "positive" : "info",
      title: pct >= 0 ? `Sales up ${pct.toFixed(0)}% on last month` : `Sales ${Math.abs(pct).toFixed(0)}% behind last month`,
      detail: `${formatINRCompact(cur)} booked so far this month vs ${formatINRCompact(prev)} last month.`,
      href: "/sales/sales-orders",
      cta: "Open sales orders",
    });
  }

  const products = topProducts.filter((p) => p.value > 0);
  const productTotal = products.reduce((s, p) => s + p.value, 0);
  if (products.length > 1 && productTotal > 0) {
    const share = (products[0].value / productTotal) * 100;
    if (share >= 50) {
      out.push({
        id: "concentration",
        tone: "info",
        title: `${products[0].name} drives ${share.toFixed(0)}% of top sales`,
        detail: "High dependence on one product — worth watching stock and pricing closely.",
        href: "/inventory/products",
        cta: "View product",
      });
    }
  }

  return out;
}

const TONE = {
  positive: { icon: CheckCircle2, chip: "bg-success/10 text-success ring-success/20" },
  warning: { icon: AlertTriangle, chip: "bg-warning/10 text-warning ring-warning/20" },
  info: { icon: Info, chip: "bg-info/10 text-info ring-info/20" },
} as const;

export function Highlights({ items }: { items: Highlight[] }) {
  return (
    <Panel title="Highlights" subtitle="What needs your attention" icon={Lightbulb} bodyClassName="px-3 pt-3">
      {items.length === 0 ? (
        <div className="px-2">
          <PanelEmpty>All clear — nothing needs your attention right now.</PanelEmpty>
        </div>
      ) : (
        <ul className="space-y-1">
          {items.map((h, i) => {
            const t = TONE[h.tone];
            return (
              <motion.li
                key={h.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="group flex gap-3 rounded-xl p-2.5 transition hover:bg-muted/60"
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset",
                    t.chip,
                  )}
                >
                  <t.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{h.title}</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{h.detail}</p>
                  {h.href && (
                    <Link
                      to={h.href as never}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary"
                    >
                      {h.cta ?? "Open"}
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
