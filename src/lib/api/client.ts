// VITE_* values are baked into the bundle at build time. If none is set, only
// a browser actually running on localhost should talk to the local backend on
// port 3001; every other host uses the same-origin /api/v1 path.
const fallbackApiBase =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:3001/api/v1"
    : "/api/v1";

/**
 * Accept either a full API base (`https://api.example.com/api/v1`) or a bare
 * origin (`https://api.example.com`) from the deployment environment. A bare
 * origin is a common misconfiguration and previously produced broken links
 * such as `/auth/google` instead of `/api/v1/auth/google`.
 */
function normalizeApiBase(value: string): string {
  const trimmed = value.replace(/\/+$/, "");
  if (!trimmed) return "/api/v1";
  return /\/api(?:\/v\d+)?$/.test(trimmed) ? trimmed : `${trimmed}/api/v1`;
}

export const API_BASE = normalizeApiBase(import.meta.env.VITE_API_URL || fallbackApiBase);

const isBrowser = typeof window !== "undefined";

/** Abort requests that hang (e.g. a cold-started backend) so the UI can recover. */
const REQUEST_TIMEOUT_MS = 45_000;

async function fetchWithTimeout(input: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    // Send the httpOnly trusted-device cookie on every API call.
    return await fetch(input, { credentials: "include", ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The server took too long to respond. Please try again.");
    }
    const reason = error instanceof Error && error.message ? ` (${error.message})` : "";
    throw new Error(
      `Cannot reach the API server at ${API_BASE}${reason}. Check that the backend is running and that VITE_API_URL points to it.`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

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

/**
 * Global handler for the backend `MFA_STEP_UP_REQUIRED` response. A mounted
 * component registers a prompt that shows the 6-digit dialog and resolves with
 * the entered code (or `null` if the user cancels). The client then calls
 * `POST /auth/mfa/step-up` and retries the original request once.
 */
export type MfaStepUpPrompt = () => Promise<string | null>;

let mfaStepUpPrompt: MfaStepUpPrompt | null = null;

export function registerMfaStepUpPrompt(prompt: MfaStepUpPrompt | null): void {
  mfaStepUpPrompt = prompt;
}

function isMfaStepUpBody(body: unknown): boolean {
  return (
    !!body &&
    typeof body === "object" &&
    (body as { code?: unknown }).code === "MFA_STEP_UP_REQUIRED"
  );
}

async function refreshAccessToken(): Promise<void> {
  if (!tokens.refreshToken) throw new Error("No refresh token");
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const res = await fetchWithTimeout(`${API_BASE}/auth/refresh`, {
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
  /** Keep { data, meta } paginated payloads intact instead of flattening to the inner array. */
  keepMeta?: boolean;
};

async function request<T>(
  path: string,
  options: RequestOptions = {},
  allowStepUp = true,
): Promise<T> {
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

  // Only attempt a token refresh when the request actually carried a token.
  // Unauthenticated calls (e.g. /auth/login) return 401 for bad credentials,
  // and refreshing there just doubles the latency.
  const hadAuth = Boolean(tokens.accessToken);

  let res = await fetchWithTimeout(url, { ...fetchOptions, headers });

  if (res.status === 401 && hadAuth && tokens.refreshToken) {
    try {
      await refreshAccessToken();
      headers.set("Authorization", `Bearer ${tokens.accessToken}`);
      res = await fetchWithTimeout(url, { ...fetchOptions, headers });
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

  // Step-up MFA: a sensitive action was rejected because the session's MFA
  // verification is stale. Prompt for a code, verify it, then retry once.
  if (res.status === 403 && allowStepUp && mfaStepUpPrompt) {
    const peek = await res
      .clone()
      .json()
      .catch(() => null);
    if (isMfaStepUpBody(peek)) {
      const code = await mfaStepUpPrompt();
      if (code) {
        const stepRes = await fetchWithTimeout(`${API_BASE}/auth/mfa/step-up`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(tokens.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
          },
          body: JSON.stringify({ code }),
        });
        if (stepRes.ok) {
          return request<T>(path, options, false);
        }
      }
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const errorBody = body as {
      code?: string;
      module?: string;
      requiredPlan?: string | null;
      message?: string;
      errors?: unknown;
    };
    if (errorBody?.code === "FEATURE_LOCKED" && isBrowser) {
      window.dispatchEvent(
        new CustomEvent("erpx:feature-locked", {
          detail: {
            module: errorBody.module,
            requiredPlan: errorBody.requiredPlan ?? null,
            message: errorBody.message,
          },
        }),
      );
    }
    // Validation failures arrive as { message: "Validation failed", errors: [...] }.
    // Surface the individual field errors so the user knows what to fix instead of
    // only seeing the generic "Validation failed" headline.
    const validationErrors = Array.isArray(errorBody?.errors)
      ? errorBody.errors.filter(
          (item): item is string => typeof item === "string" && item.trim() !== "",
        )
      : [];
    const message =
      (body && typeof body === "object" && "message" in body
        ? (body as { message?: string }).message
        : null) || `HTTP ${res.status}`;
    const headline = message === "Validation failed" ? "Please fix the following:" : message;
    const err = new Error(
      validationErrors.length > 0 ? `${headline} ${validationErrors.join(" ")}` : message,
    ) as Error & { status?: number; data?: unknown; code?: string; errors?: string[] };
    err.status = res.status;
    err.data = body;
    err.code = errorBody?.code;
    err.errors = validationErrors;
    throw err;
  }

  const body = await res.json();

  // Unwrap backend envelope: { success, data, message, meta } -> data
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    const unwrapped = body.data as T;
    const envelopeMeta =
      "meta" in body && body.meta && typeof body.meta === "object"
        ? (body.meta as Record<string, unknown>)
        : {};

    // Keep paginated payloads intact so callers can read meta/totalPages.
    if (options.keepMeta) {
      if (unwrapped && typeof unwrapped === "object" && !Array.isArray(unwrapped)) {
        const obj = unwrapped as Record<string, unknown>;
        return { ...obj, meta: { ...(obj.meta as object), ...envelopeMeta } } as T;
      }
      return { data: unwrapped, meta: envelopeMeta } as T;
    }

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
