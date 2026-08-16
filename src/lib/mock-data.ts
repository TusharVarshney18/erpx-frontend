// Centralized realistic-looking mock data for the ERP UI.

export const kpis = [
  { label: "Total Revenue", value: "₹84.2L", delta: "+12.4%", trend: "up", hint: "vs last month" },
  { label: "Net Profit", value: "₹21.6L", delta: "+8.1%", trend: "up", hint: "vs last month" },
  {
    label: "Pending Invoices",
    value: "₹6.84L",
    delta: "-3.2%",
    trend: "down",
    hint: "42 invoices",
  },
  { label: "Inventory Value", value: "₹1.42Cr", delta: "+2.0%", trend: "up", hint: "4,210 SKUs" },
  { label: "Total Customers", value: "1,284", delta: "+24", trend: "up", hint: "this month" },
  { label: "Total Vendors", value: "318", delta: "+5", trend: "up", hint: "this month" },
];

export const revenueSeries = [
  { m: "Jan", revenue: 620000, expense: 410000 },
  { m: "Feb", revenue: 690000, expense: 430000 },
  { m: "Mar", revenue: 740000, expense: 460000 },
  { m: "Apr", revenue: 810000, expense: 510000 },
  { m: "May", revenue: 880000, expense: 540000 },
  { m: "Jun", revenue: 920000, expense: 560000 },
  { m: "Jul", revenue: 970000, expense: 590000 },
  { m: "Aug", revenue: 1050000, expense: 640000 },
  { m: "Sep", revenue: 1120000, expense: 680000 },
  { m: "Oct", revenue: 1180000, expense: 700000 },
  { m: "Nov", revenue: 1240000, expense: 740000 },
  { m: "Dec", revenue: 1330000, expense: 790000 },
];

export const cashFlow = revenueSeries.map((r) => ({
  m: r.m,
  inflow: r.revenue,
  outflow: r.expense,
  net: r.revenue - r.expense,
}));

export const salesTrend = [
  { d: "Mon", sales: 124 },
  { d: "Tue", sales: 168 },
  { d: "Wed", sales: 142 },
  { d: "Thu", sales: 196 },
  { d: "Fri", sales: 232 },
  { d: "Sat", sales: 188 },
  { d: "Sun", sales: 96 },
];

export const recentTransactions = [
  {
    id: "INV-2041",
    party: "Reliance Digital",
    type: "Invoice",
    amount: 184500,
    status: "Paid",
    date: "2026-06-12",
  },
  {
    id: "BIL-1182",
    party: "Tata Steel Ltd.",
    type: "Bill",
    amount: 96200,
    status: "Pending",
    date: "2026-06-12",
  },
  {
    id: "PMT-3320",
    party: "Infosys Ltd.",
    type: "Payment",
    amount: 240000,
    status: "Received",
    date: "2026-06-11",
  },
  {
    id: "INV-2040",
    party: "Wipro Limited",
    type: "Invoice",
    amount: 65800,
    status: "Overdue",
    date: "2026-06-10",
  },
  {
    id: "EXP-0918",
    party: "Office Rent",
    type: "Expense",
    amount: 125000,
    status: "Paid",
    date: "2026-06-10",
  },
  {
    id: "INV-2039",
    party: "HCL Technologies",
    type: "Invoice",
    amount: 312000,
    status: "Paid",
    date: "2026-06-09",
  },
  {
    id: "BIL-1181",
    party: "Asian Paints",
    type: "Bill",
    amount: 48900,
    status: "Paid",
    date: "2026-06-09",
  },
];

export const activities = [
  { who: "Aarav Mehta", what: "approved invoice INV-2041", when: "2 min ago", color: "success" },
  {
    who: "Priya Sharma",
    what: "created PO #PO-7821 for Tata Steel",
    when: "18 min ago",
    color: "info",
  },
  { who: "System", what: "Low stock alert on 12 SKUs", when: "1 hr ago", color: "warning" },
  {
    who: "Rohit Khanna",
    what: "added customer Reliance Digital",
    when: "3 hr ago",
    color: "primary",
  },
  { who: "Neha Iyer", what: "filed GSTR-1 for May 2026", when: "yesterday", color: "success" },
];

export const upcomingTasks = [
  { title: "File GSTR-3B for June", due: "Jul 20", priority: "High" },
  { title: "Quarterly TDS return", due: "Jul 31", priority: "High" },
  { title: "Review vendor renewals", due: "Jun 25", priority: "Medium" },
  { title: "Inventory audit – WH-02", due: "Jun 22", priority: "Medium" },
];

export const topProducts = [
  { name: "Dell Latitude 7440", sold: 142, revenue: 1842000 },
  { name: "HP EliteBook 840 G10", sold: 118, revenue: 1452000 },
  { name: "Logitech MX Master 3S", sold: 412, revenue: 412000 },
  { name: "Apple MacBook Air M3", sold: 64, revenue: 1024000 },
  { name: 'Samsung 27" Monitor', sold: 96, revenue: 384000 },
];

export const lowStock = [
  { sku: "SKU-10421", name: "USB-C Hub 7-in-1", left: 4, reorder: 25, warehouse: "WH-01" },
  { sku: "SKU-22018", name: "Mechanical Keyboard K2", left: 6, reorder: 30, warehouse: "WH-02" },
  { sku: "SKU-30142", name: "Webcam Pro 1080p", left: 2, reorder: 20, warehouse: "WH-01" },
  { sku: "SKU-40918", name: "Office Chair Ergo X", left: 3, reorder: 10, warehouse: "WH-03" },
];

