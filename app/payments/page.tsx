import { format } from "date-fns";
import { recordPaymentAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listInvoices, listPayments } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  let invoices = [] as Awaited<ReturnType<typeof listInvoices>>;
  let payments = [] as {
    id: string;
    paid_at: string;
    amount: number;
    method: string | null;
    invoices?: { invoice_number?: string | null; clients?: { name?: string | null } | null } | null;
  }[];
  let error = "";

  try {
    [invoices, payments] = await Promise.all([listInvoices(), listPayments()]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load payments.";
  }

  const billableInvoices = invoices.filter((invoice) => invoice.status !== "void");

  return (
    <main className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Step 4: Record Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={recordPaymentAction} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="invoiceId">Invoice</Label>
              <select
                id="invoiceId"
                name="invoiceId"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                defaultValue=""
                disabled={billableInvoices.length === 0}
              >
                <option value="" disabled>
                  Select invoice
                </option>
                {billableInvoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoice_number} - {invoice.client.name} ({invoice.currency} {invoice.total.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="amount">Amount received</Label>
              <Input id="amount" name="amount" type="number" required step="0.01" min={0} />
            </div>
            <div>
              <Label htmlFor="paidAt">Paid date</Label>
              <Input id="paidAt" name="paidAt" type="date" defaultValue={today} />
            </div>
            <div>
              <Label htmlFor="method">Payment method</Label>
              <Input id="method" name="method" placeholder="Bank transfer / UPI / Stripe" />
            </div>
            <div>
              <Label htmlFor="note">Note</Label>
              <Input id="note" name="note" placeholder="Optional note" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={billableInvoices.length === 0}>
                Save payment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      No payments recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.paid_at}</TableCell>
                      <TableCell>{payment.invoices?.invoice_number ?? "-"}</TableCell>
                      <TableCell>{payment.invoices?.clients?.name ?? "-"}</TableCell>
                      <TableCell>{payment.method ?? "-"}</TableCell>
                      <TableCell className="text-right">{Number(payment.amount).toFixed(2)}</TableCell>
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
