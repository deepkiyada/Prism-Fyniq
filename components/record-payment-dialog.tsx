"use client";

import { format } from "date-fns";
import { recordPaymentAction } from "@/app/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/format-money";
import type { InvoiceWithDetails } from "@/lib/types";

type RecordPaymentDialogProps = {
  invoice: InvoiceWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RecordPaymentDialog({
  invoice,
  open,
  onOpenChange,
}: RecordPaymentDialogProps) {
  if (!invoice) return null;

  const paidSoFar = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Math.max(0, invoice.total - paidSoFar);
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {invoice.invoice_number} — {invoice.client.name}
          </p>
        </DialogHeader>
        <form
          action={async (formData) => {
            await recordPaymentAction(formData);
            onOpenChange(false);
          }}
          className="grid gap-4"
        >
          <input type="hidden" name="invoiceId" value={invoice.id} />
          <p className="text-sm">
            Outstanding: {formatMoney(invoice.currency, remaining)}
          </p>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min={0.01}
              step="0.01"
              defaultValue={remaining}
              required
            />
          </div>
          <div>
            <Label htmlFor="method">Method</Label>
            <Input id="method" name="method" placeholder="Bank transfer, UPI, etc." />
          </div>
          <div>
            <Label htmlFor="paidAt">Paid on</Label>
            <Input id="paidAt" name="paidAt" type="date" defaultValue={today} required />
          </div>
          
          <div>
            <Label htmlFor="note">Note</Label>
            <Input id="note" name="note" placeholder="Optional" />
          </div>
          <FormSubmitButton pendingLabel="Saving payment...">Record payment</FormSubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
