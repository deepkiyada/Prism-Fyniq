import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { phase2Backlog } from "@/lib/backlog";

export default async function Home() {
  return (
    <main className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Prism Labs Billing Workflow</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Link href="/clients" className="rounded-lg border p-4 hover:bg-muted/40">
            <p className="font-medium">Step 1: Clients</p>
            <p className="text-sm text-muted-foreground">Add and manage your customer database.</p>
          </Link>
          <Link href="/schedules" className="rounded-lg border p-4 hover:bg-muted/40">
            <p className="font-medium">Step 2: Recurring Schedules</p>
            <p className="text-sm text-muted-foreground">Set monthly billing rules for each client.</p>
          </Link>
          <Link href="/invoices" className="rounded-lg border p-4 hover:bg-muted/40">
            <p className="font-medium">Step 3: Invoices</p>
            <p className="text-sm text-muted-foreground">Create invoices and track status in Kanban/table views.</p>
          </Link>
          <Link href="/payments" className="rounded-lg border p-4 hover:bg-muted/40">
            <p className="font-medium">Step 4: Payments</p>
            <p className="text-sm text-muted-foreground">Record collections and auto-update invoice status.</p>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Files & Exports</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href="/exports">Open Export Center</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phase 2 backlog</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {phase2Backlog.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
