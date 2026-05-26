import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfigStatus } from "@/lib/supabase/config";

export async function createServerAuthClient() {
  const config = getSupabaseConfigStatus();
  if (!config.ok) {
    throw new Error(config.message);
  }

  const cookieStore = await cookies();

  return createServerClient(
    config.env.url,
    config.env.publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot mutate cookies. Middleware refreshes sessions.
          }
        },
      },
    },
  );
}
