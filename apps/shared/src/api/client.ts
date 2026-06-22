// ─────────────────────────────────────────────────────────────────────────────
// Request deduplication — in-flight GET requests share a single promise so
// that N parallel calls to the same endpoint fire 1 network request.
// ─────────────────────────────────────────────────────────────────────────────

const inflightRequests = new Map<string, Promise<unknown>>();

function dedupKey(endpoint: string, token?: string): string {
  return `${token ? `Bearer ${token}` : "anonymous"}::${endpoint}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Refresh — plug a handler into the shared client so that 401 responses
// automatically trigger a Supabase session refresh + Laravel resync + retry.
// Each app registers its own handler via setTokenRefreshHandler().
// ─────────────────────────────────────────────────────────────────────────────

type TokenRefreshHandler = () => Promise<string | null>;
type TokenProvider = () => Promise<string | null>;

let _refreshHandler: TokenRefreshHandler | null = null;
let _tokenProvider: TokenProvider | null = null;
let _refreshPromise: Promise<string | null> | null = null;
let _isRetrying = false;

/**
 * Register a function that will be called when the API returns 401.
 * The handler should refresh the Supabase session and return the new
 * access_token (or `null` if refresh failed).
 */
export function setTokenRefreshHandler(handler: TokenRefreshHandler) {
  _refreshHandler = handler;
}

/**
 * Register a function that returns the current auth token (Supabase JWT).
 * Called automatically on client-side requests when no explicit token is given.
 */
export function setTokenProvider(provider: TokenProvider) {
  _tokenProvider = provider;
}

/**
 * Internal: deduplicate concurrent refresh calls. Multiple 401s that arrive
 * at the same time share a single refresh call.
 */
async function getRefreshedToken(): Promise<string | null> {
  if (!_refreshHandler) return null;
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = _refreshHandler().finally(() => {
    _refreshPromise = null;
  });
  return _refreshPromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// URL normalisation
// ─────────────────────────────────────────────────────────────────────────────

function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("/")) {
    return trimmed.replace(/\/+$/, "");
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.origin + parsed.pathname.replace(/\/+$/, "");
  } catch {
    return `https://${trimmed.replace(/\/+$/, "")}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core fetch function
// ─────────────────────────────────────────────────────────────────────────────

export async function laravelFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 10000,
  token?: string
): Promise<T> {
  // Resolve the backend base URL.
  // - If NEXT_PUBLIC_API_URL is set to an absolute URL (e.g. the deployed
  //   Laravel backend), use it directly in BOTH server and client contexts.
  //   This is the most reliable path for production (Vercel → external API)
  //   and avoids depending on a Next.js rewrite to an absolute URL.
  // - Otherwise fall back to the relative "/api" path, which relies on the
  //   rewrite defined in each app's next.config.ts (dev + self-hosted).
  const configured = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL || "");
  const baseUrl = configured || "/api";

  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
    // Let the browser set Content-Type (with boundary) for FormData uploads
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
  };

  // Resolve auth token: explicit param > client-side provider > server-side param
  let resolvedToken: string | null | undefined = token ?? null;
  if (!resolvedToken && typeof window !== "undefined" && _tokenProvider) {
    resolvedToken = await _tokenProvider();
  }

  if (resolvedToken) {
    headers["Authorization"] = `Bearer ${resolvedToken}`;
  }

  // Multi-tenant: extract subdomain and pass to backend
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (!host.includes("localhost") && !/^(\d+\.){3}\d+$/.test(host)) {
      const parts = host.split(".");
      if (parts.length >= 3 && parts[0] !== "www" && parts[0] !== "api") {
        headers["X-Tenant-Slug"] = parts[0];
      }
    }
  }

  const url =
    baseUrl +
    (baseUrl.endsWith("/") && endpoint.startsWith("/")
      ? endpoint.slice(1)
      : endpoint);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  // Chain caller's abort signal with our timeout controller
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
      signal: controller.signal,
    });

    if (!res.ok) {
      // ── Token refresh interceptor ──────────────────────────────────────
      // On 401, try to refresh the session and retry the request exactly once.
      // The _isRetrying flag prevents infinite loops if the backend keeps
      // returning 401 even with a freshly issued token.
      if (res.status === 401 && _refreshHandler && !_isRetrying) {
        _isRetrying = true;
        try {
          const newToken = await getRefreshedToken();
          if (newToken) {
            return laravelFetch(endpoint, options, timeoutMs, newToken);
          }
        } finally {
          _isRetrying = false;
        }
      }

      const body = await res.json().catch(() => null);
      throw new Error(body?.message || `API error: ${res.status}`);
    }

    return res.json();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("API request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience helpers
// ─────────────────────────────────────────────────────────────────────────────

export function laravelGet<T>(
  endpoint: string,
  signal?: AbortSignal,
  token?: string
): Promise<T> {
  const key = dedupKey(endpoint, token);
  const existing = inflightRequests.get(key);
  if (existing) return existing as Promise<T>;

  const promise = laravelFetch<T>(endpoint, { method: "GET", signal }, 10000, token).finally(() => {
    // Only clear if ours is still the active entry (not replaced by a retry)
    if (inflightRequests.get(key) === promise) {
      inflightRequests.delete(key);
    }
  });
  inflightRequests.set(key, promise);
  return promise;
}

export function laravelPost<T>(
  endpoint: string,
  body?: unknown,
  timeoutMs?: number,
  token?: string
) {
  const isFormData = body instanceof FormData;
  return laravelFetch<T>(
    endpoint,
    {
      method: "POST",
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    },
    timeoutMs,
    token
  );
}

export function laravelPut<T>(
  endpoint: string,
  body?: unknown,
  token?: string
) {
  const isFormData = body instanceof FormData;
  return laravelFetch<T>(
    endpoint,
    {
      method: "PUT",
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    },
    10000,
    token
  );
}

export function laravelDelete<T>(endpoint: string, token?: string) {
  return laravelFetch<T>(endpoint, { method: "DELETE" }, 10000, token);
}

export function laravelPatch<T>(
  endpoint: string,
  body?: unknown,
  token?: string
) {
  const isFormData = body instanceof FormData;
  return laravelFetch<T>(
    endpoint,
    {
      method: "PATCH",
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    },
    10000,
    token
  );
}

// Achievement API
export function fetchAchievementCatalog<T>() {
  return laravelGet<T>("/achievements");
}

export function fetchUserAchievements<T>() {
  return laravelGet<T>("/user/achievements");
}

export function fetchRankProgress<T>() {
  return laravelGet<T>("/user/rank-progress");
}

export function fetchEcoCreditRate<T>(countryCode: string) {
  return laravelGet<T>(
    `/settings/eco-credit-rate?country_code=${countryCode}`
  );
}

// Notification API
export function fetchNotifications<T>(page = 1, perPage = 20) {
  return laravelGet<T>(`/notifications?page=${page}&per_page=${perPage}`);
}

export function fetchUnreadCount<T>() {
  return laravelGet<T>("/notifications/unread-count");
}

export function markNotificationAsRead<T>(id: string) {
  return laravelPatch<T>(`/notifications/${id}/mark-as-read`);
}

export function markAllNotificationsAsRead<T>() {
  return laravelPost<T>("/notifications/mark-all-as-read", {});
}
