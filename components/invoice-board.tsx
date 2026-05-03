"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InvoiceWithDetails, InvoiceStatus } from "@/lib/types";

const STATUSES: { key: InvoiceStatus; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "pending_payment", label: "Pending" },
  { key: "partially_paid", label: "Partially Paid" },
  { key: "paid", label: "Paid" },
  { key: "void", label: "Void" },
];

type Props = {
  invoices: InvoiceWithDetails[];
};

function Column({
  status,
  label,
  invoices,
}: {
  status: InvoiceStatus;
  label: string;
  invoices: InvoiceWithDetails[];
}) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[270px] rounded-lg border p-3 ${isOver ? "bg-muted" : "bg-card"}`}
    >
      <p className="mb-3 text-sm font-semibold">
        {label} ({invoices.length})
      </p>
      <div className="space-y-2">
        {invoices.map((invoice) => (
          <DraggableInvoiceCard key={invoice.id} invoice={invoice} />
        ))}
      </div>
    </div>
  );
}

function DraggableInvoiceCard({ invoice }: { invoice: InvoiceWithDetails }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: invoice.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-grab">
      <CardHeader className="p-3">
        <CardTitle className="text-sm">{invoice.invoice_number}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-3 pt-0 text-xs text-muted-foreground">
        <p>{invoice.client.name}</p>
        <p>
          {invoice.currency} {invoice.total.toFixed(2)}
        </p>
      </CardContent>
    </Card>
  );
}

export function InvoiceBoard({ invoices }: Props) {
  const [localInvoices, setLocalInvoices] = useState(invoices);
  const sensors = useSensors(useSensor(PointerSensor));

  const grouped = useMemo(() => {
    return STATUSES.reduce(
      (acc, status) => {
        acc[status.key] = localInvoices.filter((item) => item.status === status.key);
        return acc;
      },
      {} as Record<InvoiceStatus, InvoiceWithDetails[]>,
    );
  }, [localInvoices]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const targetStatus = event.over?.id as InvoiceStatus | undefined;
    if (!targetStatus) return;
    const invoiceId = String(event.active.id);

    setLocalInvoices((current) =>
      current.map((invoice) =>
        invoice.id === invoiceId ? { ...invoice, status: targetStatus } : invoice,
      ),
    );

    await fetch(`/api/invoices/${invoiceId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: targetStatus }),
    });
  };

  return (
    <Tabs defaultValue="kanban">
      <TabsList>
        <TabsTrigger value="kanban">Kanban</TabsTrigger>
        <TabsTrigger value="table">Table</TabsTrigger>
      </TabsList>
      <TabsContent value="kanban" className="pt-4">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {STATUSES.map((status) => (
              <Column
                key={status.key}
                status={status.key}
                label={status.label}
                invoices={grouped[status.key] ?? []}
              />
            ))}
          </div>
        </DndContext>
      </TabsContent>
      <TabsContent value="table" className="pt-4">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Service Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.client.name}</TableCell>
                    <TableCell>
                      {invoice.service_period_start} to {invoice.service_period_end}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{invoice.status.replaceAll("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.currency} {invoice.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
