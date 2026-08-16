"use client";

import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  IndianRupee,
  Wallet,
  PiggyBank,
  Receipt,
  Users,
  Target,
  Package,
  Building2,
  ArrowUpRight,
} from "lucide-react";
import { AnimatedContainer } from "@/design-system";
import { cn } from "@/design-system";
import type { KPI } from "../data";
import { useState } from "react";

const kpiIcons: Record<string, typeof IndianRupee> = {
  revenue: IndianRupee,
  cashflow: Wallet,
  profit: PiggyBank,
  expenses: Receipt,
  customers: Users,
  deals: Target,
  inventory: Package,
  employees: Building2,
};

interface KPICardsProps {
  data: KPI[];
}

export function KPICards({ data }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {data.map((kpi, i) => (
        <KPICard key={kpi.id} kpi={kpi} index={i} />
      ))}
    </div>
  );
}

function KPICard({ kpi, index }: { kpi: KPI; index: number }) {
  const [showInsight, setShowInsight] = useState(false);
  const navigate = useNavigate();
  const Icon = kpiIcons[kpi.id] || IndianRupee;

  const trendIcon = kpi.trend === "up" ? TrendingUp : kpi.trend === "down" ? TrendingDown : Minus;
  const trendColors = {
    up: "text-success bg-success/10",
    down: "text-destructive bg-destructive/10",
    neutral: "text-muted-foreground bg-muted",
  };
  const trendColor = trendColors[kpi.trend];

  const handleClick = () => {
    if (kpi.drillHref) {
      navigate({ to: kpi.drillHref as never });
    }
  };

  return (
    <AnimatedContainer delay={index * 0.05}>
      <motion.div
        whileHover={{ y: -2 }}
        onHoverStart={() => setShowInsight(true)}
        onHoverEnd={() => setShowInsight(false)}
        onClick={handleClick}
        className={`relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-ring/30 transition-all duration-150 ${
          kpi.drillHref ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {kpi.label}
          </span>
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              trendColor,
            )}
          >
            {React.createElement(trendIcon, { className: "h-3 w-3" })}
            {Math.abs(kpi.change)}%
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-2xl font-bold tracking-tight">{kpi.value}</span>
          {kpi.drillHref && <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>

        <p className="text-xs text-muted-foreground mb-2">{kpi.description}</p>

        <motion.div
          initial={false}
          animate={{ height: showInsight ? "auto" : 0, opacity: showInsight ? 1 : 0 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className="flex items-start gap-1.5 pt-1 border-t border-border/50">
            <Lightbulb className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">{kpi.insight}</p>
          </div>
        </motion.div>

        <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full opacity-[0.03]">
          <Icon className="h-full w-full" />
        </div>
      </motion.div>
    </AnimatedContainer>
  );
}
