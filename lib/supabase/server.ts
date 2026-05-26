import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfigStatus } from "@/lib/supabase/config";

export function getSupabaseServerClient() {
  const config = getSupabaseConfigStatus();
  if (!config.ok) {
    throw new Error(config.message);
  }

  const supabaseKey =
    config.env.serviceRoleKey || config.env.publishableKey;

  return createClient(config.env.url, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const createServerSupabaseClient = getSupabaseServerClient;
