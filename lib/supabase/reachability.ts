import "server-only";

import type { SupabaseConfigIssue } from "@/lib/supabase/config";

export type SupabaseReachabilityStatus = { ok: true } | SupabaseConfigIssue;

export async function checkSupabaseReachability(
  url: string,
): Promise<SupabaseReachabilityStatus> {
  const { lookup } = await import("node:dns/promises");

  try {
    const hostname = new URL(url).hostname;
    await lookup(hostname);
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: `Cannot reach Supabase at ${new URL(url).hostname}. The project may be deleted, paused, or the URL in .env.local is incorrect. Update your credentials from the Supabase dashboard (Project Settings → API).`,
    };
  }
}
