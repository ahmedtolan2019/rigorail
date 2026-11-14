import type { FormatterModule } from 'i18next'

type Format = (value: unknown, lng: string | undefined, options: Record<string, unknown>) => string
const rightToLeft = new Set(['ar', 'he', 'fa', 'ur'])
const rtl = (lng: string | undefined) => rightToLeft.has((lng ?? '').split('-')[0]!)
/** Latin letters or digits: a reference (REQ-1042), a code or an amount written left to right. */
const leftToRight = /[A-Za-z0-9]/

/**
 * The interpolation formatter: named formats (`{{count, number}}`), and in a
 * right-to-left language every value in Latin script or digits wrapped in a first-strong
 * isolate (U+2068 … U+2069). Without it "اعتماد {{reference}}؟" renders REQ-1042 as
 * 1042-REQ next to the Arabic question mark.
 */
export function bidiFormatter(): FormatterModule {
  // `number` is the one named format the app uses; register others with i18n.services.formatter.add.
  const formats: Record<string, Format> = {
    number: (value, lng, options) => new Intl.NumberFormat(lng, options).format(value as number),
  }
  return {
    type: 'formatter',
    init: () => undefined,
    add: (name, format) => {
      formats[name.toLowerCase().trim()] = format
    },
    addCached: (name, create) => {
      formats[name.toLowerCase().trim()] = (value, lng, options) => create(lng, options)(value)
    },
    format: (value, format, lng, options): string => {
      let result: unknown = value
      for (const name of format ? format.split(',').map((part) => part.trim().toLowerCase()) : []) {
        const apply = formats[name]
        if (apply && result != null) result = apply(result, lng, (options ?? {}) as Record<string, unknown>)
      }
      // Values that are not strings (a count) pass through, as i18next's own formatter leaves them.
      return (rtl(lng) && typeof result === 'string' && leftToRight.test(result) ? `\u2068${result}\u2069` : result) as string
    },
  }
}
