"use server";

import { revalidatePath } from "next/cache";
import { addDays, format } from "date-fns";
import { z } from "zod";
import { parseBoardMonth } from "@/lib/billing-board";
import {
  createRecurringInvoicesForCurrentMonth,
  createRecurringInvoicesForMonth,
  deriveStatusFromPayments,
  getNextInvoiceNumber,
} from "@/lib/data";
import {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCY_CODES,
  isSupportedCurrency,
} from "@/lib/currencies";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { setFlash } from "@/lib/flash";
import { boardStageToStatus } from "@/lib/billing-board";
import type { BoardStage } from "@/lib/types";

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
});

const createClientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  billingAddress: z.string().optional(),
  notes: z.string().optional(),
  currency: z.enum(SUPPORTED_CURRENCY_CODES).default(DEFAULT_CURRENCY),
});

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseLineItems(formData: FormData) {
  const linesRaw = getFormString(formData, "lineItems");
  if (linesRaw) {
    return z.array(lineItemSchema).parse(JSON.parse(linesRaw));
  }

  const description = getFormString(formData, "lineDescription");
  const quantity = Number(formData.get("lineQuantity") ?? 1);
  const unitPrice = Number(formData.get("lineUnitPrice") ?? 0);

  return [
    {
      description: description || "Monthly Service",
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      unitPrice: Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : 0,
    },
  ];
}

function logActionError(actionName: string, error: unknown) {
  if (error instanceof Error) {
    console.error(`${actionName} failed:`, error.message);
    return;
  }

  try {
    console.error(`${actionName} failed:`, JSON.stringify(error));
  } catch {
    console.error(`${actionName} failed.`);
  }
}

export async function createClientAction(formData: FormData) {
  try {
    const currencyInput = getFormString(formData, "currency") || DEFAULT_CURRENCY;
    const data = createClientSchema.parse({
      name: getFormString(formData, "name"),
      email: getFormString(formData, "email"),
      billingAddress: getFormString(formData, "billingAddress"),
      notes: getFormString(formData, "notes"),
      currency: isSupportedCurrency(currencyInput) ? currencyInput : DEFAULT_CURRENCY,
    });

    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("clients").insert({
      name: data.name,
      email: data.email || null,
      billing_address: data.billingAddress || null,
      notes: data.notes || null,
      currency: data.currency,
      is_active: true,
    });

    if (error) throw error;
    await setFlash({ type: "success", message: "Client created successfully." });
  } catch (error) {
    logActionError("createClientAction", error);
    await setFlash({ type: "error", message: "Failed to create client." });
  }
  revalidatePath("/", "layout");
}

async function getClientCurrency(clientId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select("currency")
    .eq("id", clientId)
    .single();
  if (error) throw error;
  const currency = data.currency as string;
  return isSupportedCurrency(currency) ? currency : DEFAULT_CURRENCY;
}

export async function createInvoiceAction(formData: FormData) {
  try {
    const clientId = String(formData.get("clientId"));
    const issueDate = String(formData.get("issueDate"));
    const dueDate = String(formData.get("dueDate"));
    const servicePeriodStart = String(formData.get("servicePeriodStart"));
    const servicePeriodEnd = String(formData.get("servicePeriodEnd"));
    const discountAmount = Number(formData.get("discountAmount") ?? 0);
    const discountNote = String(formData.get("discountNote") ?? "");
    const status = String(formData.get("status") ?? "draft");
    const lineItems = parseLineItems(formData);
    const currency = await getClientCurrency(clientId);

    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const total = Math.max(0, subtotal - discountAmount);
    const invoiceNumber = await getNextInvoiceNumber();
    const supabase = getSupabaseServerClient();

    const { data: inserted, error } = await supabase
      .from("invoices")
      .insert({
        client_id: clientId,
        invoice_number: invoiceNumber,
        status,
        issue_date: issueDate,
        due_date: dueDate,
        service_period_start: servicePeriodStart,
        service_period_end: servicePeriodEnd,
        subtotal,
        discount_amount: discountAmount,
        discount_note: discountNote || null,
        tax_amount: 0,
        total,
        currency,
        month_closed: false,
      })
      .select("id")
      .single();
    if (error) throw error;

    const { error: lineError } = await supabase.from("invoice_line_items").insert(
      lineItems.map((item, idx) => ({
        invoice_id: inserted.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_discount_amount: 0,
        sort_order: idx + 1,
      })),
    );
    if (lineError) throw lineError;
    await setFlash({ type: "success", message: "Invoice created successfully." });
  } catch (error) {
    logActionError("createInvoiceAction", error);
    await setFlash({ type: "error", message: "Failed to create invoice." });
  }

  revalidatePath("/", "layout");
}

