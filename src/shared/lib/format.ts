import i18n from '../i18n'
let applicationCurrency = 'USD'
export function configureFormatting(currency: string) {
  applicationCurrency = currency
}
export function getCurrency() {
  return applicationCurrency
}
let applicationTimeZone: string | undefined
/**
 * Formats dates in the organization's IANA time zone (for example `Asia/Riyadh`)
 * instead of the browser's, so every user sees the same business day. Invalid or
 * missing zones fall back to the browser.
 */
export function configureTimeZone(zone?: string) {
  try {
    applicationTimeZone = zone
      ? new Intl.DateTimeFormat('en', { timeZone: zone }).resolvedOptions()
          .timeZone
      : undefined
  } catch {
    applicationTimeZone = undefined
  }
}
export const getTimeZone = () => applicationTimeZone
/**
 * In right-to-left languages a symbol such as "US$" ends with a neutral "$" that the
 * bidi algorithm moves to the wrong side ("$US"). A left-to-right mark after the
 * currency keeps it intact; other languages are formatted unchanged.
 */
function formatCurrency(format: Intl.NumberFormat, value: number) {
  if (i18n.dir(i18n.language) !== 'rtl') return format.format(value)
  return format
    .formatToParts(value)
    .map((part) =>
      part.type === 'currency' ? `${part.value}\u200E` : part.value,
    )
    .join('')
}
export const money = (minor: number, currency = applicationCurrency) =>
  formatCurrency(
    new Intl.NumberFormat(i18n.language, { style: 'currency', currency }),
    minor / 100,
  )
export const date = (iso: string) =>
  new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeZone: applicationTimeZone,
  }).format(new Date(iso))
/** Date and time, for timestamps such as "generated at" or audit entries. */
export const dateTime = (value: string | Date = new Date()) =>
  new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: applicationTimeZone,
  }).format(typeof value === 'string' ? new Date(value) : value)
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
/**
 * A quantity with its unit ("151 m3"), isolated so right-to-left text keeps the
 * number before the unit instead of reversing them ("m3 151").
 */
export const quantity = (value: number, unit: string | null | undefined) =>
  `\u2066${new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 3 }).format(value)}${unit ? ` ${unit}` : ''}\u2069`
export const compactNumber = (value: number) =>
  new Intl.NumberFormat(i18n.language, { notation: 'compact' }).format(value)
export const compactMoney = (minor: number, currency = applicationCurrency) =>
  formatCurrency(
    new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }),
    minor / 100,
  )
