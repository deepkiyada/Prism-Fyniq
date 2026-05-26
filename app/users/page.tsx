import { updateUserRoleAction } from "@/app/users/actions";
import { PageHeader } from "@/components/page-header";
import { ThemedCard } from "@/components/themed-card";
import { requireSuperAdmin } from "@/lib/authz";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/types";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type UsersPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export const dynamic = "force-dynamic";

export default async function UsersPage({ searchParams }: UsersPageProps) {
  await requireSuperAdmin();
  const params = await searchParams;
  const supabase = getSupabaseServerClient();
  const isAdminConfigReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const sanitizedError =
    params.error && params.error.includes("NEXT_REDIRECT")
      ? "Action was interrupted. Please retry. If it persists, reload the page."
      : params.error;

  const { data, error } = await supabase
    .from("app_users")
    .select("user_id, email, role, created_at")
    .order("created_at", { ascending: true });

  const users = (data ?? []) as AppUser[];
  const loadError = error ? error.message : "";

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title="Users & roles"
        description="Super admins can create users, view all users, and assign role access."
      />

      <ThemedCard title="User onboarding" tone="accent">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Create users via modal to keep this page clean and focused.
            {!isAdminConfigReady
              ? " Configure SUPABASE_SERVICE_ROLE_KEY in .env.local to enable this."
              : ""}
          </p>
          <CreateUserDialog disabled={!isAdminConfigReady} />
        </div>
      </ThemedCard>

      {sanitizedError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {sanitizedError}
        </p>
      ) : null}

      {params.message ? (
        <p className="rounded-md border border-success/30 bg-success-muted px-3 py-2 text-sm text-success">
          {params.message}
        </p>
      ) : null}

      <ThemedCard title="All users" tone="info">
        {loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Current role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "super_admin" ? "highlight" : "accent"}>
                        {user.role === "super_admin" ? "Super admin" : "Normal user"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={updateUserRoleAction} className="inline-flex items-center gap-2">
                        <input type="hidden" name="userId" value={user.user_id} />
                        <input
                          type="hidden"
                          name="role"
                          value={user.role === "super_admin" ? "user" : "super_admin"}
                        />
                        <FormSubmitButton variant="outline" size="sm" pendingLabel="Updating...">
                          {user.role === "super_admin" ? "Set as normal user" : "Make super admin"}
                        </FormSubmitButton>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </ThemedCard>
    </main>
  );
}
