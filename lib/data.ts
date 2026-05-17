import { addDays, endOfMonth, format, isBefore, startOfMonth } from "date-fns";
import { DEFAULT_CURRENCY, isSupportedCurrency } from "@/lib/currencies";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Client,
  CompanySettings,
  Invoice,
  InvoiceLineItem,
  InvoiceStatus,
  InvoiceWithDetails,
  Payment,
  RecurringSchedule,
} from "@/lib/types";

export async function getDashboardData() {
  const supabase = getSupabaseServerClient();
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const [invoicesResponse, clientsResponse, schedulesResponse] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, clients(*)")
      .gte("service_period_start", monthStart)
      .lte("service_period_end", monthEnd)
      .order("issue_date", { ascending: false }),
    supabase.from("clients").select("*").eq("is_active", true).order("name"),
    supabase
      .from("recurring_schedules")
      .select("*")
      .eq("active", true)
      .order("anchor_day"),
  ]);

  if (invoicesResponse.error) throw invoicesResponse.error;
  if (clientsResponse.error) throw clientsResponse.error;
  if (schedulesResponse.error) throw schedulesResponse.error;

  return {
    invoices: (invoicesResponse.data ?? []) as (Invoice & { clients: Client })[],
    clients: (clientsResponse.data ?? []) as Client[],
    schedules: (schedulesResponse.data ?? []) as RecurringSchedule[],
  };
}

export async function listInvoices() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, clients(*), invoice_line_items(*), payments(*)")
    .order("issue_date", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const normalized = row as {
      clients: Client;
      invoice_line_items: InvoiceLineItem[] | null;
      payments: Payment[] | null;
    } & Invoice;
    return {
      ...normalized,
      client: normalized.clients,
      line_items: normalized.invoice_line_items ?? [],
      payments: normalized.payments ?? [],
    };
  }) as InvoiceWithDetails[];
}

export async function listClients() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("clients").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function listSchedules() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("recurring_schedules")
    .select("*, clients(*)")
    .order("active", { ascending: false })
    .order("title");
  if (error) throw error;
  return data ?? [];
}

export async function listPayments() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*, invoices(invoice_number, clients(name))")
    .order("paid_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getCompanySettings() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("company_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return data as CompanySettings;
}

export async function getInvoiceDetails(invoiceId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, clients(*), invoice_line_items(*), payments(*)")
    .eq("id", invoiceId)
    .single();
  if (error) throw error;

  return {
    ...(data as Invoice),
    client: data.clients as Client,
    line_items: (data.invoice_line_items ?? []) as InvoiceLineItem[],
    payments: (data.payments ?? []) as Payment[],
  } as InvoiceWithDetails;
}

export async function getNextInvoiceNumber() {
  const supabase = getSupabaseServerClient();
  const { data: settings, error: settingsError } = await supabase
    .from("company_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (settingsError) throw settingsError;

  const nextNumber = settings.invoice_next_number as number;
  const invoicePrefix = settings.invoice_prefix as string;

  const { error: updateError } = await supabase
    .from("company_settings")
    .update({ invoice_next_number: nextNumber + 1 })
    .eq("id", 1);
  if (updateError) throw updateError;

  return `${invoicePrefix}-${String(nextNumber).padStart(4, "0")}`;
}

function resolveIssueDate(monthStart: Date, anchorDay: number) {
  const lastDay = endOfMonth(monthStart).getDate();
  const day = Math.min(Math.max(anchorDay, 1), 28, lastDay);
  return new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
}

export async function createRecurringInvoicesForMonth(periodStart: string, periodEnd: string) {
  const supabase = getSupabaseServerClient();
  const monthStart = new Date(periodStart);
  const monthEnd = new Date(periodEnd);
  const today = new Date();

  const { data: schedules, error: schedulesError } = await supabase
    .from("recurring_schedules")
    .select("*, schedule_line_items(*), clients(currency)")
    .eq("active", true)
    .lte("start_date", periodEnd);

  if (schedulesError) throw schedulesError;

  const createdInvoiceIds: string[] = [];
  for (const schedule of schedules ?? []) {
    if (schedule.end_date && isBefore(new Date(schedule.end_date), monthStart)) continue;

    const issueDateObj = resolveIssueDate(monthStart, Number(schedule.anchor_day ?? 1));
    if (isBefore(today, issueDateObj)) continue;

    const { data: existing, error: existingError } = await supabase
      .from("invoices")
      .select("id")
      .eq("schedule_id", schedule.id)
      .eq("service_period_start", periodStart)
      .limit(1);
    if (existingError) throw existingError;
    if (existing && existing.length > 0) continue;

    const invoiceNumber = await getNextInvoiceNumber();
    const issueDate = format(issueDateObj, "yyyy-MM-dd");
    const dueDate = format(
      addDays(issueDateObj, Number(schedule.default_payment_terms_days ?? 15)),
      "yyyy-MM-dd",
    );
    const lineItems = (schedule.schedule_line_items ?? []) as {
      description: string;
      quantity: number;
      unit_price: number;
    }[];
    const subtotal = lineItems.reduce(
      (total, item) => total + item.quantity * item.unit_price,
      0,
    );
    const discountAmount = Number(schedule.default_discount_amount ?? 0);
    const total = Math.max(0, subtotal - discountAmount);

    const clientCurrency = (schedule.clients as { currency: string } | null)?.currency;
    const currency =
      clientCurrency && isSupportedCurrency(clientCurrency)
        ? clientCurrency
        : isSupportedCurrency(schedule.currency)
          ? schedule.currency
          : DEFAULT_CURRENCY;

    const { data: createdInvoice, error: insertError } = await supabase
      .from("invoices")
      .insert({
        client_id: schedule.client_id,
        schedule_id: schedule.id,
        invoice_number: invoiceNumber,
        status: "draft",
        issue_date: issueDate,
        due_date: dueDate,
        service_period_start: periodStart,
        service_period_end: periodEnd,
        subtotal,
        discount_amount: discountAmount,
        discount_note: schedule.default_discount_note,
        tax_amount: 0,
        total,
        currency,
        month_closed: false,
      })
      .select("id")
      .single();
    if (insertError) throw insertError;

    if (lineItems.length > 0) {
      const { error: itemsError } = await supabase.from("invoice_line_items").insert(
        lineItems.map((item, idx) => ({
          invoice_id: createdInvoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_discount_amount: 0,
          sort_order: idx + 1,
        })),
      );
      if (itemsError) throw itemsError;
    }
    createdInvoiceIds.push(createdInvoice.id);
  }

  return createdInvoiceIds;
}

export async function createRecurringInvoicesForCurrentMonth() {
  const today = new Date();
  const periodStart = format(startOfMonth(today), "yyyy-MM-dd");
  const periodEnd = format(endOfMonth(today), "yyyy-MM-dd");
  return createRecurringInvoicesForMonth(periodStart, periodEnd);
}

export function deriveStatusFromPayments(
  invoiceTotal: number,
  paymentTotal: number,
): InvoiceStatus {
  if (paymentTotal <= 0) return "pending_payment";
  if (paymentTotal >= invoiceTotal) return "paid";
  return "partially_paid";
}
