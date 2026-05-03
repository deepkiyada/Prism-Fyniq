import { loginAction } from "@/app/auth/actions";
import { PasswordInput } from "@/components/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/brand-mark";
import { FormSubmitButton } from "@/components/form-submit-button";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
    email?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params.error;
  const message = params.message;
  const nextPath = params.next ?? "/";
  const email = params.email ?? "";

  return (
    <main className="mx-auto mt-10 w-full max-w-md">
      <BrandMark className="mb-4" subtitle="Secure sign-in portal" />
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Use your account to access the invoice dashboard. This is an invite-only system. Contact your super admin
            to get access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
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
            <FormSubmitButton className="w-full" pendingLabel="Signing in...">
              Sign in
            </FormSubmitButton>
          </form>

          <p className="text-sm text-muted-foreground">
            Need access? Ask a super admin to create your account from the Users page.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
