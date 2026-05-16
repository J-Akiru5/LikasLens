import { cookies } from "next/headers"

const LARAVEL_API = process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://127.0.0.1:8000"

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

  const url = new URL(`${LARAVEL_API}${path}`)
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
