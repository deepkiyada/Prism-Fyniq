import { format } from "date-fns";
import { createInvoiceAction, triggerRecurringGenerationAction } from "@/app/actions";
import { InvoiceBoard } from "@/components/invoice-board";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listClients, listInvoices } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");
  const monthEnd = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd");

  let clients = [] as Awaited<ReturnType<typeof listClients>>;
  let invoices = [] as Awaited<ReturnType<typeof listInvoices>>;
  let error = "";

  try {
    [clients, invoices] = await Promise.all([listClients(), listInvoices()]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load invoice data.";
  }

  return (
    <main className="flex flex-col gap-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Step 3: Create and Track Invoices</h1>
          <p className="text-sm text-muted-foreground">Create a new invoice, then manage status in Kanban or table view below.</p>
        </div>
        <form action={triggerRecurringGenerationAction}>
          <Button type="submit" variant="outline">
            Generate this month&apos;s recurring drafts
          </Button>
        </form>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Create invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInvoiceAction} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="clientId">Client</Label>
              <select
                id="clientId"
                name="clientId"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                defaultValue=""
                disabled={clients.length === 0}
              >
                <option value="" disabled>
                  Select client
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                defaultValue="draft"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="pending_payment">Pending payment</option>
              </select>
            </div>
            <div>
              <Label htmlFor="issueDate">Issue date</Label>
              <Input id="issueDate" name="issueDate" type="date" defaultValue={today} required />
            </div>
            <div>
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" name="dueDate" type="date" defaultValue={today} required />
            </div>
            <div>
              <Label htmlFor="servicePeriodStart">Service period start</Label>
              <Input id="servicePeriodStart" name="servicePeriodStart" type="date" defaultValue={monthStart} />
            </div>
            <div>
              <Label htmlFor="servicePeriodEnd">Service period end</Label>
              <Input id="servicePeriodEnd" name="servicePeriodEnd" type="date" defaultValue={monthEnd} />
            </div>
            <div>
              <Label htmlFor="discountAmount">Discount amount</Label>
              <Input id="discountAmount" name="discountAmount" type="number" min={0} step="0.01" defaultValue={0} />
            </div>
            <div>
              <Label htmlFor="discountNote">Discount note</Label>
              <Input id="discountNote" name="discountNote" placeholder="Optional" />
            </div>
            <div>
              <Label htmlFor="lineDescription">Line description</Label>
              <Input id="lineDescription" name="lineDescription" defaultValue="Monthly Retainer" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="lineQuantity">Qty</Label>
                <Input id="lineQuantity" name="lineQuantity" type="number" min={1} defaultValue={1} />
              </div>
              <div>
                <Label htmlFor="lineUnitPrice">Unit price</Label>
                <Input id="lineUnitPrice" name="lineUnitPrice" type="number" min={0} step="0.01" defaultValue={1000} />
              </div>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={clients.length === 0}>
                Create invoice
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : (
        <InvoiceBoard invoices={invoices} />
      )}
    </main>
  );
}
