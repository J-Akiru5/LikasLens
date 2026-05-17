export async function laravelFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
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