export async function createInvoiceFromServiceAction(formData: FormData) {
  try {
    const scheduleId = getFormString(formData, "scheduleId");
    const periodStart = getFormString(formData, "periodStart");
    const periodEnd = getFormString(formData, "periodEnd");
    const discountAmount = Number(formData.get("discountAmount") ?? 0);
    const discountNote = getFormString(formData, "discountNote");
    const lineItems = parseLineItems(formData);

    const supabase = getSupabaseServerClient();

    const { data: existing, error: existingError } = await supabase
      .from("invoices")
      .select("id")
      .eq("schedule_id", scheduleId)
      .eq("service_period_start", periodStart)
      .limit(1);
    if (existingError) throw existingError;
    if (existing && existing.length > 0) {
      await setFlash({ type: "error", message: "Invoice already exists for this service and month." });
      revalidatePath("/", "layout");
      return;
    }

    const { data: schedule, error: scheduleError } = await supabase
      .from("recurring_schedules")
      .select("*, clients(currency)")
      .eq("id", scheduleId)
      .single();
    if (scheduleError) throw scheduleError;

    const clientCurrency = (schedule.clients as { currency: string } | null)?.currency;
    const currency =
      clientCurrency && isSupportedCurrency(clientCurrency)
        ? clientCurrency
        : isSupportedCurrency(schedule.currency)
          ? schedule.currency
          : DEFAULT_CURRENCY;

    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const total = Math.max(0, subtotal - discountAmount);
    const invoiceNumber = await getNextInvoiceNumber();
    const today = format(new Date(), "yyyy-MM-dd");
    const dueDate = format(
      addDays(new Date(), Number(schedule.default_payment_terms_days ?? 15)),
      "yyyy-MM-dd",
    );

    const { data: inserted, error } = await supabase
      .from("invoices")
      .insert({
        client_id: schedule.client_id,
        schedule_id: scheduleId,
        invoice_number: invoiceNumber,
        status: "draft",
        issue_date: today,
        due_date: dueDate,
        service_period_start: periodStart,
        service_period_end: periodEnd,
        subtotal,
        discount_amount: discountAmount,
        discount_note: discountNote || schedule.default_discount_note || null,
        tax_amount: 0,
        total,
        currency,
        month_closed: false,
      })
      .select("id")
      .single();
    if (error) throw error;

    const { error: lineError } = await supabase.from("invoice_line_items").insert(
      lineItems.map((item, idx) => ({
        invoice_id: inserted.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_discount_amount: 0,
        sort_order: idx + 1,
      })),
    );
    if (lineError) throw lineError;

    await setFlash({ type: "success", message: "Invoice drafted for this service." });
  } catch (error) {
    logActionError("createInvoiceFromServiceAction", error);
    await setFlash({ type: "error", message: "Failed to create invoice from service." });
  }

  revalidatePath("/", "layout");
}

export async function updateInvoiceBoardStageAction(invoiceId: string, stage: BoardStage) {
  try {
    const supabase = getSupabaseServerClient();
    const status = boardStageToStatus(stage);
    const monthClosed = stage === "done";

    const { error } = await supabase
      .from("invoices")
      .update({ status, month_closed: monthClosed })
      .eq("id", invoiceId);
    if (error) throw error;
    await setFlash({ type: "success", message: "Invoice stage updated." });
  } catch (error) {
    logActionError("updateInvoiceBoardStageAction", error);
    await setFlash({ type: "error", message: "Failed to update invoice stage." });
  }
  revalidatePath("/", "layout");
}

