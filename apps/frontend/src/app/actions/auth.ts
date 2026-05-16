"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

const LARAVEL_API = process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://127.0.0.1:8000"

async function syncWithLaravel(supabaseUserId: string, email: string, name?: string) {
  try {
    const res = await fetch(`${LARAVEL_API}/api/auth/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supabase_auth_user_id: supabaseUserId,
        email,
        name: name || email.split("@")[0],
      }),
    })
    if (res.ok) {
      const data = await res.json()
      const cookieStore = await cookies()
      cookieStore.set("laravel_token", data.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      })
    }
  } catch {
    // Laravel sync is optional — Supabase auth alone is sufficient for frontend
  }
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "").trim()

  if (!email || !password) {
    redirect("/login?error=Email+and+password+are+required.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message))
  }

  if (data.user) {
    await syncWithLaravel(data.user.id, data.user.email ?? email, data.user.user_metadata?.name)
  }

  const redirectTo = String(formData.get("redirect_to") ?? "").trim() || "/dashboard"
  redirect(redirectTo)
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "").trim()

  if (!email || !password) {
    redirect("/login?error=Email+and+password+are+required.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message))
  }

  if (data.user) {
    await syncWithLaravel(data.user.id, data.user.email ?? email, data.user.user_metadata?.name)
  }

  const redirectTo = String(formData.get("redirect_to") ?? "").trim() || "/login?message=Account+created"
  redirect(redirectTo)
}

export async function getLaravelToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get("laravel_token")?.value ?? null
}

export async function clearLaravelToken() {
  const cookieStore = await cookies()
  cookieStore.delete("laravel_token")
}
