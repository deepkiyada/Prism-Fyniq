"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type FormSubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "xs" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
  disabled?: boolean;
  form?: string;
};

export function FormSubmitButton({
  children,
  pendingLabel,
  className,
  variant = "default",
  size = "default",
  disabled = false,
  form,
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" form={form} disabled={disabled || pending} variant={variant} size={size} className={className}>
      {pending ? <Loader2 className="animate-spin" /> : null}
      {pending ? pendingLabel ?? "Processing..." : children}
    </Button>
  );
}
