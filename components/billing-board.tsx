"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileDown, FileText, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { moveInvoiceToOngoingAction, updateInvoiceBoardStageAction } from "@/app/actions";
import { CreateServiceDialog } from "@/components/create-service-dialog";
import { PageHeader } from "@/components/page-header";
import { InvoiceDraftSheet } from "@/components/invoice-draft-sheet";
import { InvoiceEditSheet } from "@/components/invoice-edit-sheet";
import { RecordPaymentDialog } from "@/components/record-payment-dialog";
import { ServiceEditSheet } from "@/components/service-edit-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buildOngoingServiceCard, invoiceToBoardStage } from "@/lib/billing-board";
import { formatMoney } from "@/lib/format-money";
import { boardColumnStyles } from "@/lib/theme/board-columns";
import { cn } from "@/lib/utils";
import type {
  BillingBoardCard,
  BillingBoardData,
  BoardStage,
  InvoiceWithDetails,
  OngoingServiceCard,
  ServiceWithDetails,
} from "@/lib/types";

const ONGOING_DRAG_PREFIX = "ongoing:";
const INVOICE_DRAG_PREFIX = "invoice:";

const COLUMNS: { key: BoardStage; label: string }[] = [
  { key: "ongoing_services", label: "Ongoing Services" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "paid", label: "Paid" },
  { key: "done", label: "Done" },
];

function getCardStage(card: BillingBoardCard): BoardStage {
  if (card.kind === "ongoing") return "ongoing_services";
  return card.stage;
}

function ongoingDragId(card: OngoingServiceCard) {
  return `${ONGOING_DRAG_PREFIX}${card.id}`;
}

function invoiceDragId(invoiceId: string) {
  return `${INVOICE_DRAG_PREFIX}${invoiceId}`;
}

function parseDragId(activeId: string) {
  if (activeId.startsWith(ONGOING_DRAG_PREFIX)) {
    return { type: "ongoing" as const, id: activeId.slice(ONGOING_DRAG_PREFIX.length) };
  }
  if (activeId.startsWith(INVOICE_DRAG_PREFIX)) {
    return { type: "invoice" as const, id: activeId.slice(INVOICE_DRAG_PREFIX.length) };
  }
  return { type: "invoice" as const, id: activeId };
}

function DragHandle({
  label,
  listeners,
  attributes,
  setActivatorNodeRef,
}: {
  label: string;
  listeners: ReturnType<typeof useDraggable>["listeners"];
  attributes: ReturnType<typeof useDraggable>["attributes"];
  setActivatorNodeRef: ReturnType<typeof useDraggable>["setActivatorNodeRef"];
}) {
  return (
    <button
      type="button"
      ref={setActivatorNodeRef}
      className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="size-4" />
    </button>
  );
}

type BillingBoardProps = {
  data: BillingBoardData;
};

function BoardColumn({
  stage,
  label,
  cards,
  onEditService,
  onCreateInvoice,
  onRecordPayment,
  onEditInvoice,
}: {
  stage: BoardStage;
  label: string;
  cards: BillingBoardCard[];
  onEditService: (card: OngoingServiceCard) => void;
  onCreateInvoice: (card: OngoingServiceCard) => void;
  onRecordPayment: (invoice: InvoiceWithDetails) => void;
  onEditInvoice: (invoice: InvoiceWithDetails) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });
  const accent = boardColumnStyles[stage];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[260px] shrink-0 flex-col rounded-lg border border-t-[3px] p-3 transition-colors",
        accent.column,
        isOver ? "border-primary/50 bg-primary/10 ring-2 ring-primary/20" : "",
      )}
    >
      <p className={cn("mb-3 flex shrink-0 items-center gap-2 text-sm font-semibold", accent.header)}>
        <span className={cn("size-2 shrink-0 rounded-full", accent.dot)} aria-hidden />
        {label} ({cards.length})
      </p>
      <div className="min-h-[140px] flex-1 space-y-2">
        {cards.map((card) =>
          card.kind === "ongoing" ? (
            <OngoingServiceCardView
              key={card.id}
              card={card}
              onEdit={onEditService}
              onCreateInvoice={onCreateInvoice}
            />
          ) : (
            <DraggableInvoiceCard
              key={card.invoice.id}
              invoice={card.invoice}
              onEdit={onEditInvoice}
              onRecordPayment={onRecordPayment}
            />
          ),
        )}
      </div>
    </div>
  );
}

