import { getAccessToken, setTokens } from "./client";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

export type BankAccountType = "SAVINGS" | "CURRENT" | "CASH" | "LOAN" | "OTHER";
export type BankTransactionType = "CREDIT" | "DEBIT" | "TRANSFER";
export type BankTransactionStatus = "PENDING" | "CLEARED" | "FAILED" | "REVERSED";

export type BankAccount = {
  id: string;
  organizationId: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string | null;
  branch: string | null;
  currency: string;
  accountType: BankAccountType;
  openingBalance: string;
  currentBalance: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { transactions: number };
  transactionCount?: number;
  recentTransactions?: BankTransaction[];
};

export type BankTransaction = {
  id: string;
  organizationId: string;
  bankAccountId: string;
  transactionDate: string;
  type: BankTransactionType;
  amount: string;
  description: string | null;
  reference: string | null;
  counterparty: string | null;
  category: string | null;
  status: BankTransactionStatus;
  balanceAfter: string | null;
  createdAt: string;
  updatedAt: string;
  bankAccount?: {
    id: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    currency: string;
  };
};

export type BankStatement = {
  id: string;
  organizationId: string;
  bankAccountId: string;
  periodStart: string;
  periodEnd: string;
  openingBalance: string;
  closingBalance: string;
  totalCredits: string;
  totalDebits: string;
  transactionCount: number;
  source: string;
  createdAt: string;
};

export type BankingSummary = {
  totalBalance: number;
  thisMonthCredits: number;
  thisMonthDebits: number;
  accountCount: number;
  pendingTransactions: number;
};

export type Paginated<T> = {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

async function fetchEnvelope(
  path: string,
  params?: Record<string, string>,
): Promise<{ data: unknown; meta?: Record<string, unknown> }> {
  let url = `${API_BASE}${path}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  let res = await fetch(url, {
    headers: getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {},
  });

  if (res.status === 401 && typeof localStorage !== "undefined") {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.ok) {
        const body = await refreshRes.json();
        const data = body.data || body;
        setTokens(data.accessToken, data.refreshToken);
        res = await fetch(url, {
          headers: getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {},
        });
      }
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function listWithMeta<T>(
  path: string,
  params?: Record<string, string>,
): Promise<Paginated<T>> {
  const body = await fetchEnvelope(path, params);
  const payload = body.data;
  let items: T[] = [];
  if (Array.isArray(payload)) {
    items = payload;
  } else if (payload && typeof payload === "object" && Array.isArray((payload as { data?: T[] }).data)) {
    items = (payload as { data: T[] }).data;
  }
  const meta = body.meta ?? {};
  const total = Number(meta.total ?? items.length);
  const page = Number(meta.page ?? 1);
  const limit = Number(meta.limit ?? items.length);
  return {
    data: items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / (limit || 1))),
    },
  };
}

export const bankingPath = (orgId: string) => `/banking/organizations/${orgId}`;
