"use client";

import { useEffect, useMemo, useState } from "react";
import { createInvoiceFromServiceAction } from "@/app/actions";
import { LineItemsEditor, type EditableLineItem } from "@/components/line-items-editor";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatMoney } from "@/lib/format-money";
import type { ReminderBoardCard } from "@/lib/types";

type InvoiceDraftSheetProps = {
  reminder: ReminderBoardCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InvoiceDraftSheet({ reminder, open, onOpenChange }: InvoiceDraftSheetProps) {
  const initialItems = useMemo(() => {
    if (!reminder) return [];
    return reminder.templateLineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    }));
  }, [reminder]);

  const [lineItems, setLineItems] = useState<EditableLineItem[]>(initialItems);

  useEffect(() => {
    setLineItems(initialItems);
  }, [initialItems]);

  const items = lineItems;

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = reminder?.defaultDiscountAmount ?? 0;
  const total = Math.max(0, subtotal - discount);

  if (!reminder) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Draft invoice</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {reminder.clientName} — {reminder.serviceTitle}
          </p>
        </SheetHeader>
        <form
          action={async (formData) => {
            formData.set("lineItems", JSON.stringify(items));
            await createInvoiceFromServiceAction(formData);
            onOpenChange(false);
          }}
          className="mt-6 grid gap-4"
        >
          <input type="hidden" name="scheduleId" value={reminder.scheduleId} />
          <input type="hidden" name="periodStart" value={reminder.periodStart} />
          <input type="hidden" name="periodEnd" value={reminder.periodEnd} />
          <input type="hidden" name="discountAmount" value={discount} />
          <LineItemsEditor
            items={items}
            onChange={(next) => setLineItems(next)}
          />
          <p className="text-sm font-medium">
            Total: {formatMoney(reminder.currency, total)}
          </p>
          <FormSubmitButton pendingLabel="Creating draft...">
            Save draft invoice
          </FormSubmitButton>
        </form>
      </SheetContent>
    </Sheet>
  );
}