function OngoingServiceCardView({
  card,
  onEdit,
  onCreateInvoice,
}: {
  card: OngoingServiceCard;
  onEdit: (card: OngoingServiceCard) => void;
  onCreateInvoice: (card: OngoingServiceCard) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } =
    useDraggable({ id: ongoingDragId(card) });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-dashed transition-colors",
        isDragging && "z-10 shadow-md ring-2 ring-primary/30",
      )}
    >
      <CardHeader className="flex flex-row items-start gap-2 p-3 pb-1">
        <DragHandle
          label={`Drag ${card.invoiceName} to another column`}
          listeners={listeners}
          attributes={attributes}
          setActivatorNodeRef={setActivatorNodeRef}
        />
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => onEdit(card)}
        >
          <CardTitle className="text-sm leading-snug hover:underline">
            {card.invoiceName}
          </CardTitle>
        </button>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-0 text-xs text-muted-foreground">
        <p>{card.clientName}</p>
        <p>{formatMoney(card.currency, card.estimatedTotal)}</p>
        <p>Billing day: {card.anchorDay}</p>
        <Button
          type="button"
          variant="highlight"
          size="sm"
          className="w-full"
          onClick={() => onCreateInvoice(card)}
        >
          Create invoice
        </Button>
      </CardContent>
    </Card>
  );
}

