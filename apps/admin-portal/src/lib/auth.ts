import { createClient } from "@/lib/supabase";

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

  return data.user;
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
