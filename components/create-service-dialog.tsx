"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { FileText, Plus } from "lucide-react";
import { createServiceAction } from "@/app/actions";
import { LineItemsEditor, type EditableLineItem } from "@/components/line-items-editor";
import { ModalPanelHeader } from "@/components/modal-panel-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSubmitButton } from "@/components/form-submit-button";
import { modalContent } from "@/lib/theme/ui-styles";
import type { Client, OngoingServiceCard, ServiceWithDetails } from "@/lib/types";

type CreateServiceDialogProps = {
  clients: Client[];
  month: string;
  onServiceCreated?: (card: OngoingServiceCard, service: ServiceWithDetails) => void;
};

export function CreateServiceDialog({
  clients,
  month,
  onServiceCreated,
}: CreateServiceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lineItems, setLineItems] = useState<EditableLineItem[]>([
    { description: "Monthly retainer", quantity: 1, unitPrice: 0 },
  ]);
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="highlight" disabled={clients.length === 0}>
          <Plus className="size-4" />
          Add invoice
        </Button>
      </DialogTrigger>
      <DialogContent className={modalContent}>
        <DialogHeader className="sr-only">
          <DialogTitle>Add invoice</DialogTitle>
        </DialogHeader>
        <ModalPanelHeader
          icon={FileText}
          title="Add invoice"
          description="Set up a recurring service that appears on the monthly board."
        />
        <form
          action={async (formData) => {
            formData.set("lineItems", JSON.stringify(lineItems));
            formData.set("month", month);
            const result = await createServiceAction(formData);
            if (result.ok) {
              if (result.card && result.service) {
                onServiceCreated?.(result.card, result.service);
              }
              setOpen(false);
              router.refresh();
            }
          }}
          className="grid gap-4 px-4 py-4"
        >
          <div>
            <Label htmlFor="clientId">Client</Label>
            <select
              id="clientId"
              name="clientId"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20"
              defaultValue=""
            >
              <option value="" disabled>
                Select client
              </option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.currency})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="title">Invoice name</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="e.g. Content writing — Acme Corp"
            />
          </div>
          <LineItemsEditor items={lineItems} onChange={setLineItems} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="anchorDay">Billing day (1–28)</Label>
              <Input id="anchorDay" name="anchorDay" type="number" min={1} max={28} defaultValue={1} />
            </div>
            <div>
              <Label htmlFor="paymentTermsDays">Payment terms (days)</Label>
              <Input
                id="paymentTermsDays"
                name="paymentTermsDays"
                type="number"
                min={1}
                defaultValue={15}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="startDate">Start date</Label>
            <Input id="startDate" name="startDate" type="date" defaultValue={today} required />
          </div>
          <div>
            <Label htmlFor="endDate">End date (optional)</Label>
            <Input id="endDate" name="endDate" type="date" />
          </div>
          <div>
            <Label htmlFor="defaultDiscountAmount">Default discount</Label>
            <Input
              id="defaultDiscountAmount"
              name="defaultDiscountAmount"
              type="number"
              min={0}
              step="0.01"
              defaultValue={0}
            />
          </div>
          <FormSubmitButton variant="highlight" pendingLabel="Saving...">
            Save invoice
          </FormSubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
