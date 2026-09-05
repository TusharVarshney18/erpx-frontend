export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

const isBrowser = typeof window !== "undefined";

function loadRefreshToken(): string | null {
  if (typeof localStorage !== "undefined") {
    return localStorage.getItem("refreshToken");
  }
  return null;
}

type TokenStore = {
  accessToken: string | null;
  refreshToken: string | null;
};

const tokens: TokenStore = {
  accessToken: null,
  refreshToken: loadRefreshToken(),
};

let refreshPromise: Promise<void> | null = null;

function persistRefreshToken(token: string | null) {
  tokens.refreshToken = token;
  if (isBrowser) {
    if (token) {
      localStorage.setItem("refreshToken", token);
    } else {
      localStorage.removeItem("refreshToken");
    }
  }
}

export function setTokens(access: string, refresh: string) {
  tokens.accessToken = access;
  persistRefreshToken(refresh);
}

export function clearTokens() {
  tokens.accessToken = null;
  persistRefreshToken(null);
}

export function getAccessToken(): string | null {
  return tokens.accessToken;
}

async function refreshAccessToken(): Promise<void> {
  if (!tokens.refreshToken) throw new Error("No refresh token");
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      throw new Error("Failed to refresh token");
    }
    const body = await res.json();
    const data = body.data || body;
    tokens.accessToken = data.accessToken;
    persistRefreshToken(data.refreshToken);
  })();

  try {
    await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

type RequestOptions = RequestInit & {
  params?: Record<string, string>;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  let url = `${API_BASE}${normalizedPath}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers = new Headers(fetchOptions.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (tokens.accessToken) {
    headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  }

  let res = await fetch(url, { ...fetchOptions, headers });

  if (res.status === 401 && tokens.refreshToken) {
    try {
      await refreshAccessToken();
      headers.set("Authorization", `Bearer ${tokens.accessToken}`);
      res = await fetch(url, { ...fetchOptions, headers });
    } catch {
      clearTokens();
      if (isBrowser) {
        window.location.href = "/auth";
      }
      throw new Error("Session expired");
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(
      (body && typeof body === "object" && "message" in body
        ? (body as { message?: string }).message
        : null) || `HTTP ${res.status}`,
    ) as Error & { status?: number; data?: unknown };
    err.status = res.status;
    err.data = body;
    throw err;
  }

  const body = await res.json();

  // Unwrap backend envelope: { success, data, message, meta } -> data
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    const unwrapped = body.data as T;
    // Handle double-wrapping: { data: data: [...] } when business-data
    // controller returns { data: [...], total, ... } and the
    // TransformInterceptor repackages it.
    if (unwrapped && typeof unwrapped === "object" && !Array.isArray(unwrapped)) {
      const obj = unwrapped as Record<string, unknown>;
      if ("data" in obj && Array.isArray(obj.data)) {
        return obj.data as T;
      }
    }
    return unwrapped;
  }

  return body as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
