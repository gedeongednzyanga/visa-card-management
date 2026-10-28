import { formatAmount, type Currency } from "@/lib/cards-data"

export { formatAmount }

const numberFormat = new Intl.NumberFormat("en-US")

export function formatNumber(value: number) {
  return numberFormat.format(value)
}

/** « + 1,200.00 USD » / « - 45.00 USD » */
export function formatSigned(value: number, currency: Currency) {
  const abs = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value))
  return `${value < 0 ? "-" : "+"} ${abs} ${currency}`
}
