import Link from "next/link";
import { loginAction, resendVerificationAction } from "@/app/auth/actions";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
    showResend?: string;
    email?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params.error;
  const message = params.message;
  const nextPath = params.next ?? "/";
  const showResend = params.showResend === "1";
  const email = params.email ?? "";

  return (
    <main className="mx-auto mt-10 w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Use your account to access the invoice dashboard.</CardDescription>
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
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>

          {showResend ? (
            <form action={resendVerificationAction} className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Didn&apos;t get the verification email?</p>
              <input type="hidden" name="email" value={email} />
              <Button type="submit" variant="outline" size="sm">
                Resend verification email
              </Button>
            </form>
          ) : null}

          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link className="text-primary hover:underline" href="/auth/signup">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
