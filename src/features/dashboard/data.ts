export interface KPI {
  id: string;
  label: string;
  value: string;
  rawValue: number;
  change: number;
  trend: "up" | "down" | "neutral";
  description: string;
  insight: string;
  /** Route to navigate to when the KPI card is clicked (drill-down). */
  drillHref?: string;
}

export interface AIInsight {
  id: string;
  type: "positive" | "negative" | "info" | "warning";
  title: string;
  description: string;
  action?: { label: string; onClick?: () => void };
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  type: "invoice" | "payment" | "order" | "approval" | "employee" | "ai" | "alert";
  user?: { name: string; initials: string };
}

export interface ChartData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface ActivityItem {
  id: string;
  time: string;
  title: string;
  description: string;
  type: string;
}

export const kpiData: KPI[] = [
  {
    id: "revenue",
    label: "Total Revenue",
    value: "₹84.2L",
    rawValue: 8420000,
    change: 18,
    trend: "up",
    description: "vs last month",
    insight: "Driven by enterprise deals with HDFC Bank and TCS",
  },
  {
    id: "cashflow",
    label: "Cash Flow",
    value: "₹31.6L",
    rawValue: 3160000,
    change: 12,
    trend: "up",
    description: "Net operating cash flow",
    insight: "Positive cash flow for 6 consecutive months",
  },
  {
    id: "profit",
    label: "Net Profit",
    value: "₹21.6L",
    rawValue: 2160000,
    change: 8,
    trend: "up",
    description: "vs last month",
    insight: "Margin improved due to reduced COGS",
  },
  {
    id: "expenses",
    label: "Expenses",
    value: "₹52.4L",
    rawValue: 5240000,
    change: 3,
    trend: "down",
    description: "vs last month",
    insight: "Operational costs under control",
  },
  {
    id: "customers",
    label: "Customers",
    value: "1,284",
    rawValue: 1284,
    change: 24,
    trend: "up",
    description: "new this month",
    insight: "Highest acquisition in Q2 from referral program",
  },
  {
    id: "deals",
    label: "Open Deals",
    value: "₹1.2Cr",
    rawValue: 12000000,
    change: 15,
    trend: "up",
    description: "pipeline value",
    insight: "5 high-value deals in negotiation stage",
  },
  {
    id: "inventory",
    label: "Inventory",
    value: "₹1.42Cr",
    rawValue: 14200000,
    change: 2,
    trend: "up",
    description: "4,210 SKUs",
    insight: "12 SKUs below reorder level",
  },
  {
    id: "employees",
    label: "Employees",
    value: "248",
    rawValue: 248,
    change: 6,
    trend: "up",
    description: "new hires this quarter",
    insight: "Engineering team grew 40% in Q2",
  },
];

export const aiInsights: AIInsight[] = [
  {
    id: "1",
    type: "positive",
    title: "Revenue up 18%",
    description:
      "Revenue grew 18% this month driven by enterprise deals. HDFC Bank and TCS contributed 42% of new revenue.",
    action: { label: "View Report" },
  },
  {
    id: "2",
    type: "warning",
    title: "3 invoices require attention",
    description:
      "INV-2040 from Wipro is overdue by 5 days. Total outstanding: ₹65,800. Send a gentle reminder.",
    action: { label: "Review" },
  },
  {
    id: "3",
    type: "negative",
    title: "Inventory running low",
    description:
      "12 SKUs have fallen below reorder levels. USB-C Hubs and Mechanical Keyboards need immediate restocking.",
    action: { label: "View Inventory" },
  },
  {
    id: "4",
    type: "positive",
    title: "5 leads likely to convert",
    description:
      "AI predicts 5 leads in the proposal stage have >80% conversion probability. Total potential value: ₹24L.",
    action: { label: "View Leads" },
  },
  {
    id: "5",
    type: "info",
    title: "Payroll due tomorrow",
    description:
      "Monthly payroll of ₹18.2L is scheduled for processing. All 248 employee timesheets are approved.",
    action: { label: "Process Payroll" },
  },
  {
    id: "6",
    type: "positive",
    title: "Cash flow healthy",
    description:
      "Current ratio at 2.4x. DSO improved to 38 days from 45 days last quarter. Working capital is strong.",
    action: { label: "View Cash Flow" },
  },
];

