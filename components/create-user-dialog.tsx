"use client";

import { createUserAction } from "@/app/users/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateUserDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add New User</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>
            Enter the user email and temporary password. Share these credentials securely with the user.
          </DialogDescription>
        </DialogHeader>

        <form id="create-user-form" action={createUserAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="new.user@company.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Temporary password</Label>
            <Input id="password" name="password" type="text" minLength={8} required placeholder="At least 8 characters" />
          </div>
        </form>

        <DialogFooter showCloseButton>
          <Button type="submit" form="create-user-form">
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
