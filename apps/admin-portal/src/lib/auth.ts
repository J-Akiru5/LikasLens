import { createClient } from "@/lib/supabase";
import { laravelPost } from "@likaslens/shared";

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("No user returned from Supabase");

  const role = data.user.user_metadata?.role as string | undefined;
  const restrictedRoles = ["citizen", "ghost", undefined];
  if (restrictedRoles.includes(role)) {
    await supabase.auth.signOut();
    throw new Error("ACCESS_DENIED");
  }

  try {
    const res = await laravelPost<{
      success: boolean;
      data: { token: string };
    }>("/auth/sync", {
      supabase_auth_user_id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0],
      role: data.user.user_metadata?.role || undefined,
    });
    if (res?.data?.token) {
      setCookie("laravel_token", res.data.token, 30);
    }
  } catch {
    // Sync failure is non-blocking
  }

  return data.user;
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
