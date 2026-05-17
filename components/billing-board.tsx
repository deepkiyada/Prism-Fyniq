"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { FileDown, FileText } from "lucide-react";
import { toast } from "sonner";
import { updateInvoiceBoardStageAction } from "@/app/actions";
import { CreateServiceDialog } from "@/components/create-service-dialog";
import { InvoiceDraftSheet } from "@/components/invoice-draft-sheet";
import { RecordPaymentDialog } from "@/components/record-payment-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { invoiceToBoardStage } from "@/lib/billing-board";
import { formatMoney } from "@/lib/format-money";
import type {
  BillingBoardCard,
  BillingBoardData,
  BoardStage,
  InvoiceWithDetails,
  ReminderBoardCard,
} from "@/lib/types";
import { FormSubmitButton } from "@/components/form-submit-button";
import { triggerRecurringGenerationAction } from "@/app/actions";

const COLUMNS: { key: BoardStage; label: string }[] = [
  { key: "reminder_due", label: "Reminder due" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "paid", label: "Paid" },
  { key: "done", label: "Done" },
];

function getCardStage(card: BillingBoardCard): BoardStage {
  if (card.kind === "reminder") return "reminder_due";
  return card.stage;
}

type BillingBoardProps = {
  data: BillingBoardData;
};

function BoardColumn({
  stage,
  label,
  cards,
  onCreateInvoice,
  onRecordPayment,
}: {
  stage: BoardStage;
  label: string;
  cards: BillingBoardCard[];
  onCreateInvoice: (reminder: ReminderBoardCard) => void;
  onRecordPayment: (invoice: InvoiceWithDetails) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`w-[260px] shrink-0 rounded-lg border p-3 ${isOver ? "bg-muted" : "bg-card"}`}
    >
      <p className="mb-3 text-sm font-semibold">
        {label} ({cards.length})
      </p>
      <div className="space-y-2">
        {cards.map((card) =>
          card.kind === "reminder" ? (
            <ReminderCard key={card.id} card={card} onCreateInvoice={onCreateInvoice} />
          ) : (
            <DraggableInvoiceCard
              key={card.invoice.id}
              invoice={card.invoice}
              onRecordPayment={onRecordPayment}
            />
          ),
        )}
      </div>
    </div>
  );
}

function ReminderCard({
  card,
  onCreateInvoice,
}: {
  card: ReminderBoardCard;
  onCreateInvoice: (reminder: ReminderBoardCard) => void;
}) {
  return (
    <Card className="border-dashed">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm">{card.serviceTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-0 text-xs text-muted-foreground">
        <p>{card.clientName}</p>
        <p>{formatMoney(card.currency, card.estimatedTotal)}</p>
        <p>Billing day: {card.anchorDay}</p>
        <Button type="button" size="sm" className="w-full" onClick={() => onCreateInvoice(card)}>
          Create invoice
        </Button>
      </CardContent>
    </Card>
  );
}

function DraggableInvoiceCard({
  invoice,
  onRecordPayment,
}: {
  invoice: InvoiceWithDetails;
  onRecordPayment: (invoice: InvoiceWithDetails) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: invoice.id,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1,
  };
  const paidSoFar = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const isPartial = paidSoFar > 0 && paidSoFar < invoice.total;

  return (
    <Card ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-grab">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm">{invoice.invoice_number}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-0 text-xs">
        <p className="text-muted-foreground">{invoice.client.name}</p>
        <p className="font-medium">{formatMoney(invoice.currency, invoice.total)}</p>
        {isPartial ? <Badge variant="secondary">Partial payment</Badge> : null}
        {invoice.month_closed ? <Badge variant="outline">Month closed</Badge> : null}
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onRecordPayment(invoice);
            }}
          >
            Record payment
          </Button>
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="sm" asChild className="justify-start px-2">
              <Link href={`/api/invoices/${invoice.id}/pdf`} target="_blank">
                <FileDown className="size-3.5" />
                PDF
              </Link>
            </Button>
            <Button type="button" variant="ghost" size="sm" asChild className="justify-start px-2">
              <Link href={`/api/invoices/${invoice.id}/docx`} target="_blank">
                <FileText className="size-3.5" />
                DOCX
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}




