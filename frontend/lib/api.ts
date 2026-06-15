// ─────────────────────────────────────────────────────────────
// lib/api.ts — Typed fetch wrapper for the fitness-tracker BE
// ─────────────────────────────────────────────────────────────
//
// Usage:
//   import { api } from "@/lib/api";
//   const profile = await api.get<Profile>("/profile");
//   await api.post("/auth/login", { email, password });
//
// Features:
//   • Base URL from NEXT_PUBLIC_API_URL env var
//   • Auto-attaches Authorization: Bearer <token>
//   • 401 response → clears tokens, redirects to /login
//   • Auto-refreshes expired access tokens using refresh_token
//   • Typed generic methods: get, post, put, delete
// ─────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Token storage (localStorage — client-side only) ─────────

const TOKEN_KEY = "pulse_access_token";
const REFRESH_KEY = "pulse_refresh_token";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// ── Error class for typed API errors ────────────────────────

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

// ── Unauthorized event handling ─────────────────────────────

type UnauthorizedListener = () => void;
let unauthorizedListener: UnauthorizedListener | null = null;

/**
 * Register a callback to be executed when a request fails with 401 Unauthorized
 * (e.g. invalid tokens or expired session that failed to refresh).
 * Decouples API routing from React / Next.js environments.
 */
export function onUnauthorized(callback: UnauthorizedListener): void {
  unauthorizedListener = callback;
}

// ── Token refresh logic ─────────────────────────────────────

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  // Deduplicate: if a refresh is already in-flight, reuse it
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new ApiError(401, "No refresh token available");
    }

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      throw new ApiError(res.status, "Session expired — please log in again");
    }

    const data = await res.json();
    // The refresh endpoint returns a new access_token only
    localStorage.setItem(TOKEN_KEY, data.access_token);
    return data.access_token as string;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

// ── Core fetch wrapper ──────────────────────────────────────

interface RequestOptions {
  /** Skip attaching the Authorization header (for public endpoints like /auth/*) */
  public?: boolean;
  /** Extra headers to merge */
  headers?: Record<string, string>;
  /** Query string params appended to the URL */
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: RequestOptions = {}
): Promise<T> {
  // Build URL with optional query params
  let url = `${BASE_URL}${path}`;
  if (opts.params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(opts.params)) {
      if (v !== undefined) qs.set(k, String(v));
    }
    const qsStr = qs.toString();
    if (qsStr) url += `?${qsStr}`;
  }

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...opts.headers,
  };

  if (!opts.public) {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // Make the request
  let res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // ── 401 handling: attempt token refresh once, then retry ──
  if (res.status === 401 && !opts.public) {
    try {
      const newToken = await refreshAccessToken();
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      // Refresh failed — clear and trigger unauthorized listener
      clearTokens();
      if (unauthorizedListener) {
        unauthorizedListener();
      }
      throw new ApiError(401, "Session expired");
    }
  }

  // ── Still 401 after refresh → force logout ────────────────
  if (res.status === 401 && !opts.public) {
    clearTokens();
    if (unauthorizedListener) {
      unauthorizedListener();
    }
    throw new ApiError(401, "Session expired");
  }

  // ── Parse response ────────────────────────────────────────
  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json();

  if (!res.ok) {
    let detail = "Something went wrong";
    if (typeof data.detail === "string") {
      detail = data.detail;
    } else if (Array.isArray(data.detail)) {
      detail = data.detail.map((e: any) => `${e.loc ? e.loc.join(".") : "field"}: ${e.msg}`).join(", ");
    } else if (data.detail && typeof data.detail === "object") {
      detail = JSON.stringify(data.detail);
    }
    throw new ApiError(res.status, detail);
  }

  return data as T;
}

// ── Public API surface ──────────────────────────────────────

export const api = {
  get<T>(path: string, opts?: RequestOptions): Promise<T> {
    return request<T>("GET", path, undefined, opts);
  },

  post<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return request<T>("POST", path, body, opts);
  },

  put<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return request<T>("PUT", path, body, opts);
  },

  delete<T = void>(path: string, opts?: RequestOptions): Promise<T> {
    return request<T>("DELETE", path, undefined, opts);
  },
};
