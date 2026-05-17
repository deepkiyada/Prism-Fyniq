import { createClientAction } from "@/app/actions";
import { CurrencySelect } from "@/components/currency-select";
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
import { listClients } from "@/lib/data";
import { FormSubmitButton } from "@/components/form-submit-button";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  let clients = [] as Awaited<ReturnType<typeof listClients>>;
  let error = "";

  try {
    clients = await listClients();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load clients.";
  }

  return (
    <main className="flex flex-col gap-6">
      <section>
        <h1 className="text-xl font-semibold">Clients</h1>
        <p className="text-sm text-muted-foreground">
          Register clients before adding monthly services on the billing board.
        </p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Add client</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createClientAction} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="name">Client name</Label>
              <Input id="name" name="name" required placeholder="Acme Corp" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="billing@client.com" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="billingAddress">Billing address</Label>
              <Input id="billingAddress" name="billingAddress" placeholder="Street, City, ZIP" />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" placeholder="Optional note" />
            </div>
            <div>
              <CurrencySelect />
            </div>
            <div className="md:col-span-2">
              <FormSubmitButton pendingLabel="Saving client...">Save client</FormSubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No clients yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>{client.email ?? "-"}</TableCell>
                      <TableCell>{client.currency}</TableCell>
                      <TableCell>{client.billing_address ?? "-"}</TableCell>
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
