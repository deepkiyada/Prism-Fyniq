"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { format, parse } from "date-fns";
import { CalendarDays, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createInvoiceFromServiceAction } from "@/app/actions";
import { LineItemsEditor, type EditableLineItem } from "@/components/line-items-editor";
import { ModalPanelHeader } from "@/components/modal-panel-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
} from "@/components/ui/sheet";
import { formatMoney } from "@/lib/format-money";
import { sheetFooter } from "@/lib/theme/ui-styles";
import { cn } from "@/lib/utils";
import type { InvoiceBoardCard, OngoingServiceCard } from "@/lib/types";

type InvoiceDraftSheetProps = {
  ongoing: OngoingServiceCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceCreated?: (card: InvoiceBoardCard) => void;
};

function formatPeriodLabel(start: string, end: string) {
  const startDate = parse(start, "yyyy-MM-dd", new Date());
  const endDate = parse(end, "yyyy-MM-dd", new Date());
  return `${format(startDate, "MMM d")} – ${format(endDate, "MMM d, yyyy")}`;
}

function InvoiceTotals({
  currency,
  subtotal,
  discount,
  total,
}: {
  currency: string;
  subtotal: number;
  discount: number;
  total: number;
}) {
  return (
    <div className="space-y-2 rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="tabular-nums">{formatMoney(currency, subtotal)}</span>
      </div>
      {discount > 0 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Discount</span>
          <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
            −{formatMoney(currency, discount)}
          </span>
        </div>
      ) : null}
      <Separator />
      <div className="flex items-center justify-between">
        <span className="font-medium">Invoice total</span>
        <span className="text-lg font-semibold tabular-nums">{formatMoney(currency, total)}</span>
      </div>
    </div>
  );
}

export function InvoiceDraftSheet({
  ongoing,
  open,
  onOpenChange,
  onInvoiceCreated,
}: InvoiceDraftSheetProps) {
  const [lineItems, setLineItems] = useState<EditableLineItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialItems = useMemo(() => {
    if (!ongoing) return [];
    return ongoing.templateLineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    }));
  }, [ongoing]);

  useEffect(() => {
    setLineItems(initialItems);
  }, [initialItems]);

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = ongoing?.defaultDiscountAmount ?? 0;
  const total = Math.max(0, subtotal - discount);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ongoing || isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    formData.set("lineItems", JSON.stringify(lineItems));

    setIsSubmitting(true);
    try {
      const result = await createInvoiceFromServiceAction(formData);
      if (result.invoiceCard) {
        onInvoiceCreated?.(result.invoiceCard);
        onOpenChange(false);
        toast.success("Invoice saved — moved to Draft");
        return;
      }
      if (!result.ok) {
        toast.error("Could not save draft invoice. Please try again.");
      }
    } catch {
      toast.error("Could not save draft invoice. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ongoing) return null;

  const periodLabel = formatPeriodLabel(ongoing.periodStart, ongoing.periodEnd);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full max-w-none! flex-col gap-0 overflow-hidden p-0 sm:w-1/2!">
        <ModalPanelHeader
          icon={FileText}
          title="Create draft invoice"
          description={`${ongoing.clientName} · ${ongoing.invoiceName}`}
        >
          <Badge variant="accent" className="gap-1 font-normal">
            <CalendarDays className="size-3" />
            {periodLabel}
          </Badge>
          <Badge variant="highlight" className="font-normal">
            Billing day {ongoing.anchorDay}
          </Badge>
          <Badge variant="outline" className="font-normal">
            {ongoing.defaultPaymentTermsDays} day terms
          </Badge>
          <Badge variant="info" className="font-normal">
            {ongoing.currency}
          </Badge>
        </ModalPanelHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="scheduleId" value={ongoing.scheduleId} />
          <input type="hidden" name="periodStart" value={ongoing.periodStart} />
          <input type="hidden" name="periodEnd" value={ongoing.periodEnd} />
          <input type="hidden" name="discountAmount" value={discount} />

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <LineItemsEditor
              items={lineItems}
              onChange={setLineItems}
              currency={ongoing.currency}
            />
          </div>

          <SheetFooter className={cn("shrink-0 flex-col gap-4 px-6 py-5 sm:flex-col", sheetFooter)}>
            <InvoiceTotals
              currency={ongoing.currency}
              subtotal={subtotal}
              discount={discount}
              total={total}
            />
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <SheetClose asChild>
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  Cancel
                </Button>
              </SheetClose>
              <Button type="submit" variant="highlight" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : null}
                {isSubmitting ? "Creating draft..." : "Save draft invoice"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
