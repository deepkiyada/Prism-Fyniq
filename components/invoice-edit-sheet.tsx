"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { format, parse } from "date-fns";
import { CalendarDays, FileDown, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateInvoiceAction } from "@/app/actions";
import { LineItemsEditor, type EditableLineItem } from "@/components/line-items-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatMoney } from "@/lib/format-money";
import type { InvoiceBoardCard, InvoiceWithDetails } from "@/lib/types";

type InvoiceEditSheetProps = {
  invoice: InvoiceWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceUpdated?: (card: InvoiceBoardCard) => void;
};

function formatPeriodLabel(start: string, end: string) {
  const startDate = parse(start, "yyyy-MM-dd", new Date());
  const endDate = parse(end, "yyyy-MM-dd", new Date());
  return `${format(startDate, "MMM d")} – ${format(endDate, "MMM d, yyyy")}`;
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
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

export function InvoiceEditSheet({
  invoice,
  open,
  onOpenChange,
  onInvoiceUpdated,
}: InvoiceEditSheetProps) {
  const [lineItems, setLineItems] = useState<EditableLineItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialItems = useMemo(() => {
    if (!invoice) return [];
    return invoice.line_items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
    }));
  }, [invoice]);

  useEffect(() => {
    setLineItems(initialItems);
    setDiscountAmount(Number(invoice?.discount_amount ?? 0));
  }, [initialItems, invoice]);

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = Math.max(0, subtotal - discountAmount);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invoice || isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    formData.set("lineItems", JSON.stringify(lineItems));
    formData.set("discountAmount", String(discountAmount));

    setIsSubmitting(true);
    try {
      const result = await updateInvoiceAction(formData);
      if (result.ok && result.invoiceCard) {
        onInvoiceUpdated?.(result.invoiceCard);
        onOpenChange(false);
        toast.success("Invoice updated");
        return;
      }
      toast.error("Could not save invoice. Please try again.");
    } catch {
      toast.error("Could not save invoice. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!invoice) return null;

  const periodLabel = formatPeriodLabel(
    invoice.service_period_start,
    invoice.service_period_end,
  );
  const paidSoFar = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:w-1/2 sm:max-w-none">
        <SheetHeader className="shrink-0 border-b px-6 py-5">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <SheetTitle className="text-lg">Edit invoice</SheetTitle>
              <SheetDescription className="line-clamp-2">
                {invoice.client.name} · {invoice.invoice_number}
              </SheetDescription>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="font-normal capitalize">
              {statusLabel(invoice.status)}
            </Badge>
            <Badge variant="secondary" className="gap-1 font-normal">
              <CalendarDays className="size-3" />
              {periodLabel}
            </Badge>
            <Badge variant="outline" className="font-normal">
              {invoice.currency}
            </Badge>
            {paidSoFar > 0 ? (
              <Badge variant="outline" className="font-normal">
                Paid {formatMoney(invoice.currency, paidSoFar)}
              </Badge>
            ) : null}
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link
                href={`/api/invoices/${invoice.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileDown className="size-3.5" />
                View PDF
              </Link>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link
                href={`/api/invoices/${invoice.id}/docx`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="size-3.5" />
                View DOCX
              </Link>
            </Button>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="invoiceId" value={invoice.id} />

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="issueDate">Issue date</Label>
                <Input
                  id="issueDate"
                  name="issueDate"
                  type="date"
                  required
                  defaultValue={invoice.issue_date}
                  key={`issue-${invoice.id}-${invoice.issue_date}`}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due date</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  required
                  defaultValue={invoice.due_date}
                  key={`due-${invoice.id}-${invoice.due_date}`}
                />
              </div>
            </div>
            <LineItemsEditor
              items={lineItems}
              onChange={setLineItems}
              currency={invoice.currency}
            />
            <div className="mt-4">
              <Label htmlFor="discountAmount">Discount</Label>
              <Input
                id="discountAmount"
                type="number"
                min={0}
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <SheetFooter className="shrink-0 flex-col gap-4 border-t bg-muted/30 px-6 py-5 sm:flex-col">
            <InvoiceTotals
              currency={invoice.currency}
              subtotal={subtotal}
              discount={discountAmount}
              total={total}
            />
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <SheetClose asChild>
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  Cancel
                </Button>
              </SheetClose>
              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : null}
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
