import { loginAction } from "@/app/auth/actions";
import { PasswordInput } from "@/components/password-input";
import { ThemedCard } from "@/components/themed-card";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/brand-mark";
import { FormSubmitButton } from "@/components/form-submit-button";
import { getSupabaseConfigStatus } from "@/lib/supabase/config";
import { checkSupabaseReachability } from "@/lib/supabase/reachability";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
    email?: string;
    config?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params.error;
  const message = params.message;
  const nextPath = params.next ?? "/";
  const email = params.email ?? "";
  const configStatus = getSupabaseConfigStatus();
  const reachability =
    configStatus.ok ? await checkSupabaseReachability(configStatus.env.url) : configStatus;
  const configMessage =
    reachability.ok === false
      ? reachability.message
      : params.config === "unreachable"
        ? "Supabase is unreachable. Check NEXT_PUBLIC_SUPABASE_URL in .env.local and restart the dev server."
        : params.config === "missing"
          ? "Supabase is not configured. Copy .env.example to .env.local and add your project credentials."
          : null;

  return (
    <main className="mx-auto mt-10 w-full max-w-md">
      <BrandMark className="mb-4" subtitle="Secure sign-in portal" />
      <ThemedCard
        title="Sign in"
        description="Use your account to access the invoice dashboard. This is an invite-only system. Contact your super admin to get access."
        tone="highlight"
        headerClassName="[&_[data-slot=card-title]]:text-2xl"
      >
        <CardContent className="space-y-4 px-0">
          {configMessage ? (
            <p className="rounded-md border border-warning/30 bg-warning-muted px-3 py-2 text-sm text-warning-foreground">
              {configMessage}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-md border border-success/30 bg-success-muted px-3 py-2 text-sm text-success">
              {message}
            </p>
          ) : null}

          <form action={loginAction} className="space-y-4">
            <input type="hidden" name="next" value={nextPath} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" defaultValue={email} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" name="password" autoComplete="current-password" minLength={8} required />
            </div>
            <FormSubmitButton variant="highlight" className="w-full" pendingLabel="Signing in...">
              Sign in
            </FormSubmitButton>
          </form>

          <p className="text-sm text-muted-foreground">
            Need access? Ask a super admin to create your account from the Users page.
          </p>
        </CardContent>
      </ThemedCard>
    </main>
  );
}
