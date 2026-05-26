"use client";

import { UserPlus } from "lucide-react";
import { createUserAction } from "@/app/users/actions";
import { ModalPanelHeader } from "@/components/modal-panel-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSubmitButton } from "@/components/form-submit-button";
import { modalContent } from "@/lib/theme/ui-styles";

export function CreateUserDialog({ disabled = false }: { disabled?: boolean }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="highlight" disabled={disabled}>
          Add new user
        </Button>
      </DialogTrigger>
      <DialogContent className={modalContent}>
        <DialogHeader className="sr-only">
          <DialogTitle>Create user</DialogTitle>
        </DialogHeader>
        <ModalPanelHeader
          icon={UserPlus}
          title="Create user"
          description="Enter the user email and temporary password. Share these credentials securely with the user."
        />

        <form
          id="create-user-form"
          action={createUserAction}
          className="space-y-4 px-4 py-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="new.user@company.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Temporary password</Label>
            <Input
              id="password"
              name="password"
              type="text"
              minLength={8}
              required
              placeholder="At least 8 characters"
            />
          </div>
        </form>

        <DialogFooter showCloseButton>
          <FormSubmitButton form="create-user-form" variant="highlight" pendingLabel="Creating user...">
            Create user
          </FormSubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
