function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

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

export async function laravelFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 10000,
  token?: string
): Promise<T> {
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL || "");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  const authToken = token || getCookie("laravel_token");
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
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

  const url = baseUrl + (baseUrl.endsWith("/") && endpoint.startsWith("/") ? endpoint.slice(1) : endpoint);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  // Chain caller's abort signal with our timeout controller
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener("abort", () => controller.abort(), { once: true });
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

export function laravelGet<T>(endpoint: string, signal?: AbortSignal, token?: string) {
  return laravelFetch<T>(endpoint, { method: "GET", signal }, 10000, token);
}

export function laravelPost<T>(endpoint: string, body?: unknown, timeoutMs?: number, token?: string) {
  return laravelFetch<T>(
    endpoint,
    {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    },
    timeoutMs,
    token
  );
}

export function laravelPut<T>(endpoint: string, body?: unknown, token?: string) {
  return laravelFetch<T>(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  }, 10000, token);
}

export function laravelDelete<T>(endpoint: string, token?: string) {
  return laravelFetch<T>(endpoint, { method: "DELETE" }, 10000, token);
}

export function laravelPatch<T>(endpoint: string, body?: unknown, token?: string) {
  return laravelFetch<T>(endpoint, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  }, 10000, token);
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
  return laravelGet<T>(`/settings/eco-credit-rate?country_code=${countryCode}`);
}
