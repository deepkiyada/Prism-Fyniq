import { NextRequest, NextResponse } from "next/server";
import { createRecurringInvoicesForCurrentMonth } from "@/lib/data";

export async function GET(req: NextRequest) {
  return runRecurring(req);
}

export async function POST(req: NextRequest) {
  return runRecurring(req);
}

async function runRecurring(req: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  const actualSecret = req.headers.get("x-cron-secret");

  if (expectedSecret && actualSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const created = await createRecurringInvoicesForCurrentMonth();
  return NextResponse.json({ createdCount: created.length, createdIds: created });
}