export async function updateInvoiceStatusAction(invoiceId: string, nextStatus: string) {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("invoices")
      .update({ status: nextStatus })
      .eq("id", invoiceId);
    if (error) throw error;
    await setFlash({
      type: "success",
      message: `Invoice marked as ${nextStatus.replaceAll("_", " ")}.`,
    });
  } catch (error) {
    logActionError("updateInvoiceStatusAction", error);
    await setFlash({ type: "error", message: "Failed to update invoice status." });
  }
  revalidatePath("/", "layout");
}

export async function recordPaymentAction(formData: FormData) {
  try {
    const invoiceId = String(formData.get("invoiceId"));
    const amount = Number(formData.get("amount"));
    const method = String(formData.get("method") ?? "");
    const note = String(formData.get("note") ?? "");
    const paidAt = String(formData.get("paidAt") ?? format(new Date(), "yyyy-MM-dd"));
    const supabase = getSupabaseServerClient();

    const { error: paymentError } = await supabase.from("payments").insert({
      invoice_id: invoiceId,
      amount,
      method: method || null,
      note: note || null,
      paid_at: paidAt,
    });
    if (paymentError) throw paymentError;

    const [{ data: invoiceData, error: invoiceError }, { data: paymentRows, error: sumError }] =
      await Promise.all([
        supabase.from("invoices").select("total").eq("id", invoiceId).single(),
        supabase.from("payments").select("amount").eq("invoice_id", invoiceId),
      ]);

    if (invoiceError) throw invoiceError;
    if (sumError) throw sumError;

    const paymentTotal = (paymentRows ?? []).reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    const status = deriveStatusFromPayments(Number(invoiceData.total), paymentTotal);
    const { error: statusError } = await supabase
      .from("invoices")
      .update({ status, month_closed: false })
      .eq("id", invoiceId);
    if (statusError) throw statusError;
    await setFlash({ type: "success", message: "Payment recorded successfully." });
  } catch (error) {
    logActionError("recordPaymentAction", error);
    await setFlash({ type: "error", message: "Failed to record payment." });
  }

  revalidatePath("/", "layout");
}

export async function createServiceAction(formData: FormData) {
  try {
    const supabase = getSupabaseServerClient();
    const clientId = getFormString(formData, "clientId");
    const lineItems = parseLineItems(formData);
    const currency = await getClientCurrency(clientId);

    const { data: schedule, error } = await supabase
      .from("recurring_schedules")
      .insert({
        client_id: clientId,
        title: getFormString(formData, "title"),
        cadence: "monthly",
        anchor_day: Number(formData.get("anchorDay") ?? 1),
        default_discount_amount: Number(formData.get("defaultDiscountAmount") ?? 0),
        default_discount_note: getFormString(formData, "defaultDiscountNote") || null,
        start_date: getFormString(formData, "startDate"),
        end_date: getFormString(formData, "endDate") || null,
        active: true,
        default_payment_terms_days: Number(formData.get("paymentTermsDays") ?? 15),
        currency,
      })
      .select("id")
      .single();
    if (error) throw error;

    const { error: lineError } = await supabase.from("schedule_line_items").insert(
      lineItems.map((item, idx) => ({
        schedule_id: schedule.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        sort_order: idx + 1,
      })),
    );
    if (lineError) throw lineError;
    await setFlash({ type: "success", message: "Monthly service created successfully." });
  } catch (error) {
    logActionError("createServiceAction", error);
    await setFlash({ type: "error", message: "Failed to create service." });
  }
  revalidatePath("/", "layout");
}

/** @deprecated Use createServiceAction */
export async function createScheduleAction(formData: FormData) {
  return createServiceAction(formData);
}

export async function triggerRecurringGenerationAction(formData?: FormData) {
  try {
    const month = formData ? getFormString(formData, "month") : "";
    if (month) {
      const { periodStart, periodEnd } = parseBoardMonth(month);
      await createRecurringInvoicesForMonth(periodStart, periodEnd);
    } else {
      await createRecurringInvoicesForCurrentMonth();
    }
    await setFlash({ type: "success", message: "Monthly invoice drafts generated." });
  } catch (error) {
    console.error("Recurring generation failed:", error);
    await setFlash({ type: "error", message: "Recurring generation failed." });
  }
  revalidatePath("/", "layout");
}
