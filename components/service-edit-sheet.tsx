"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateServiceAction } from "@/app/actions";
import {
  LineItemsEditor,
  type EditableLineItem,
} from "@/components/line-items-editor";
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
import type { ServiceWithDetails } from "@/lib/types";

type ServiceEditSheetProps = {
  service: ServiceWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ServiceEditSheet({
  service,
  open,
  onOpenChange,
}: ServiceEditSheetProps) {
  const router = useRouter();
  const initialItems = useMemo(() => {
    if (!service) return [];
    return service.line_items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
    }));
  }, [service]);

  const [lineItems, setLineItems] = useState<EditableLineItem[]>(initialItems);
  const [active, setActive] = useState(true);

  useEffect(() => {
    setLineItems(initialItems);
    setActive(service?.active ?? true);
  }, [initialItems, service]);

  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const discount = Number(service?.default_discount_amount ?? 0);
  const total = Math.max(0, subtotal - discount);

  if (!service) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:w-1/2 sm:max-w-none">
        <SheetHeader>
          <SheetTitle>Edit invoice</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {service.client.name} — {service.currency}
          </p>
        </SheetHeader>
        <form
          action={async (formData) => {
            formData.set("lineItems", JSON.stringify(lineItems));
            formData.set("active", active ? "true" : "false");
            await updateServiceAction(formData);
            onOpenChange(false);
            router.refresh();
          }}
          className="grid gap-4 px-4 pb-6"
        >
          <input type="hidden" name="scheduleId" value={service.id} />
          <div>
            <Label htmlFor="serviceStatus">Status</Label>
            <select
              id="serviceStatus"
              value={active ? "active" : "inactive"}
              onChange={(e) => setActive(e.target.value === "active")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Active invoices appear in Ongoing Services each month. Inactive
              invoices are hidden from the board.
            </p>
          </div>
          <div>
            <Label htmlFor="editTitle">Invoice name</Label>
            <Input
              id="editTitle"
              name="title"
              required
              defaultValue={service.title}
            />
          </div>
          <LineItemsEditor items={lineItems} onChange={setLineItems} />
          <p className="text-sm font-medium">
            Estimated monthly total: {formatMoney(service.currency, total)}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="editAnchorDay">Billing day (1–28)</Label>
              <Input
                id="editAnchorDay"
                name="anchorDay"
                type="number"
                min={1}
                max={28}
                defaultValue={service.anchor_day}
              />
            </div>
            <div>
              <Label htmlFor="editPaymentTerms">Payment terms (days)</Label>
              <Input
                id="editPaymentTerms"
                name="paymentTermsDays"
                type="number"
                min={1}
                defaultValue={service.default_payment_terms_days}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="editStartDate">Start date</Label>
              <Input
                id="editStartDate"
                name="startDate"
                type="date"
                required
                defaultValue={service.start_date}
              />
            </div>
            <div>
              <Label htmlFor="editEndDate">End date (optional)</Label>
              <Input
                id="editEndDate"
                name="endDate"
                type="date"
                defaultValue={service.end_date ?? ""}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="editDiscount">Default discount</Label>
            <Input
              id="editDiscount"
              name="defaultDiscountAmount"
              type="number"
              min={0}
              step="0.01"
              defaultValue={service.default_discount_amount}
            />
          </div>
          <FormSubmitButton pendingLabel="Saving...">
            Save changes
          </FormSubmitButton>
        </form>
      </SheetContent>
    </Sheet>
  );
}
