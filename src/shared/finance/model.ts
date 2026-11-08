import type { ReactNode } from 'react'
import type { ExportSheet } from '@/shared/export/model'

/**
 * Accounting figure in major units from minor units: thousands separators,
 * negatives in parentheses and a dash for zero, as printed statements show them.
 */
export function accounting(
  minor: number | null | undefined,
  locale: string,
  decimals = 0,
) {
  if (minor === null || minor === undefined) return ''
  if (Math.round(minor / 10 ** (2 - decimals)) === 0) return '–'
  const text = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(minor) / 100)
  return minor < 0 ? `(${text})` : text
}

/** `group` is a sub-heading inside a section, such as "Current assets". */
export type StatementRowKind = 'section' | 'group' | 'line' | 'subtotal' | 'total'
export interface StatementRow {
  id: string
  /** Plain label, also used by exports and the printed copy. */
  label: string
  /** Screen rendering of the label, for example a link to the account. */
  labelNode?: ReactNode
  /** Account or line code, shown before the label in a muted monospace. */
  code?: string
  kind?: StatementRowKind
  /** Indent level under its section (0 for section headings and totals). */
  depth?: number
  /** One value per amount column, in minor units; null leaves the cell empty. */
  values: (number | null)[]
  /** Share of a reference total (0-1), drawn as a bar in the share column. */
  share?: number | null
  /**
   * `negative` flags a figure (a loss); `neutral` keeps an expected negative, such
   * as a cost subtotal, out of loss red.
   */
  tone?: 'negative' | 'positive' | 'neutral'
}
export interface StatementColumn {
  id: string
  header: string
  /** De-emphasized comparison column, such as last year. */
  muted?: boolean
}

/**
 * The statement as an export sheet, so Excel, CSV and the printed copy keep its
 * sections, indentation, subtotals and totals. Amounts are major units.
 */
export function statementSheet(
  name: string,
  labelHeader: string,
  columns: StatementColumn[],
  rows: StatementRow[],
  shareHeader?: string,
): ExportSheet<StatementRow> {
  return {
    name,
    rows,
    rowKind: (row) =>
      row.kind === 'line' || !row.kind
        ? undefined
        : row.kind === 'group'
          ? 'subtotal'
          : row.kind,
    indent: (row) => row.depth ?? (row.kind === 'line' || !row.kind ? 1 : 0),
    columns: [
      {
        header: labelHeader,
        value: (row) => (row.code ? `${row.code}  ${row.label}` : row.label),
      },
      ...columns.map((column, index) => ({
        header: column.header,
        value: (row: StatementRow) => {
          const value = row.values[index]
          return value === null || value === undefined ? null : value / 100
        },
        format: 'accounting' as const,
      })),
      ...(shareHeader
        ? [
            {
              header: shareHeader,
              value: (row: StatementRow) => row.share ?? null,
              format: 'percent' as const,
            },
          ]
        : []),
    ],
  }
}
