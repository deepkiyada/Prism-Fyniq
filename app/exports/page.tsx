import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ThemedCard } from "@/components/themed-card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listInvoices } from "@/lib/data";
import { invoiceStatusBadgeVariant } from "@/lib/theme/invoice-status";
import { textLink } from "@/lib/theme/ui-styles";

export const dynamic = "force-dynamic";

export default async function ExportsPage() {
  let invoices = [] as Awaited<ReturnType<typeof listInvoices>>;
  let error = "";

  try {
    invoices = await listInvoices();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load invoices.";
  }

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title="Export center"
        description="Download branded Prism Fyniq invoices in PDF or DOCX format."
      />

      <ThemedCard title="Invoice files" tone="highlight">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Downloads</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No invoices available.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.client.name}</TableCell>
                    <TableCell>
                      <Badge variant={invoiceStatusBadgeVariant(invoice.status)} className="capitalize">
                        {invoice.status.replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {invoice.currency} {invoice.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-3 text-sm">
                        <Link className={textLink} href={`/api/invoices/${invoice.id}/pdf`} target="_blank">
                          PDF
                        </Link>
                        <Link className={textLink} href={`/api/invoices/${invoice.id}/docx`} target="_blank">
                          DOCX
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </ThemedCard>
    </main>
  );
}
