"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    redirect("/login?error=Email+and+password+are+required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      redirect(`/login?mode=login&error=${encodeURIComponent("Email not confirmed. Check your inbox and click the confirmation link, then try again.")}`);
    }

    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const agreeToUpdates = String(formData.get("agreeToUpdates") ?? "").trim() === "on";

  if (!email || !password) {
    redirect("/login?error=Email+and+password+are+required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, agreeToUpdates },
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=Account+created.+Check+your+email+for+verification.");
}

export async function resendConfirmation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/login?mode=login&error=Enter+your+email+first+to+resend+confirmation.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) {
    redirect(`/login?mode=login&error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?mode=login&message=Confirmation+email+resent.+Please+check+your+inbox.");
}
