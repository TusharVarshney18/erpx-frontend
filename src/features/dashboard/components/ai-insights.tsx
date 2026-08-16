"use client";

import { motion } from "framer-motion";
import { Sparkles, AlertTriangle, CheckCircle2, Info, ArrowRight } from "lucide-react";
import { Badge } from "@/design-system";
import { cn } from "@/design-system";
import type { AIInsight } from "../data";

interface AIInsightsPanelProps {
  insights: AIInsight[];
}

const iconMap = {
  positive: CheckCircle2,
  negative: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  positive: "bg-success/10 text-success border-success/20",
  negative: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  info: "bg-info/10 text-info border-info/20",
};

const iconBgMap = {
  positive: "bg-success/10 text-success",
  negative: "bg-destructive/10 text-destructive",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};

export function AIInsightsPanel({ insights }: AIInsightsPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ai/10">
          <Sparkles className="h-3.5 w-3.5 text-ai" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">AI Insights</span>
          <span className="text-[11px] text-muted-foreground">
            Real-time analysis of your business
          </span>
        </div>
        <Badge variant="dot" dot="success" className="ml-auto">
          Live
        </Badge>
      </div>

      <div className="divide-y divide-border/50">
        {insights.map((insight, i) => {
          const Icon = iconMap[insight.type];
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
              className="group relative overflow-hidden transition-all duration-150 hover:bg-muted/30"
            >
              <div className="flex gap-3 px-5 py-3.5">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    iconBgMap[insight.type],
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{insight.title}</span>
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        insight.type === "positive"
                          ? "bg-success"
                          : insight.type === "warning"
                            ? "bg-warning"
                            : insight.type === "negative"
                              ? "bg-destructive"
                              : "bg-info",
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {insight.description}
                  </p>
                  {insight.action && (
                    <button className="flex items-center gap-1 mt-1.5 text-xs font-medium text-primary hover:underline group/btn">
                      {insight.action.label}
                      <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
