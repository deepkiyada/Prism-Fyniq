"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { z } from "zod";
import {
  createRecurringInvoicesForCurrentMonth,
  deriveStatusFromPayments,
  getNextInvoiceNumber,
} from "@/lib/data";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const createClientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  billingAddress: z.string().optional(),
  notes: z.string().optional(),
  currency: z.string().length(3).default("USD"),
});

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
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
    const data = createClientSchema.parse({
      name: getFormString(formData, "name"),
      email: getFormString(formData, "email"),
      billingAddress: getFormString(formData, "billingAddress"),
      notes: getFormString(formData, "notes"),
      currency: getFormString(formData, "currency") || "USD",
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
  } catch (error) {
    logActionError("createClientAction", error);
  }
  revalidatePath("/", "layout");
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
    const linesRaw = String(formData.get("lineItems") ?? "");
    let lineItems: { description: string; quantity: number; unitPrice: number }[] = [];
    if (linesRaw) {
      lineItems = z
        .array(
          z.object({
            description: z.string().min(1),
            quantity: z.number().positive(),
            unitPrice: z.number().nonnegative(),
          }),
        )
        .parse(JSON.parse(linesRaw));
    } else {
      const description = getFormString(formData, "lineDescription");
      const quantity = Number(formData.get("lineQuantity") ?? 1);
      const unitPrice = Number(formData.get("lineUnitPrice") ?? 0);

      lineItems = [
        {
          description: description || "Monthly Service",
          quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
          unitPrice: Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : 0,
        },
      ];
    }

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
        currency: "USD",
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
  } catch (error) {
    logActionError("createInvoiceAction", error);
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
  } catch (error) {
    logActionError("updateInvoiceStatusAction", error);
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
      .update({ status })
      .eq("id", invoiceId);
    if (statusError) throw statusError;
  } catch (error) {
    logActionError("recordPaymentAction", error);
  }

  revalidatePath("/", "layout");
}

export async function createScheduleAction(formData: FormData) {
  try {
    const supabase = getSupabaseServerClient();
    const lineDescription = getFormString(formData, "lineDescription") || "Monthly Retainer";
    const lineQuantity = Number(formData.get("lineQuantity") ?? 1);
    const lineUnitPrice = Number(formData.get("lineUnitPrice") ?? 0);

    const { data: schedule, error } = await supabase
      .from("recurring_schedules")
      .insert({
        client_id: String(formData.get("clientId")),
        title: String(formData.get("title")),
        cadence: "monthly",
        anchor_day: Number(formData.get("anchorDay") ?? 1),
        default_discount_amount: Number(formData.get("defaultDiscountAmount") ?? 0),
        default_discount_note: String(formData.get("defaultDiscountNote") ?? "") || null,
        start_date: String(formData.get("startDate")),
        end_date: String(formData.get("endDate") ?? "") || null,
        active: true,
        default_payment_terms_days: Number(formData.get("paymentTermsDays") ?? 15),
        currency: String(formData.get("currency") ?? "USD"),
      })
      .select("id")
      .single();
    if (error) throw error;

    const { error: lineError } = await supabase.from("schedule_line_items").insert({
      schedule_id: schedule.id,
      description: lineDescription,
      quantity: Number.isFinite(lineQuantity) && lineQuantity > 0 ? lineQuantity : 1,
      unit_price: Number.isFinite(lineUnitPrice) && lineUnitPrice >= 0 ? lineUnitPrice : 0,
      sort_order: 1,
    });
    if (lineError) throw lineError;
  } catch (error) {
    logActionError("createScheduleAction", error);
  }
  revalidatePath("/", "layout");
}

export async function triggerRecurringGenerationAction() {
  try {
    await createRecurringInvoicesForCurrentMonth();
  } catch (error) {
    // Avoid crashing the UI if Supabase schema/env is not ready yet.
    console.error("Recurring generation failed:", error);
  }
  revalidatePath("/", "layout");
}
