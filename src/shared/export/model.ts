/** `accounting`: whole units, negatives in parentheses, a dash for zero (statements). */
export type ExportFormat =
  | 'text'
  | 'integer'
  | 'number'
  | 'accounting'
  | 'money'
  | 'percent'
  | 'date'
  | 'datetime'
export type ExportValue = string | number | Date | null | undefined

export interface ExportColumn<Row> {
  header: string
  value: (row: Row) => ExportValue
  /** Cell format; a function allows mixed formats such as a metrics summary. */
  format?: ExportFormat | ((row: Row) => ExportFormat)
  /** Width in characters; computed from content when omitted. */
  width?: number
  /** Adds a totals row entry for this column. */
  total?: 'sum' | 'average'
}
export interface ExportSheet<Row> {
  name: string
  columns: ExportColumn<Row>[]
  rows: Row[]
  /** Label written in the first column of the totals row. */
  totalsLabel?: string
  /**
   * Statement structure: `section` rows are headings, `subtotal` and `total` rows are
   * emphasized. Spreadsheets and printed documents style them the same way.
   */
  rowKind?: (row: Row) => ExportRowKind | undefined
  /** Indent level of the first column, for hierarchies such as a chart of accounts. */
  indent?: (row: Row) => number
  /**
   * Explicit totals row, one value per column, when the rows alone cannot give it
   * (for example a hierarchy exported above its detail level).
   */
  totals?: (number | null)[]
}
export type ExportRowKind = 'section' | 'subtotal' | 'total'
export interface ExportDocument {
  /** File name without extension. */
  fileName: string
  title: string
  subtitle?: string
  /** Applied filters or parameters, written above the data as label/value pairs. */
  details?: [string, string][]
  /** ISO currency for `money` columns. Amounts are major units (12.5, not 1250). */
  currency: string
  rtl?: boolean
}

/** True for formats that are right-aligned numbers in tables and spreadsheets. */
export const isNumeric = (format: ExportFormat | undefined) =>
  format !== undefined &&
  format !== 'text' &&
  format !== 'date' &&
  format !== 'datetime'

export function formatOf<Row>(column: ExportColumn<Row>, row: Row) {
  return typeof column.format === 'function'
    ? column.format(row)
    : column.format
}

/**
 * Totals row values, one per column (null where the column has no total). Section,
 * subtotal and total rows are skipped so statement exports never double count.
 */
export function sheetTotals<Row>(sheet: ExportSheet<Row>) {
  if (sheet.totals) return sheet.totals
  if (!sheet.columns.some((column) => column.total)) return null
  const detail = sheet.rows.filter((row) => !sheet.rowKind?.(row))
  return sheet.columns.map((column) => {
    if (!column.total) return null
    const values = detail
      .map((row) => column.value(row))
      .filter((value): value is number => typeof value === 'number')
    const sum = values.reduce((total, value) => total + value, 0)
    if (column.total === 'sum') return sum
    return values.length ? sum / values.length : null
  })
}

/** Display text for printed documents, localized the same way screens are. */
export function formatValue(
  value: ExportValue,
  format: ExportFormat | undefined,
  options: { currency: string; locale: string },
) {
  if (value === null || value === undefined || value === '') return ''
  const { currency, locale } = options
  if (value instanceof Date || format === 'date' || format === 'datetime') {
    const parsed =
      value instanceof Date
        ? value
        : typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
          ? new Date(`${value}T00:00:00`)
          : new Date(value)
    if (Number.isNaN(parsed.getTime())) return String(value)
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      ...(format === 'datetime' ? { timeStyle: 'short' } : {}),
    }).format(parsed)
  }
  if (typeof value !== 'number') return String(value)
  switch (format) {
    case 'integer':
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
        value,
      )
    case 'accounting': {
      if (Math.round(value) === 0) return '–'
      const text = new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
      }).format(Math.abs(value))
      return value < 0 ? `(${text})` : text
    }
    case 'money':
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        currencyDisplay: 'code',
      }).format(value)
    case 'percent':
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        maximumFractionDigits: 1,
      }).format(value)
    case 'number':
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value)
    default:
      return String(value)
  }
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: fileName,
  })
  document.body.append(link)
  link.click()
  link.remove()
  // Give the browser time to start the download before releasing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function safeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'export'
}
