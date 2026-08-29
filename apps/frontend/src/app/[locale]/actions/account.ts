"use server"

import { createClient } from "@/utils/supabase/server"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No authenticated user found." }
  }

  const userId = user.id

  // Delete user from Supabase via Admin API
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return { success: false, error: "Server misconfiguration: missing service role key." }
  }

  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    return { success: false, error: `Failed to delete account: ${body}` }
  }

  // Sign out to clear session cookies
  await supabase.auth.signOut()

  return { success: true }
}
