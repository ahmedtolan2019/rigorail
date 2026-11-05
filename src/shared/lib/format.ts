import i18n from '../i18n'
let applicationCurrency = 'USD'
export function configureFormatting(currency: string) {
  applicationCurrency = currency
}
export function getCurrency() {
  return applicationCurrency
}
export const money = (minor: number, currency = applicationCurrency) =>
  new Intl.NumberFormat(i18n.language, { style: 'currency', currency }).format(
    minor / 100,
  )
export const date = (iso: string) =>
  new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
    new Date(iso),
  )
export const normalizeNumber = (value: string) =>
  value
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/٫/g, '.')
const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000_000],
  ['month', 2_592_000_000],
  ['week', 604_800_000],
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
]
/** "3 days ago" in the active language; pair with `date()` in a title for the exact value. */
export const relativeDate = (iso: string, now = Date.now()) => {
  const delta = Date.parse(iso) - now
  const [unit, size] =
    units.find(([, ms]) => Math.abs(delta) >= ms) ?? units[units.length - 1]!
  return new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' }).format(
    Math.round(delta / size),
    unit,
  )
}
export const compactNumber = (value: number) =>
  new Intl.NumberFormat(i18n.language, { notation: 'compact' }).format(value)
export const compactMoney = (minor: number, currency = applicationCurrency) =>
  new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(minor / 100)
