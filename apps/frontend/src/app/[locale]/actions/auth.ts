"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

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
  const name = String(formData.get("name") ?? "").trim() || email.split("@")[0];
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role: "citizen" },
    },
  })

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message))
  }

  const redirectTo = String(formData.get("redirect_to") ?? "").trim() || "/login?message=Account+created"
  redirect(redirectTo)
}