function DraggableInvoiceCard({
  invoice,
  onEdit,
  onRecordPayment,
}: {
  invoice: InvoiceWithDetails;
  onEdit: (invoice: InvoiceWithDetails) => void;
  onRecordPayment: (invoice: InvoiceWithDetails) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } =
    useDraggable({
      id: invoiceDragId(invoice.id),
    });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };
  const paidSoFar = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const isPartial = paidSoFar > 0 && paidSoFar < invoice.total;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "z-10 shadow-md ring-2 ring-primary/30")}
    >
      <CardHeader className="flex flex-row items-start gap-2 p-3 pb-1">
        <DragHandle
          label={`Drag ${invoice.invoice_number} to another column`}
          listeners={listeners}
          attributes={attributes}
          setActivatorNodeRef={setActivatorNodeRef}
        />
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => onEdit(invoice)}
        >
          <CardTitle className="text-sm leading-snug hover:underline">
            {invoice.invoice_number}
          </CardTitle>
        </button>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-0 text-xs">
        <button
          type="button"
          className="w-full space-y-2 text-left"
          onClick={() => onEdit(invoice)}
        >
          <p className="text-muted-foreground">{invoice.client.name}</p>
          <p className="font-medium">{formatMoney(invoice.currency, invoice.total)}</p>
          <div className="flex flex-wrap gap-1">
            {isPartial ? <Badge variant="warning">Partial payment</Badge> : null}
            {invoice.month_closed ? <Badge variant="info">Month closed</Badge> : null}
          </div>
        </button>
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="accent"
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
              <Link
                href={`/api/invoices/${invoice.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <FileDown className="size-3.5" />
                PDF
              </Link>
            </Button>
            <Button type="button" variant="ghost" size="sm" asChild className="justify-start px-2">
              <Link
                href={`/api/invoices/${invoice.id}/docx`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
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
  const [services, setServices] = useState(data.services);
  const [draftOngoing, setDraftOngoing] = useState<OngoingServiceCard | null>(null);
  const [editService, setEditService] = useState<ServiceWithDetails | null>(null);
  const [editInvoice, setEditInvoice] = useState<InvoiceWithDetails | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceWithDetails | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null);
  const skipBoardSyncRef = useRef(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const serviceById = useMemo(
    () => new Map(services.map((s) => [s.id, s])),
    [services],
  );

  useEffect(() => {
    if (skipBoardSyncRef.current) {
      skipBoardSyncRef.current = false;
      return;
    }
    setCards(data.cards);
    setServices(data.services);
  }, [data.cards, data.services]);

  const handleInvoiceUpdated = (invoiceCard: Extract<BillingBoardCard, { kind: "invoice" }>) => {
    skipBoardSyncRef.current = true;
    setCards((prev) =>
      prev.map((c) =>
        c.kind === "invoice" && c.invoice.id === invoiceCard.invoice.id ? invoiceCard : c,
      ),
    );
  };

  const handleInvoiceCreated = (invoiceCard: Extract<BillingBoardCard, { kind: "invoice" }>) => {
    const scheduleId = invoiceCard.invoice.schedule_id;
    skipBoardSyncRef.current = true;
    setCards((prev) => {
      const withoutOngoingOrDuplicate = prev.filter((c) => {
        if (c.kind === "invoice" && c.invoice.id === invoiceCard.invoice.id) return false;
        if (scheduleId && c.kind === "ongoing" && c.scheduleId === scheduleId) return false;
        return true;
      });
      return [...withoutOngoingOrDuplicate, invoiceCard];
    });
  };

  const handleServiceCreated = (card: OngoingServiceCard, service: ServiceWithDetails) => {
    skipBoardSyncRef.current = true;
    setServices((prev) => {
      if (prev.some((s) => s.id === service.id)) return prev;
      return [...prev, service];
    });
    setCards((prev) => {
      const hasInvoice = prev.some(
        (c) => c.kind === "invoice" && c.invoice.schedule_id === card.scheduleId,
      );
      const hasOngoing = prev.some(
        (c) => c.kind === "ongoing" && c.scheduleId === card.scheduleId,
      );
      if (hasInvoice || hasOngoing) return prev;
      return [...prev, card];
    });
  };

  const grouped = useMemo(() => {
    return COLUMNS.reduce(
      (acc, column) => {
        acc[column.key] = cards.filter((card) => getCardStage(card) === column.key);
        return acc;
      },
      {} as Record<BoardStage, BillingBoardCard[]>,
    );
  }, [cards]);

  const handleEditService = (card: OngoingServiceCard) => {
    const service = serviceById.get(card.scheduleId);
    if (service) setEditService(service);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const parsed = parseDragId(String(event.active.id));
    if (parsed.type === "ongoing") {
      const card = cards.find(
        (c): c is OngoingServiceCard => c.kind === "ongoing" && c.id === parsed.id,
      );
      setActiveDragLabel(card?.invoiceName ?? "Invoice");
      return;
    }
    const invoiceCard = cards.find(
      (c): c is Extract<BillingBoardCard, { kind: "invoice" }> =>
        c.kind === "invoice" && c.invoice.id === parsed.id,
    );
    setActiveDragLabel(invoiceCard?.invoice.invoice_number ?? "Invoice");
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragLabel(null);
    if (isUpdating) return;
    const targetStage = event.over?.id as BoardStage | undefined;
    if (!targetStage) return;

    const parsed = parseDragId(String(event.active.id));

    if (parsed.type === "ongoing") {
      const ongoingCard = cards.find(
        (c): c is OngoingServiceCard => c.kind === "ongoing" && c.id === parsed.id,
      );
      if (!ongoingCard) return;

      if (targetStage === "ongoing_services") return;

      if (targetStage === "draft") {
        setDraftOngoing(ongoingCard);
        toast.message("Complete the invoice draft to add it to Draft");
        return;
      }

      toast.error("Drag to Draft to create an invoice first.");
      return;
    }

    const invoiceId = parsed.id;
    const invoiceCard = cards.find(
      (c): c is Extract<BillingBoardCard, { kind: "invoice" }> =>
        c.kind === "invoice" && c.invoice.id === invoiceId,
    );
    if (!invoiceCard) return;

    if (targetStage === "ongoing_services") {
      const scheduleId = invoiceCard.invoice.schedule_id;
      if (!scheduleId) {
        toast.error("Only service invoices can be moved to Ongoing Services.");
        return;
      }
      const service = serviceById.get(scheduleId);
      if (!service) {
        toast.error("Service not found for this invoice.");
        return;
      }

      const ongoingCard = buildOngoingServiceCard(
        service,
        data.periodStart,
        data.periodEnd,
      );
      const previousCards = cards;

      skipBoardSyncRef.current = true;
      setCards((current) => [
        ...current.filter(
          (c) => !(c.kind === "invoice" && c.invoice.id === invoiceId),
        ),
        ongoingCard,
      ]);

      try {
        setIsUpdating(true);
        await moveInvoiceToOngoingAction(invoiceId);
        toast.success("Moved to Ongoing Services");
        router.refresh();
      } catch {
        setCards(previousCards);
        toast.error("Could not move to Ongoing Services.");
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    const previousStage = invoiceToBoardStage(invoiceCard.invoice);

    skipBoardSyncRef.current = true;
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
      <BoardHeader
        data={data}
        onServiceCreated={handleServiceCreated}
      />
      <ServiceEditSheet
        service={editService}
        open={Boolean(editService)}
        onOpenChange={(open) => !open && setEditService(null)}
      />
      <InvoiceDraftSheet
        ongoing={draftOngoing}
        open={Boolean(draftOngoing)}
        onOpenChange={(open) => !open && setDraftOngoing(null)}
        onInvoiceCreated={handleInvoiceCreated}
      />
      <InvoiceEditSheet
        invoice={editInvoice}
        open={Boolean(editInvoice)}
        onOpenChange={(open) => !open && setEditInvoice(null)}
        onInvoiceUpdated={handleInvoiceUpdated}
      />
      <RecordPaymentDialog
        invoice={paymentInvoice}
        open={Boolean(paymentInvoice)}
        onOpenChange={(open) => !open && setPaymentInvoice(null)}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDragLabel(null)}
      >
        <BoardColumns>
          {COLUMNS.map((column) => (
            <BoardColumn
              key={column.key}
              stage={column.key}
              label={column.label}
              cards={grouped[column.key] ?? []}
              onEditService={handleEditService}
              onCreateInvoice={setDraftOngoing}
              onRecordPayment={setPaymentInvoice}
              onEditInvoice={setEditInvoice}
            />
          ))}
        </BoardColumns>
        <DragOverlay dropAnimation={null}>
          {activeDragLabel ? (
            <Card className="w-[240px] cursor-grabbing border-dashed shadow-lg">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm">{activeDragLabel}</CardTitle>
              </CardHeader>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </BoardShell>
  );
}

function BoardShell({ children }: { children: React.ReactNode }) {
  return <div className="flex min-w-0 max-w-full flex-col gap-6">{children}</div>;
}

function BoardHeader({
  data,
  onServiceCreated,
}: {
  data: BillingBoardData;
  onServiceCreated: (card: OngoingServiceCard, service: ServiceWithDetails) => void;
}) {
  const router = useRouter();
  return (
    <PageHeader
      title="Monthly billing board"
      description="New invoices appear in Ongoing Services right away — create drafts and track them through payment."
    >
      <div className="flex flex-wrap items-center gap-2">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const month = new FormData(e.currentTarget).get("month") as string;
            router.push(`/?month=${month}`);
          }}
        >
          <Input type="month" name="month" defaultValue={data.month} className="w-[160px]" />
          <Button type="submit" variant="accent" size="sm">
            Go
          </Button>
        </form>
        <CreateServiceDialog
          clients={data.clients}
          month={data.month}
          onServiceCreated={onServiceCreated}
        />
      </div>
    </PageHeader>
  );
}

function BoardColumns({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain pb-2">
      <div className="flex w-max gap-3 pr-1">{children}</div>
    </div>
  );
}
