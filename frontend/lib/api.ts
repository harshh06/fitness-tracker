// ─────────────────────────────────────────────────────────────
// lib/api.ts — Typed fetch wrapper for the fitness-tracker BE
// ─────────────────────────────────────────────────────────────

import { supabase } from "./supabaseClient";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
 * (e.g. invalid tokens or expired session).
 */
export function onUnauthorized(callback: UnauthorizedListener): void {
  unauthorizedListener = callback;
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
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
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

  // ── 401 handling: sign out and trigger unauthorized listener ──
  if (res.status === 401 && !opts.public) {
    await supabase.auth.signOut();
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
