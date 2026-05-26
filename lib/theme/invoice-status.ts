import type { InvoiceStatus } from "@/lib/types";

type BadgeVariant = "accent" | "highlight" | "info" | "success" | "warning" | "secondary" | "outline";

export function invoiceStatusBadgeVariant(status: InvoiceStatus | string): BadgeVariant {
  switch (status) {
    case "draft":
      return "highlight";
    case "sent":
      return "info";
    case "pending_payment":
      return "accent";
    case "partially_paid":
      return "warning";
    case "paid":
      return "success";
    case "void":
      return "outline";
    default:
      return "secondary";
  }
}
