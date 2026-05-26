"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { updateServiceAction } from "@/app/actions";
import {
  LineItemsEditor,
  type EditableLineItem,
} from "@/components/line-items-editor";
import { ModalPanelHeader } from "@/components/modal-panel-header";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { formatMoney } from "@/lib/format-money";
import { sheetFooter } from "@/lib/theme/ui-styles";
import type { ServiceWithDetails } from "@/lib/types";
import { cn } from "@/lib/utils";

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
      <SheetContent className="flex w-full max-w-none! flex-col gap-0 overflow-hidden p-0 sm:w-1/2!">
        <ModalPanelHeader
          icon={FileText}
          title="Edit invoice"
          description={`${service.client.name} — ${service.currency}`}
        >
          <Badge variant={active ? "success" : "outline"}>
            {active ? "Active" : "Inactive"}
          </Badge>
          <Badge variant="info">{service.currency}</Badge>
        </ModalPanelHeader>
        <form
          action={async (formData) => {
            formData.set("lineItems", JSON.stringify(lineItems));
            formData.set("active", active ? "true" : "false");
            await updateServiceAction(formData);
            onOpenChange(false);
            router.refresh();
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <input type="hidden" name="scheduleId" value={service.id} />
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="mb-4 grid gap-4">
              <div>
                <Label htmlFor="serviceStatus">Status</Label>
                <select
                  id="serviceStatus"
                  value={active ? "active" : "inactive"}
                  onChange={(e) => setActive(e.target.value === "active")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Active invoices appear in Ongoing Services each month. Inactive invoices are
                  hidden from the board.
                </p>
              </div>
              <div>
                <Label htmlFor="editTitle">Invoice name</Label>
                <Input id="editTitle" name="title" required defaultValue={service.title} />
              </div>
            </div>
            <LineItemsEditor items={lineItems} onChange={setLineItems} />
            <p className="mt-4 rounded-lg border border-primary/15 bg-highlight/40 px-3 py-2 text-sm font-medium text-highlight-foreground">
              Estimated monthly total: {formatMoney(service.currency, total)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
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
            <div className="mt-3 grid grid-cols-2 gap-3">
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
            <div className="mt-3">
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
          </div>
          <div className={cn("shrink-0 px-6 py-4", sheetFooter)}>
            <FormSubmitButton variant="highlight" pendingLabel="Saving..." className="w-full sm:w-auto">
              Save changes
            </FormSubmitButton>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
