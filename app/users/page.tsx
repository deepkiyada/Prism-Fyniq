import { updateUserRoleAction } from "@/app/users/actions";
import { requireSuperAdmin } from "@/lib/authz";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateUserDialog } from "@/components/create-user-dialog";
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

  const { data, error } = await supabase
    .from("app_users")
    .select("user_id, email, role, created_at")
    .order("created_at", { ascending: true });

  const users = (data ?? []) as AppUser[];
  const loadError = error ? error.message : "";

  return (
    <main className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Users & Roles</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Super admins can create users, view all users, and assign role access.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Onboarding</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Create users via modal to keep this page clean and focused.</p>
          <CreateUserDialog />
        </CardContent>
      </Card>

      {params.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {params.error}
        </p>
      ) : null}

      {params.message ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          {params.message}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
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
                      <TableCell>{user.role === "super_admin" ? "Super admin" : "Normal user"}</TableCell>
                      <TableCell className="text-right">
                        <form action={updateUserRoleAction} className="inline-flex items-center gap-2">
                          <input type="hidden" name="userId" value={user.user_id} />
                          <input
                            type="hidden"
                            name="role"
                            value={user.role === "super_admin" ? "user" : "super_admin"}
                          />
                          <Button type="submit" variant="outline" size="sm">
                            {user.role === "super_admin" ? "Set as Normal User" : "Make Super Admin"}
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
