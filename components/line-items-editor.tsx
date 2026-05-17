"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type EditableLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

type LineItemsEditorProps = {
  items: EditableLineItem[];
  onChange: (items: EditableLineItem[]) => void;
};

export function LineItemsEditor({ items, onChange }: LineItemsEditorProps) {
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Line items</Label>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="size-4" />
          Add row
        </Button>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="grid gap-2 rounded-lg border p-3">
            <div>
              <Label className="text-xs">Description</Label>
              <Input
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                placeholder="Service description"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Qty</Label>
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, { quantity: Number(e.target.value) || 1 })
                  }
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Unit price</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(index, { unitPrice: Number(e.target.value) || 0 })
                  }
                  required
                />
              </div>
            </div>
            {items.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => removeItem(index)}
              >
                <Trash2 className="size-4" />
                Remove
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
