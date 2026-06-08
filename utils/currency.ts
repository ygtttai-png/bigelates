export function fmtMoney(n: number): string {
  return new Intl.NumberFormat("tr-TR").format(Math.round(n)) + " ₺";
}

export function fmtMoneyShort(n: number): string {
  if (n >= 1000) {
    return "₺" + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "B";
  }
  return "₺" + Math.round(n);
}
