import { createClient } from "@/lib/supabase";

/**
 * NOTE: there is deliberately no demo-account list here any more.
 *
 * This file used to export `DEMO_ACCOUNTS` and, on a failed sign-in for one of
 * those addresses, call `/api/v1/auth/demo-provision` — an unauthenticated
 * service-role route that would create the account or reset its password. That
 * combination meant anyone who knew a demo address could have a working
 * privileged login provisioned for them. The route and the list are both gone.
 *
 * Demo accounts are provisioned out of band, and their passwords are not in
 * this repository. See supabase/README.md.
 */

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("No user returned from Supabase");

  const role = data.user.app_metadata?.role as string | undefined;
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
