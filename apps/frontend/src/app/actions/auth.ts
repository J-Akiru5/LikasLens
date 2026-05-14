"use server";

import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    redirect("/login?error=Email+and+password+are+required.");
  }

  redirect("/login?error=Authentication+service+is+temporarily+unavailable.");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    redirect("/login?error=Email+and+password+are+required.");
  }

  redirect("/login?error=Registration+service+is+temporarily+unavailable.");
}
