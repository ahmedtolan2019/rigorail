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
