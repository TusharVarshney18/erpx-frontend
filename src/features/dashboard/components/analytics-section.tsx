"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AnimatedContainer } from "@/design-system";
import type { ChartData } from "../data";

interface AnalyticsSectionProps {
  revenueData: ChartData[];
  salesByCategory: { name: string; value: number }[];
  weeklySales: { day: string; orders: number; revenue: number }[];
  customerGrowth: { month: string; customers: number; new: number }[];
}

export function AnalyticsSection({
  revenueData,
  salesByCategory,
  weeklySales,
  customerGrowth,
}: AnalyticsSectionProps) {
  const [revenueRange, setRevenueRange] = useState<"1M" | "6M" | "1Y">("1Y");

  const filteredRevenue =
    revenueRange === "1M"
      ? revenueData.slice(-1)
      : revenueRange === "6M"
        ? revenueData.slice(-6)
        : revenueData;
  const COLORS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  const tooltipStyle = {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
    boxShadow: "var(--shadow-dropdown)",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue vs Expenses Area Chart */}
        {revenueData.length > 0 && (
        <AnimatedContainer delay={0.1}>
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Revenue vs Expenses</span>
                <span className="text-[11px] text-muted-foreground">Monthly performance</span>
              </div>
              <div className="flex gap-1 bg-muted rounded-lg p-0.5">
                {(["1M", "6M", "1Y"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setRevenueRange(range)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      revenueRange === range
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredRevenue}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [`₹${(v / 100000).toFixed(2)}L`]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--chart-1)"
                    fill="url(#revGrad)"
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="var(--chart-4)"
                    fill="url(#expGrad)"
                    strokeWidth={2}
                    name="Expenses"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </AnimatedContainer>
        )}

        {/* Weekly Sales Bar Chart */}
        {weeklySales.length > 0 && (
        <AnimatedContainer delay={0.15}>
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Weekly Sales</span>
                <span className="text-[11px] text-muted-foreground">Orders and revenue</span>
              </div>
            </div>
            <div className="p-5 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="orders" fill="var(--chart-1)" radius={[6, 6, 0, 0]} name="Orders" />
                  <Bar
                    dataKey="revenue"
                    fill="var(--chart-3)"
                    radius={[6, 6, 0, 0]}
                    name="Revenue (₹)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </AnimatedContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Customer Growth Line Chart */}
        {customerGrowth.length > 0 && (
        <AnimatedContainer delay={0.2}>
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Customer Growth</span>
                <span className="text-[11px] text-muted-foreground">
                  Total customers & new acquisitions
                </span>
              </div>
            </div>
            <div className="p-5 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={customerGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="customers"
                    stroke="var(--chart-1)"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    name="Total Customers"
                  />
                  <Line
                    type="monotone"
                    dataKey="new"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="New Customers"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </AnimatedContainer>
        )}

        {/* Sales by Category Pie Chart */}
        {salesByCategory.length > 0 && (
        <AnimatedContainer delay={0.25}>
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Sales by Category</span>
                <span className="text-[11px] text-muted-foreground">Revenue distribution</span>
              </div>
            </div>
            <div className="p-5 h-[280px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {salesByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </AnimatedContainer>
        )}
      </div>
    </div>
  );
}
