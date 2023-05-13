export function toBdt(number: number, { decimal } = { decimal: 2 }): string {
  const formatter = new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: decimal,
    currencyDisplay: "narrowSymbol",
  });

  return formatter.format(number);
}