export const timelineEvents: TimelineEvent[] = [
  {
    id: "1",
    time: "2 min ago",
    title: "Invoice INV-2041 Approved",
    description: "Aarav Mehta approved invoice #2041 for Reliance Digital — ₹1,84,500",
    type: "approval",
    user: { name: "Aarav Mehta", initials: "AM" },
  },
  {
    id: "2",
    time: "18 min ago",
    title: "Purchase Order Created",
    description: "Priya Sharma created PO #PO-7821 for Tata Steel Ltd — ₹96,200",
    type: "order",
    user: { name: "Priya Sharma", initials: "PS" },
  },
  {
    id: "3",
    time: "1 hr ago",
    title: "Low Stock Alert",
    description: "AI detected 12 SKUs below reorder level across WH-01, WH-02, WH-03",
    type: "alert",
  },
  {
    id: "4",
    time: "3 hr ago",
    title: "Customer Onboarded",
    description:
      "Rohit Khanna added Reliance Digital as a new customer — estimated ₹18.4L annual value",
    type: "approval",
    user: { name: "Rohit Khanna", initials: "RK" },
  },
  {
    id: "5",
    time: "Yesterday",
    title: "GST Return Filed",
    description: "Neha Iyer filed GSTR-1 for May 2026. Total outward supply: ₹84.2L",
    type: "employee",
    user: { name: "Neha Iyer", initials: "NI" },
  },
  {
    id: "6",
    time: "Yesterday",
    title: "Payment Received",
    description: "Payment of ₹2,40,000 received from Infosys Ltd against invoice INV-2038",
    type: "payment",
  },
  {
    id: "7",
    time: "2 days ago",
    title: "AI Report Generated",
    description:
      "AI completed Q2 business performance analysis. Revenue growth: 18%, Profit margin: 25.6%",
    type: "ai",
  },
];

export const revenueChartData: ChartData[] = [
  { month: "Jan", revenue: 6200000, expenses: 4100000, profit: 2100000 },
  { month: "Feb", revenue: 6900000, expenses: 4300000, profit: 2600000 },
  { month: "Mar", revenue: 7400000, expenses: 4600000, profit: 2800000 },
  { month: "Apr", revenue: 8100000, expenses: 5100000, profit: 3000000 },
  { month: "May", revenue: 8800000, expenses: 5400000, profit: 3400000 },
  { month: "Jun", revenue: 9200000, expenses: 5600000, profit: 3600000 },
  { month: "Jul", revenue: 9700000, expenses: 5900000, profit: 3800000 },
  { month: "Aug", revenue: 10500000, expenses: 6400000, profit: 4100000 },
  { month: "Sep", revenue: 11200000, expenses: 6800000, profit: 4400000 },
  { month: "Oct", revenue: 11800000, expenses: 7000000, profit: 4800000 },
  { month: "Nov", revenue: 12400000, expenses: 7400000, profit: 5000000 },
  { month: "Dec", revenue: 13300000, expenses: 7900000, profit: 5400000 },
];

export const salesByCategory = [
  { name: "Laptops", value: 45 },
  { name: "Accessories", value: 22 },
  { name: "Monitors", value: 15 },
  { name: "Furniture", value: 10 },
  { name: "Tablets", value: 8 },
];

export const weeklySales = [
  { day: "Mon", orders: 124, revenue: 420000 },
  { day: "Tue", orders: 168, revenue: 580000 },
  { day: "Wed", orders: 142, revenue: 490000 },
  { day: "Thu", orders: 196, revenue: 680000 },
  { day: "Fri", orders: 232, revenue: 810000 },
  { day: "Sat", orders: 188, revenue: 650000 },
  { day: "Sun", orders: 96, revenue: 320000 },
];

export const customerGrowth = [
  { month: "Jan", customers: 1080, new: 42 },
  { month: "Feb", customers: 1110, new: 38 },
  { month: "Mar", customers: 1145, new: 45 },
  { month: "Apr", customers: 1190, new: 52 },
  { month: "May", customers: 1240, new: 58 },
  { month: "Jun", customers: 1284, new: 44 },
];

export const upcomingTasks = [
  {
    id: "1",
    title: "File GSTR-3B for June",
    due: "Jul 20",
    priority: "high" as const,
    category: "Compliance",
  },
  {
    id: "2",
    title: "Quarterly TDS Return",
    due: "Jul 31",
    priority: "high" as const,
    category: "Tax",
  },
  {
    id: "3",
    title: "Review Vendor Renewals",
    due: "Jun 25",
    priority: "medium" as const,
    category: "Procurement",
  },
  {
    id: "4",
    title: "Inventory Audit — WH-02",
    due: "Jun 22",
    priority: "medium" as const,
    category: "Operations",
  },
  {
    id: "5",
    title: "Team Performance Review",
    due: "Jun 30",
    priority: "low" as const,
    category: "HR",
  },
];

export const quickActions = [
  { id: "1", label: "Create Invoice", icon: "FileText", color: "primary" },
  { id: "2", label: "Add Customer", icon: "UserPlus", color: "success" },
  { id: "3", label: "Create Lead", icon: "Target", color: "info" },
  { id: "4", label: "Record Payment", icon: "Wallet", color: "warning" },
  { id: "5", label: "Add Product", icon: "Package", color: "primary" },
  { id: "6", label: "Create Employee", icon: "Users", color: "success" },
];
