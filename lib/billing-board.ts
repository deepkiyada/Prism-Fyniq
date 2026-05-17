import {
  endOfMonth,
  format,
  isAfter,
  isBefore,
  parse,
  startOfMonth,
} from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  BillingBoardCard,
  BillingBoardData,
  BoardStage,
  Client,
  Invoice,
  InvoiceWithDetails,
  ReminderBoardCard,
  ServiceWithDetails,
} from "@/lib/types";
import { listClients } from "@/lib/data";

export function parseBoardMonth(month: string) {
  const parsed = parse(`${month}-01`, "yyyy-MM-dd", new Date());
  const periodStart = format(startOfMonth(parsed), "yyyy-MM-dd");
  const periodEnd = format(endOfMonth(parsed), "yyyy-MM-dd");
  return { parsed, periodStart, periodEnd };
}

export function invoiceToBoardStage(
  invoice: Invoice & { month_closed?: boolean },
): BoardStage {
  if (invoice.month_closed) return "done";
  if (invoice.status === "draft") return "draft";
  if (invoice.status === "sent" || invoice.status === "pending_payment") return "sent";
  if (invoice.status === "partially_paid" || invoice.status === "paid") return "paid";
  return "draft";
}

export function boardStageToStatus(stage: BoardStage): string {
  switch (stage) {
    case "draft":
      return "draft";
    case "sent":
      return "sent";
    case "paid":
      return "pending_payment";
    case "done":
      return "paid";
    default:
      return "draft";
  }
}

function shouldIncludeReminder(
  periodStart: string,
  periodEnd: string,
  anchorDay: number,
  scheduleStart: string,
  scheduleEnd: string | null,
) {
  const today = new Date();
  const monthStart = new Date(periodStart);
  const monthEnd = new Date(periodEnd);

  if (isAfter(monthStart, startOfMonth(today))) return false;
  if (scheduleEnd && isBefore(new Date(scheduleEnd), monthStart)) return false;
  if (isAfter(new Date(scheduleStart), monthEnd)) return false;

  const selectedIsCurrentMonth =
    format(monthStart, "yyyy-MM") === format(startOfMonth(today), "yyyy-MM");

  if (!selectedIsCurrentMonth) return true;

  const anchorDate = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    Math.min(anchorDay, monthEnd.getDate()),
  );
  return !isBefore(today, anchorDate);
}

function estimateScheduleTotal(
  lineItems: { quantity: number; unit_price: number }[],
  discountAmount: number,
) {
  const subtotal = lineItems.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0,
  );
  return Math.max(0, subtotal - Number(discountAmount ?? 0));
}

export async function getBillingBoard(month: string): Promise<BillingBoardData> {
  const { periodStart, periodEnd } = parseBoardMonth(month);
  const supabase = getSupabaseServerClient();

  const [clients, schedulesResponse, invoicesResponse] = await Promise.all([
    listClients(),
    supabase
      .from("recurring_schedules")
      .select("*, clients(*), schedule_line_items(*)")
      .eq("active", true)
      .lte("start_date", periodEnd)
      .order("title"),
    supabase
      .from("invoices")
      .select("*, clients(*), invoice_line_items(*), payments(*)")
      .eq("service_period_start", periodStart)
      .eq("service_period_end", periodEnd)
      .not("schedule_id", "is", null)
      .neq("status", "void"),
  ]);

  if (schedulesResponse.error) throw schedulesResponse.error;
  if (invoicesResponse.error) throw invoicesResponse.error;

  const services: ServiceWithDetails[] = (schedulesResponse.data ?? []).map((row) => {
    const normalized = row as {
      clients: Client;
      schedule_line_items: ServiceWithDetails["line_items"] | null;
    } & ServiceWithDetails;
    return {
      ...normalized,
      client: normalized.clients,
      line_items: (normalized.schedule_line_items ?? []).sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
    };
  });

  const invoices: InvoiceWithDetails[] = (invoicesResponse.data ?? []).map((row) => {
    const normalized = row as {
      clients: Client;
      invoice_line_items: InvoiceWithDetails["line_items"] | null;
      payments: InvoiceWithDetails["payments"] | null;
    } & Invoice;
    return {
      ...normalized,
      client: normalized.clients,
      line_items: normalized.invoice_line_items ?? [],
      payments: normalized.payments ?? [],
    };
  });

  const invoiceBySchedule = new Map(
    invoices.filter((inv) => inv.schedule_id).map((inv) => [inv.schedule_id!, inv]),
  );

  const cards: BillingBoardCard[] = [];

  for (const service of services) {
    const invoice = invoiceBySchedule.get(service.id);
    if (invoice) {
      cards.push({
        kind: "invoice",
        invoice,
        stage: invoiceToBoardStage(invoice),
      });
      continue;
    }

    if (
      !shouldIncludeReminder(
        periodStart,
        periodEnd,
        service.anchor_day,
        service.start_date,
        service.end_date,
      )
    ) {
      continue;
    }

    const templateLineItems = service.line_items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    }));

    const reminder: ReminderBoardCard = {
      kind: "reminder",
      id: `${service.id}:${periodStart}`,
      scheduleId: service.id,
      clientId: service.client_id,
      clientName: service.client.name,
      serviceTitle: service.title,
      currency: service.client.currency,
      estimatedTotal: estimateScheduleTotal(
        templateLineItems,
        service.default_discount_amount,
      ),
      anchorDay: service.anchor_day,
      periodStart,
      periodEnd,
      defaultDiscountAmount: Number(service.default_discount_amount ?? 0),
      defaultDiscountNote: service.default_discount_note,
      defaultPaymentTermsDays: service.default_payment_terms_days,
      templateLineItems,
    };
    cards.push(reminder);
  }

  return {
    month,
    periodStart,
    periodEnd,
    cards,
    clients,
    services,
  };
}
