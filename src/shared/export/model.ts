export type ExportFormat =
  'text' | 'integer' | 'number' | 'money' | 'percent' | 'date' | 'datetime'
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
}
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
