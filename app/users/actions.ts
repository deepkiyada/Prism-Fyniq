"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/authz";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppUserRole } from "@/lib/types";

function getRoleValue(input: FormDataEntryValue | null): AppUserRole | null {
  if (input !== "super_admin" && input !== "user") {
    return null;
  }

  return input;
}

export async function createUserAction(formData: FormData) {
  await requireSuperAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password || password.length < 8) {
    redirect("/users?error=Provide a valid email and a password with at least 8 characters.");
  }

  const adminSupabase = getSupabaseAdminClient();
  const { data, error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    redirect(`/users?error=${encodeURIComponent(error.message)}`);
  }

  const createdUserId = data.user?.id;
  if (!createdUserId) {
    redirect("/users?error=Failed to create user.");
  }

  const supabase = getSupabaseServerClient();
  const { error: upsertError } = await supabase.from("app_users").upsert({
    user_id: createdUserId,
    email,
    role: "user",
    updated_at: new Date().toISOString(),
  });

  if (upsertError) {
    redirect(`/users?error=${encodeURIComponent(upsertError.message)}`);
  }

  revalidatePath("/users");
  redirect("/users?message=User created successfully.");
}

export async function updateUserRoleAction(formData: FormData) {
  const currentUser = await requireSuperAdmin();
  const targetUserId = String(formData.get("userId") ?? "");
  const nextRole = getRoleValue(formData.get("role"));

  if (!targetUserId || !nextRole) {
    redirect("/users?error=Invalid role update request.");
  }

  const supabase = getSupabaseServerClient();

  if (targetUserId === currentUser.id && nextRole === "user") {
    const { count, error: countError } = await supabase
      .from("app_users")
      .select("*", { count: "exact", head: true })
      .eq("role", "super_admin");

    if (countError) {
      redirect(`/users?error=${encodeURIComponent(countError.message)}`);
    }

    if ((count ?? 0) <= 1) {
      redirect("/users?error=At least one super admin is required.");
    }
  }

  const { error } = await supabase
    .from("app_users")
    .update({ role: nextRole, updated_at: new Date().toISOString() })
    .eq("user_id", targetUserId);

  if (error) {
    redirect(`/users?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/users");
  redirect("/users?message=User role updated successfully.");
}
