import { createClient } from "@/lib/supabase";

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  let { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  // If demo account does not exist yet in this Supabase instance, auto-provision it
  if (error && (email.trim() === "analyst@likaslens.ph" || email.trim() === "analyst@likaslens.gov")) {
    const signUpRes = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: "Juan Dela Cruz",
          role: "analyst",
        },
      },
    });

    if (!signUpRes.error && signUpRes.data.user) {
      // Retry sign in with newly created demo analyst
      const retry = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      data = retry.data;
      error = retry.error;
    }
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

