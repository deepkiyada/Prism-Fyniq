import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listInvoices } from "@/lib/data";

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
      <Card>
        <CardHeader>
          <CardTitle>Export Center</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Download branded Prism Fyniq invoices in PDF or DOCX format.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Files</CardTitle>
        </CardHeader>
        <CardContent>
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
                      <TableCell>{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.client.name}</TableCell>
                      <TableCell>{invoice.status.replaceAll("_", " ")}</TableCell>
                      <TableCell className="text-right">
                        {invoice.currency} {invoice.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-3 text-sm">
                          <a className="underline" href={`/api/invoices/${invoice.id}/pdf`} target="_blank">
                            PDF
                          </a>
                          <a className="underline" href={`/api/invoices/${invoice.id}/docx`} target="_blank">
                            DOCX
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
