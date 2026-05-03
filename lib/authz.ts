import { redirect } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AppUserRole } from "@/lib/types";

export async function getCurrentUser() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentUserRole(userId: string): Promise<AppUserRole> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (error || !data?.role) {
    return "user";
  }

  return data.role as AppUserRole;
}

export async function requireSuperAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const role = await getCurrentUserRole(user.id);
  if (role !== "super_admin") {
    redirect("/");
  }

  return user;
}
