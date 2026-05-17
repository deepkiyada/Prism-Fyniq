import { NextResponse } from "next/server";
import { buildInvoiceDocx } from "@/lib/invoice-export";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { buffer, filename } = await buildInvoiceDocx(id);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
