import type { Cell, Row as SheetRow, Sheet } from 'write-excel-file/browser'
import {
  downloadBlob,
  formatOf,
  isNumeric,
  safeFileName,
  sheetTotals,
  type ExportColumn,
  type ExportDocument,
  type ExportFormat,
  type ExportSheet,
  type ExportValue,
} from './model'

// Neutral palette mirroring the design tokens; Excel needs literal hex values.
const border = '#D6DDE5',
  zebra = '#F6F8FA',
  muted = '#5D6876',
  section = '#EEF0F3',
  fallbackAccent = '#2B2F36'

/**
 * Header fill from the active brand's `--primary` when it is a hex color dark
 * enough for white text (light themes); otherwise a neutral charcoal.
 */
function accent() {
  if (typeof document === 'undefined') return fallbackAccent
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue('--primary')
    .trim()
  const match = /^#([0-9a-f]{6})$/i.exec(value)
  if (!match) return fallbackAccent
  const [r, g, b] = [0, 2, 4].map((index) =>
    parseInt(match[1]!.slice(index, index + 2), 16),
  )
  const luminance = (0.2126 * r! + 0.7152 * g! + 0.0722 * b!) / 255
  return luminance < 0.55 ? value.toUpperCase() : fallbackAccent
}

function numberFormat(format: ExportFormat | undefined, currency: string) {
  switch (format) {
    case 'integer':
      return '#,##0'
    case 'accounting':
      return '#,##0;(#,##0);"–"'
    case 'number':
      return '#,##0.00'
    case 'money':
      return `#,##0.00 "${currency}"`
    case 'percent':
      return '0.0%'
    case 'date':
      return 'yyyy-mm-dd'
    case 'datetime':
      return 'yyyy-mm-dd hh:mm'
    default:
      return undefined
  }
}

function toCell(
  value: ExportValue,
  format: ExportFormat | undefined,
  currency: string,
  style: Partial<Cell & object> = {},
): Cell {
  if (value === null || value === undefined || value === '')
    return { value: null, ...style } as Cell
  const numberStyle = numberFormat(format, currency)
  if (value instanceof Date)
    return {
      value,
      type: Date,
      format: numberStyle ?? 'yyyy-mm-dd',
      ...style,
    } as Cell
  if (typeof value === 'number')
    return { value, type: Number, format: numberStyle, ...style } as Cell
  return { value, type: String, ...style } as Cell
}

function width<Row>(
  column: ExportColumn<Row>,
  rows: Row[],
  indent?: (row: Row) => number,
) {
  if (column.width) return column.width
  const sample = rows.slice(0, 500).map((row) => {
    const value = column.value(row)
    const pad = indent ? indent(row) * 2 : 0
    return value instanceof Date ? 12 : String(value ?? '').length + pad
  })
  return Math.min(
    48,
    Math.max(10, column.header.length + 2, ...sample.map((n) => n + 2)),
  )
}

function sheetData<Row>(document: ExportDocument, sheet: ExportSheet<Row>) {
  const brand = accent()
  const span = sheet.columns.length
  const blank = (): SheetRow => Array.from({ length: span }, () => null)
  const header: SheetRow[] = [
    [
      {
        value: document.title,
        fontWeight: 'bold',
        fontSize: 14,
        columnSpan: span,
      } as Cell,
      ...blank().slice(1),
    ],
  ]
  if (document.subtitle)
    header.push([
      { value: document.subtitle, textColor: muted, columnSpan: span } as Cell,
      ...blank().slice(1),
    ])
  for (const [label, value] of document.details ?? [])
    header.push([
      { value: label, textColor: muted } as Cell,
      { value, columnSpan: Math.max(1, span - 1) } as Cell,
      ...blank().slice(2),
    ])
  header.push(blank())
  const head: SheetRow = sheet.columns.map(
    (column) =>
      ({
        value: column.header,
        fontWeight: 'bold',
        textColor: '#FFFFFF',
        backgroundColor: brand,
        alignVertical: 'center',
        height: 22,
        align:
          typeof column.format === 'function' || isNumeric(column.format)
            ? 'right'
            : undefined,
      }) as Cell,
  )
  const structured = Boolean(sheet.rowKind)
  const body: SheetRow[] = sheet.rows.map((row, index) => {
    const kind = sheet.rowKind?.(row)
    const level = sheet.indent?.(row) ?? 0
    return sheet.columns.map((column, columnIndex) =>
      toCell(column.value(row), formatOf(column, row), document.currency, {
        // Statements read by structure; plain lists use zebra rows.
        ...(kind === 'section'
          ? { backgroundColor: section, fontWeight: 'bold' }
          : kind === 'subtotal'
            ? {
                fontWeight: 'bold',
                topBorderColor: '#8A97A6',
                topBorderStyle: 'thin',
              }
            : kind === 'total'
              ? {
                  fontWeight: 'bold',
                  topBorderColor: '#2B2F36',
                  topBorderStyle: 'thin',
                  bottomBorderColor: '#2B2F36',
                  bottomBorderStyle: 'double',
                }
              : !structured && index % 2
                ? { backgroundColor: zebra }
                : {}),
        ...(kind === 'total'
          ? {}
          : { bottomBorderColor: border, bottomBorderStyle: 'thin' }),
        ...(columnIndex === 0 && level > 0 ? { indent: level } : {}),
      }),
    )
  })
  const totalValues = sheetTotals(sheet)
  const totals = totalValues
    ? [
        sheet.columns.map((column, index) => {
          const style = {
            fontWeight: 'bold' as const,
            topBorderColor: '#8A97A6',
            topBorderStyle: 'thin' as const,
          }
          if (index === 0 && !column.total)
            return toCell(
              sheet.totalsLabel ?? 'Total',
              'text',
              document.currency,
              style,
            )
          return toCell(
            totalValues[index],
            typeof column.format === 'function' ? undefined : column.format,
            document.currency,
            style,
          )
        }),
      ]
    : []
  return {
    data: [...header, head, ...body, ...totals],
    headerRows: header.length + 1,
  }
}

/**
 * Formatted workbook: title block, applied filters, branded frozen header, zebra
 * rows, typed number/date formats and a totals row. Loaded only when used.
 */
export async function exportXlsx(
  document: ExportDocument,
  sheets: ExportSheet<never>[] | ExportSheet<unknown>[],
) {
  const { default: writeExcelFile } = await import('write-excel-file/browser')
  const built: Sheet<Blob>[] = (sheets as ExportSheet<unknown>[]).map(
    (sheet) => {
      const { data, headerRows } = sheetData(document, sheet)
      return {
        data,
        sheet: sheet.name.slice(0, 31),
        columns: sheet.columns.map((column) => ({
          width: width(column, sheet.rows, sheet.indent),
        })),
        stickyRowsCount: headerRows,
        stickyColumnsCount: 1,
        showGridLines: false,
        rightToLeft: document.rtl,
      }
    },
  )
  const blob = await writeExcelFile(built, {
    fontFamily: 'Calibri',
    fontSize: 11,
  }).toBlob()
  downloadBlob(blob, `${safeFileName(document.fileName)}.xlsx`)
}
