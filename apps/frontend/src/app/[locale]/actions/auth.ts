"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

const LARAVEL_API = process.env.NEXT_PUBLIC_API_URL || ""

function safeUrl(base: string, path: string): string {
  let url = base;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  url = url.replace(/\/+$/, "");
  return `${url}${path}`;
}

async function syncUserToLaravel(supabaseUserId: string, email: string, name?: string, role?: string) {
  try {
    const res = await fetch(safeUrl(LARAVEL_API, "/api/auth/sync"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        supabase_auth_user_id: supabaseUserId,
        email,
        name: name || email.split("@")[0],
        role: role || undefined,
      }),
    });
    if (res.ok) {
      const body = await res.json();
      const token: string | undefined = body?.data?.token;
      if (token) {
        (await cookies()).set("laravel_token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }
    }
  } catch {
    // Laravel offline — auth still works, sync will happen on next login
  }
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "").trim()

  if (!email || !password) {
    redirect("/login?error=Email+and+password+are+required.")
  }

  const supabase = await createClient()
  const { error, data } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message))
  }

  if (data.user) {
    const role = data.user.user_metadata?.role as string | undefined;
    await syncUserToLaravel(
      data.user.id,
      data.user.email ?? email,
      data.user.user_metadata?.full_name as string | undefined,
      role,
    );
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
  const { error, data } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message))
  }

  if (data.user) {
    const role = data.user.user_metadata?.role as string | undefined;
    await syncUserToLaravel(
      data.user.id,
      data.user.email ?? email,
      data.user.user_metadata?.full_name as string | undefined,
      role,
    );
  }

  const redirectTo = String(formData.get("redirect_to") ?? "").trim() || "/login?message=Account+created"
  redirect(redirectTo)
}
