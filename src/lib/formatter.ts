type Props = {
  decimal?: number;
  style?: "currency" | "decimal" | "percent" | "unit";
  locale?: "en-US" | "bn-BD";
  notation?: "compact" | "standard";
};

export function toBdt(number: number, props?: Props): string {
  const formatter = new Intl.NumberFormat(props?.locale ?? "en-US", {
    style: props?.style ?? "currency",
    currency: "BDT",
    minimumFractionDigits: props?.decimal ?? 2,
    maximumFractionDigits: props?.decimal ?? 2,
    currencyDisplay: "narrowSymbol",
    notation: props?.notation,
  });

  return formatter.format(number);
}
