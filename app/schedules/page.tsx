import { format } from "date-fns";
import { createScheduleAction } from "@/app/actions";
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
import { listClients, listSchedules } from "@/lib/data";
import { FormSubmitButton } from "@/components/form-submit-button";

export const dynamic = "force-dynamic";

export default async function SchedulesPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  let clients = [] as Awaited<ReturnType<typeof listClients>>;
  let schedules = [] as {
    id: string;
    title: string;
    anchor_day: number;
    default_payment_terms_days: number;
    active: boolean;
    clients?: { name?: string | null } | null;
  }[];
  let error = "";

  try {
    [clients, schedules] = await Promise.all([listClients(), listSchedules()]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load schedules.";
  }

  return (
    <main className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Create Monthly Recurring Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createScheduleAction} className="grid gap-4 md:grid-cols-2">
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
              <Label htmlFor="title">Schedule title</Label>
              <Input id="title" name="title" required defaultValue="Monthly Retainer" />
            </div>
            <div>
              <Label htmlFor="lineDescription">Default service description</Label>
              <Input id="lineDescription" name="lineDescription" defaultValue="Monthly Retainer Service" />
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
            <div>
              <Label htmlFor="anchorDay">Anchor day (1-28)</Label>
              <Input id="anchorDay" name="anchorDay" type="number" min={1} max={28} defaultValue={1} />
            </div>
            <div>
              <Label htmlFor="paymentTermsDays">Payment terms (days)</Label>
              <Input id="paymentTermsDays" name="paymentTermsDays" type="number" min={1} defaultValue={15} />
            </div>
            <div>
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={today} />
            </div>
            <div>
              <Label htmlFor="defaultDiscountAmount">Default discount amount</Label>
              <Input id="defaultDiscountAmount" name="defaultDiscountAmount" type="number" min={0} step="0.01" defaultValue={0} />
            </div>
            <div className="md:col-span-2">
              <FormSubmitButton disabled={clients.length === 0} pendingLabel="Saving schedule...">
                Save schedule
              </FormSubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Anchor day</TableHead>
                  <TableHead>Terms</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      No schedules yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>{schedule.clients?.name ?? "-"}</TableCell>
                      <TableCell>{schedule.title}</TableCell>
                      <TableCell>{schedule.anchor_day}</TableCell>
                      <TableCell>{schedule.default_payment_terms_days} days</TableCell>
                      <TableCell>{schedule.active ? "Active" : "Paused"}</TableCell>
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
