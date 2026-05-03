import { createClient } from "@supabase/supabase-js";

function parseJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missingVars: string[] = [];
  if (!supabaseUrl) missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) missingVars.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missingVars.length > 0) {
    throw new Error(`Missing admin Supabase env vars: ${missingVars.join(", ")}.`);
  }

  const payload = parseJwtPayload(serviceRoleKey as string);
  const role = typeof payload?.role === "string" ? payload.role : "";
  if (role !== "service_role") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not a service_role key. Use the Service Role secret key from Supabase project settings.",
    );
  }

  return createClient(supabaseUrl as string, serviceRoleKey as string, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
