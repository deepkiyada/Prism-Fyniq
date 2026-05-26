"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type EditableLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

type LineItemsEditorProps = {
  items: EditableLineItem[];
  onChange: (items: EditableLineItem[]) => void;
  currency?: string;
  className?: string;
};

export function LineItemsEditor({
  items,
  onChange,
  currency,
  className,
}: LineItemsEditorProps) {
  const updateItem = (index: number, patch: Partial<EditableLineItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    onChange([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    onChange(items.filter((_, i) => i !== index));
  };

  const lineTotal = (item: EditableLineItem) => item.quantity * item.unitPrice;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Line items</p>
          <p className="text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? "row" : "rows"}
          </p>
        </div>
        <Button type="button" variant="accent" size="sm" onClick={addItem}>
          <Plus className="size-4" />
          Add row
        </Button>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="relative rounded-lg border border-primary/10 bg-accent/25 p-4 shadow-xs ring-1 ring-primary/5"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-background text-xs font-medium text-muted-foreground ring-1 ring-border">
                {index + 1}
              </span>
              {items.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeItem(index)}
                  aria-label={`Remove line item ${index + 1}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </div>
            <div className="grid gap-3">
              <div>
                <Label htmlFor={`line-desc-${index}`} className="text-xs">
                  Description
                </Label>
                <Input
                  id={`line-desc-${index}`}
                  value={item.description}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                  placeholder="e.g. Monthly retainer, blog posts"
                  className="mt-1"
                  required
                />
              </div>
              <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
                <div>
                  <Label htmlFor={`line-qty-${index}`} className="text-xs">
                    Quantity
                  </Label>
                  <Input
                    id={`line-qty-${index}`}
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, { quantity: Number(e.target.value) || 1 })
                    }
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`line-price-${index}`} className="text-xs">
                    Unit price{currency ? ` (${currency})` : ""}
                  </Label>
                  <Input
                    id={`line-price-${index}`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(index, { unitPrice: Number(e.target.value) || 0 })
                    }
                    className="mt-1"
                    required
                  />
                </div>
                <div className="pb-2 text-right">
                  <p className="text-xs text-muted-foreground">Line total</p>
                  <p className="text-sm font-medium tabular-nums">
                    {currency ? `${currency} ` : ""}
                    {lineTotal(item).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
