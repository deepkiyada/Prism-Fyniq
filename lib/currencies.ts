export const SUPPORTED_CURRENCIES = [
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "AED", label: "AED — UAE Dirham" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
] as const;

export type SupportedCurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

export const SUPPORTED_CURRENCY_CODES = SUPPORTED_CURRENCIES.map(
  (currency) => currency.code,
) as [SupportedCurrencyCode, ...SupportedCurrencyCode[]];

export const DEFAULT_CURRENCY: SupportedCurrencyCode = "INR";

export function isSupportedCurrency(code: string): code is SupportedCurrencyCode {
  return SUPPORTED_CURRENCY_CODES.includes(code as SupportedCurrencyCode);
}

export function getCurrencyLabel(code: string) {
  return SUPPORTED_CURRENCIES.find((currency) => currency.code === code)?.label ?? code;
}
