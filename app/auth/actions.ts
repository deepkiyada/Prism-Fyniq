"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function getBaseUrl() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return origin;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${proto}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function loginAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const nextPath = getString(formData, "next") || "/";

  if (!email || !password) {
    redirect(`/auth/login?error=${encodeURIComponent("Email and password are required.")}`);
  }

  const supabase = await createServerAuthClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const isUnverified = error.message.toLowerCase().includes("email not confirmed");
    if (isUnverified) {
      redirect(
        `/auth/login?error=${encodeURIComponent("Please verify your email before signing in.")}&showResend=1&email=${encodeURIComponent(email)}`,
      );
    }
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(nextPath.startsWith("/") ? nextPath : "/");
}

export async function signupAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!email || !password || password.length < 8) {
    redirect(
      `/auth/signup?error=${encodeURIComponent("Use a valid email and a password with at least 8 characters.")}`,
    );
  }

  const supabase = await createServerAuthClient();
  const baseUrl = await getBaseUrl();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${baseUrl}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    redirect(
      `/auth/login?message=${encodeURIComponent("Account created. Check your inbox and verify your email before signing in.")}&showResend=1&email=${encodeURIComponent(email)}`,
    );
  }

  redirect("/?message=Account created and signed in.");
}

export async function resendVerificationAction(formData: FormData) {
  const email = getString(formData, "email");

  if (!email) {
    redirect(`/auth/login?error=${encodeURIComponent("Enter an email to resend verification.")}`);
  }

  const supabase = await createServerAuthClient();
  const baseUrl = await getBaseUrl();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${baseUrl}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}&email=${encodeURIComponent(email)}&showResend=1`);
  }

  redirect(
    `/auth/login?message=${encodeURIComponent("Verification email sent. Please check your inbox.")}&email=${encodeURIComponent(email)}&showResend=1`,
  );
}