export function BillingBoard({ data }: BillingBoardProps) {
  const router = useRouter();
  const [cards, setCards] = useState(data.cards);
  const [draftReminder, setDraftReminder] = useState<ReminderBoardCard | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceWithDetails | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    setCards(data.cards);
  }, [data.cards]);

  const grouped = useMemo(() => {
    return COLUMNS.reduce(
      (acc, column) => {
        acc[column.key] = cards.filter((card) => getCardStage(card) === column.key);
        return acc;
      },
      {} as Record<BoardStage, BillingBoardCard[]>,
    );
  }, [cards]);

  const handleDragEnd = async (event: DragEndEvent) => {
    if (isUpdating) return;
    const targetStage = event.over?.id as BoardStage | undefined;
    const invoiceId = String(event.active.id);
    if (!targetStage || targetStage === "reminder_due") return;

    const invoiceCard = cards.find(
      (c): c is Extract<BillingBoardCard, { kind: "invoice" }> =>
        c.kind === "invoice" && c.invoice.id === invoiceId,
    );
    if (!invoiceCard) return;

    const previousStage = invoiceToBoardStage(invoiceCard.invoice);

    setCards((current) =>
      current.map((card) =>
        card.kind === "invoice" && card.invoice.id === invoiceId
          ? {
              ...card,
              stage: targetStage,
              invoice: {
                ...card.invoice,
                status:
                  targetStage === "draft"
                    ? "draft"
                    : targetStage === "sent"
                      ? "sent"
                      : targetStage === "paid"
                        ? "pending_payment"
                        : "paid",
                month_closed: targetStage === "done",
              },
            }
          : card,
      ),
    );

    try {
      setIsUpdating(true);
      await updateInvoiceBoardStageAction(invoiceId, targetStage);
      toast.success("Moved to " + COLUMNS.find((c) => c.key === targetStage)?.label);
      router.refresh();
    } catch {
      setCards((current) =>
        current.map((card) =>
          card.kind === "invoice" && card.invoice.id === invoiceId
            ? { ...card, stage: previousStage }
            : card,
        ),
      );
      toast.error("Could not update stage.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <BoardShell>
      <BoardHeader data={data} />
      <InvoiceDraftSheet
        reminder={draftReminder}
        open={Boolean(draftReminder)}
        onOpenChange={(open) => !open && setDraftReminder(null)}
      />
      <RecordPaymentDialog
        invoice={paymentInvoice}
        open={Boolean(paymentInvoice)}
        onOpenChange={(open) => !open && setPaymentInvoice(null)}
      />
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <BoardColumns>
          {COLUMNS.map((column) => (
            <BoardColumn
              key={column.key}
              stage={column.key}
              label={column.label}
              cards={grouped[column.key] ?? []}
              onCreateInvoice={setDraftReminder}
              onRecordPayment={setPaymentInvoice}
            />
          ))}
        </BoardColumns>
      </DndContext>
    </BoardShell>
  );
}

function BoardShell({ children }: { children: React.ReactNode }) {
  const El = "div";
  return <El className="flex min-w-0 max-w-full flex-col gap-6">{children}</El>;
}

function BoardHeader({ data }: { data: BillingBoardData }) {
  const router = useRouter();
  const El = "div";
  return (
    <El className="flex min-w-0 flex-wrap items-end justify-between gap-4">
      <El className="min-w-0">
        <h1 className="text-xl font-semibold">Monthly billing board</h1>
        <p className="text-sm text-muted-foreground">
          Track retainers from reminder through payment for each client service.
        </p>
      </El>
      <El className="flex flex-wrap items-center gap-2">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const month = new FormData(e.currentTarget).get("month") as string;
            router.push(`/?month=${month}`);
          }}
        >
          <Input type="month" name="month" defaultValue={data.month} className="w-[160px]" />
          <Button type="submit" variant="outline" size="sm">
            Go
          </Button>
        </form>
        <form action={triggerRecurringGenerationAction}>
          <input type="hidden" name="month" value={data.month} />
          <FormSubmitButton variant="outline" size="sm" pendingLabel="Generating...">
            Generate drafts
          </FormSubmitButton>
        </form>
        <CreateServiceDialog clients={data.clients} />
      </El>
    </El>
  );
}

function BoardColumns({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain pb-2">
      <div className="flex w-max gap-3 pr-1">{children}</div>
    </div>
  );
}
