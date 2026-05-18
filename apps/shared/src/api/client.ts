function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function laravelFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = getCookie("laravel_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `API error: ${res.status}`);
  }

  return res.json();
}

export function laravelGet<T>(endpoint: string, signal?: AbortSignal) {
  return laravelFetch<T>(endpoint, { method: "GET", signal });
}

export function laravelPost<T>(endpoint: string, body?: unknown) {
  return laravelFetch<T>(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function laravelPut<T>(endpoint: string, body?: unknown) {
  return laravelFetch<T>(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function laravelDelete<T>(endpoint: string) {
  return laravelFetch<T>(endpoint, { method: "DELETE" });
}

export function laravelPatch<T>(endpoint: string, body?: unknown) {
  return laravelFetch<T>(endpoint, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
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
