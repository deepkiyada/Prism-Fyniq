import { NextResponse } from "next/server";
import { buildInvoicePdf } from "@/lib/invoice-export";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { buffer, filename } = await buildInvoicePdf(id);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
