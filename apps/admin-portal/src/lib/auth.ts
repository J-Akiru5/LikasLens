import { createClient } from "@/lib/supabase";

/**
 * Demo accounts that are auto-provisioned on first login if they don't
 * exist yet in the Supabase instance. Keeps the demo pitch smooth:
 * one-click auto-fill on the login page works on any environment.
 */
export const DEMO_ACCOUNTS: Record<string, { role: string; full_name: string }> = {
  "analyst@likaslens.ph": { role: "analyst", full_name: "Juan Dela Cruz" },
  "analyst@likaslens.gov": { role: "analyst", full_name: "Juan Dela Cruz" },
  "lgu@likaslens.ph": { role: "lgu", full_name: "Maria Santos" },
  "superadmin@likaslens.ph": { role: "super_admin", full_name: "Platform Administrator" },
};

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  let { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  // If a demo account fails to sign in, provision (or repair) it server-side.
  // A client-side signUp would leave the account unconfirmed when email
  // confirmation is enabled, so the retry would keep failing. The API route
  // uses the service role key + email_confirm=true instead.
  if (error && DEMO_ACCOUNTS[email.trim()]) {
    try {
      await fetch("/api/v1/auth/demo-provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
    } catch {
      // Provisioning is best-effort — if it fails, surface the original error
    }

    // Retry sign in with the (now confirmed) demo account
    const retry = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    data = retry.data;
    error = retry.error;
  }

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("No user returned from Supabase");

  const role = data.user.user_metadata?.role as string | undefined;
  const restrictedRoles = ["citizen", "ghost", undefined];
  if (restrictedRoles.includes(role)) {
    await supabase.auth.signOut();
    throw new Error("ACCESS_DENIED");
  }

  return data.user;
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

