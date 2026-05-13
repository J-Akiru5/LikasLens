"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

export async function signIn(formData) {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "").trim()

  if (!email || !password) {
    redirect("/login?error=Email+and+password+are+required.")
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message))
  }

  redirect("/dashboard")
}

export async function signUp(formData) {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "").trim()

  if (!email || !password) {
    redirect("/login?error=Email+and+password+are+required.")
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message))
  }

  redirect("/login?message=Account+created")
}
