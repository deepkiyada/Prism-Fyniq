export function formatMoney(currency: string, amount: number) {
  return `${currency} ${amount.toFixed(2)}`;
}
