import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "@/lib/currencies";
import { Label } from "@/components/ui/label";

type CurrencySelectProps = {
  id?: string;
  name?: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
};

export function CurrencySelect({
  id = "currency",
  name = "currency",
  defaultValue = DEFAULT_CURRENCY,
  required = true,
  className,
}: CurrencySelectProps) {
  return (
    <>
      <Label htmlFor={id}>Currency</Label>
      <select
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className={
          className ??
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
        }
      >
        {SUPPORTED_CURRENCIES.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.label}
          </option>
        ))}
      </select>
    </>
  );
}
