type SupabaseEnv = {
  url: string;
  publishableKey: string;
  serviceRoleKey?: string;
};

export type SupabaseConfigIssue = {
  ok: false;
  message: string;
};

export type SupabaseConfigReady = {
  ok: true;
  env: SupabaseEnv;
};

export type SupabaseConfigStatus = SupabaseConfigIssue | SupabaseConfigReady;

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !publishableKey) {
    return {
      ok: false,
      message:
        "Missing Supabase env vars. Copy .env.example to .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    };
  }

  try {
    new URL(url);
  } catch {
    return {
      ok: false,
      message: "NEXT_PUBLIC_SUPABASE_URL is not a valid URL.",
    };
  }

  return {
    ok: true,
    env: {
      url,
      publishableKey,
      serviceRoleKey,
    },
  };
}

export function isSupabaseFetchError(error: unknown): boolean {
  if (error instanceof Error) {
    const cause = error.cause;
    if (cause instanceof Error) {
      return (
        cause.message.includes("ENOTFOUND") ||
        cause.message.includes("ECONNREFUSED") ||
        cause.message.includes("fetch failed")
      );
    }

    if (
      error.message.includes("fetch failed") ||
      error.name === "AuthRetryableFetchError"
    ) {
      return true;
    }
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "__isAuthError" in error &&
    error.__isAuthError === true
  ) {
    return true;
  }

  return false;
}
