import { cookies } from "next/headers"

const LARAVEL_API = process.env.NEXT_PUBLIC_API_URL || ""

function safeUrl(base: string, path: string): string {
  const trimmed = base.trim();
  if (!trimmed) return path;
  let fullUrl: string;
  try {
    const parsed = new URL(trimmed);
    fullUrl = parsed.origin + parsed.pathname.replace(/\/+$/, "");
  } catch {
    fullUrl = `https://${trimmed.replace(/\/+$/, "")}`;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${fullUrl}${normalizedPath}`;
}

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get("laravel_token")?.value ?? null
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string>
}

export async function laravelFetch<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const token = await getToken()
  const { params, ...fetchOpts } = options

  const urlStr = safeUrl(LARAVEL_API, path)
  const url = new URL(urlStr)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const headers: Record<string, string> = {
    ...(fetchOpts.headers as Record<string, string>),
    Accept: "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  if (fetchOpts.body && typeof fetchOpts.body === "string") {
    headers["Content-Type"] = "application/json"
  }

  const res = await fetch(url.toString(), { ...fetchOpts, headers })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Laravel API error ${res.status}: ${text}`)
  }

  return res.json()
}

export async function laravelGet<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
  return laravelFetch<T>(path, { params, method: "GET" })
}

export async function laravelPost<T = unknown>(path: string, body: unknown): Promise<T> {
  return laravelFetch<T>(path, { method: "POST", body: JSON.stringify(body) })
}