export const recentCustomers = [
  { name: "Reliance Digital", since: "Jun 12", value: "₹18.4L" },
  { name: "Tata Consultancy", since: "Jun 10", value: "₹42.1L" },
  { name: "Asian Paints", since: "Jun 09", value: "₹6.2L" },
  { name: "HDFC Bank", since: "Jun 07", value: "₹28.6L" },
];

export const chartOfAccounts = [
  { code: "1000", name: "Cash in Hand", type: "Asset", balance: 425000, status: "Active" },
  { code: "1010", name: "HDFC Bank – Current", type: "Asset", balance: 8420000, status: "Active" },
  { code: "1100", name: "Accounts Receivable", type: "Asset", balance: 1248500, status: "Active" },
  { code: "1200", name: "Inventory", type: "Asset", balance: 14200000, status: "Active" },
  { code: "2000", name: "Accounts Payable", type: "Liability", balance: 962000, status: "Active" },
  { code: "2100", name: "GST Payable", type: "Liability", balance: 184500, status: "Active" },
  { code: "3000", name: "Owner's Equity", type: "Equity", balance: 18000000, status: "Active" },
  { code: "4000", name: "Sales Revenue", type: "Income", balance: 8420000, status: "Active" },
  { code: "4100", name: "Service Revenue", type: "Income", balance: 1240000, status: "Active" },
  { code: "5000", name: "Cost of Goods Sold", type: "Expense", balance: 4820000, status: "Active" },
  { code: "5100", name: "Salaries & Wages", type: "Expense", balance: 1820000, status: "Active" },
  { code: "5200", name: "Rent Expense", type: "Expense", balance: 480000, status: "Active" },
];

export const customers = Array.from({ length: 18 }, (_, i) => ({
  id: `CUS-${1000 + i}`,
  name: [
    "Reliance Digital",
    "Tata Consultancy",
    "Infosys Ltd.",
    "Wipro Limited",
    "HCL Technologies",
    "Asian Paints",
    "HDFC Bank",
    "ICICI Bank",
    "Bharti Airtel",
    "Larsen & Toubro",
    "Mahindra & Mahindra",
    "Bajaj Finserv",
    "Adani Group",
    "Britannia Industries",
    "Maruti Suzuki",
    "Dabur India",
    "ITC Limited",
    "Sun Pharma",
  ][i],
  email: `accounts${i + 1}@company.com`,
  phone: `+91 98${(100000 + i * 137).toString().slice(0, 8)}`,
  outstanding: Math.round(Math.random() * 800000),
  status: i % 5 === 0 ? "Inactive" : "Active",
}));

export const products = Array.from({ length: 16 }, (_, i) => {
  const names = [
    "Dell Latitude 7440",
    "HP EliteBook 840",
    "Apple MacBook Air M3",
    "Lenovo ThinkPad X1",
    "Logitech MX Master 3S",
    'Samsung 27" Monitor',
    "USB-C Hub 7-in-1",
    "Mechanical Keyboard K2",
    "Webcam Pro 1080p",
    "Office Chair Ergo X",
    "Standing Desk Pro",
    "Wireless Headset H8",
    'iPad Pro 11"',
    "Surface Pro 9",
    "AirPods Pro 2",
    "Kindle Paperwhite",
  ];
  return {
    id: `PRD-${2000 + i}`,
    sku: `SKU-${10000 + i * 137}`,
    name: names[i],
    category: ["Laptops", "Accessories", "Monitors", "Furniture", "Tablets"][i % 5],
    stock: Math.round(Math.random() * 240),
    price: Math.round(5000 + Math.random() * 120000),
    status: i % 7 === 0 ? "Low Stock" : "In Stock",
  };
});

export const leads = {
  "New Lead": [
    { id: "L-1", name: "Bharti Airtel", value: 480000, owner: "AM" },
    { id: "L-2", name: "Maruti Suzuki", value: 320000, owner: "PS" },
  ],
  Contacted: [
    { id: "L-3", name: "ICICI Bank", value: 1240000, owner: "RK" },
    { id: "L-4", name: "Dabur India", value: 180000, owner: "NI" },
  ],
  Qualified: [{ id: "L-5", name: "Adani Group", value: 2400000, owner: "AM" }],
  Proposal: [
    { id: "L-6", name: "Bajaj Finserv", value: 860000, owner: "PS" },
    { id: "L-7", name: "Britannia", value: 240000, owner: "RK" },
  ],
  Won: [{ id: "L-8", name: "HDFC Bank", value: 1820000, owner: "NI" }],
  Lost: [{ id: "L-9", name: "Sun Pharma", value: 420000, owner: "AM" }],
} as const;

export const employees = Array.from({ length: 12 }, (_, i) => ({
  id: `EMP-${100 + i}`,
  name: [
    "Aarav Mehta",
    "Priya Sharma",
    "Rohit Khanna",
    "Neha Iyer",
    "Vikram Singh",
    "Ananya Reddy",
    "Karan Patel",
    "Sneha Nair",
    "Arjun Rao",
    "Meera Joshi",
    "Siddharth Bose",
    "Divya Menon",
  ][i],
  role: ["Accountant", "Sales Manager", "Inventory Lead", "HR Partner", "Engineer", "Designer"][
    i % 6
  ],
  dept: ["Finance", "Sales", "Operations", "HR", "Engineering", "Design"][i % 6],
  email: `emp${i + 1}@acme.com`,
  status: i % 8 === 0 ? "On Leave" : "Active",
}));
