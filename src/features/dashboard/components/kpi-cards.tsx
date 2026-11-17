"use client";

import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  IndianRupee,
  Wallet,
  PiggyBank,
  Receipt,
  Users,
  Target,
  Package,
  Building2,
  ArrowUpRight,
  FileText,
  ShoppingBag,
} from "lucide-react";
import { AnimatedContainer } from "@/design-system";
import { cn } from "@/design-system";
import type { KPI } from "../data";

const kpiIcons: Record<string, typeof IndianRupee> = {
  revenue: IndianRupee,
  cashflow: Wallet,
  profit: PiggyBank,
  expenses: Receipt,
  customers: Users,
  deals: Target,
  inventory: Package,
  employees: Building2,
  invoices: FileText,
  purchases: ShoppingBag,
};

interface KPICardsProps {
  data: KPI[];
}

export function KPICards({ data }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(210px,1fr))]">
      {data.map((kpi, i) => (
        <KPICard key={kpi.id} kpi={kpi} index={i} />
      ))}
    </div>
  );
}

function KPICard({ kpi, index }: { kpi: KPI; index: number }) {
  const navigate = useNavigate();
  const Icon = kpiIcons[kpi.id] || IndianRupee;

  const TrendIcon = kpi.trend === "up" ? TrendingUp : kpi.trend === "down" ? TrendingDown : Minus;
  const trendColor = {
    up: "text-success bg-success/10 ring-success/20",
    down: "text-destructive bg-destructive/10 ring-destructive/20",
    neutral: "text-muted-foreground bg-muted ring-border",
  }[kpi.trend];
  const hasComparison =
    typeof kpi.change === "number" && Number.isFinite(kpi.change) && kpi.change !== 0;

  return (
    <AnimatedContainer delay={index * 0.05}>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={() => kpi.drillHref && navigate({ to: kpi.drillHref as never })}
        className={cn(
          "group relative h-full overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-card transition-shadow duration-200 hover:border-primary/25 hover:shadow-md",
          kpi.drillHref ? "cursor-pointer" : "cursor-default",
        )}
      >
        {/* Brand rule on hover; colour elsewhere is reserved for up/down meaning. */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

        <div className="relative flex items-start justify-between">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/[0.08] text-primary ring-1 ring-inset ring-primary/15">
            <Icon className="h-[18px] w-[18px]" />
          </div>
          {hasComparison && (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ring-1 ring-inset",
                trendColor,
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {Math.abs(kpi.change)}%
            </div>
          )}
        </div>

        <div className="relative mt-4 text-[12px] font-medium text-muted-foreground">{kpi.label}</div>
        <div className="relative mt-1 flex items-center gap-1.5">
          <span title={kpi.insight} className="font-display text-[26px] font-bold leading-none tracking-tight tabular-nums">
            {kpi.value}
          </span>
          {kpi.drillHref && (
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
          )}
        </div>

        <p className="relative mt-3 line-clamp-1 text-xs text-muted-foreground" title={kpi.insight}>
          {kpi.description}
        </p>
      </motion.div>
    </AnimatedContainer>
  );
}
