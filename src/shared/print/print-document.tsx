import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useServices } from '@/shared/api/services'
import { BrandMark } from '@/shared/brand/brand-mark'
import { getBrand } from '@/shared/brand/brand'
import { dateTime } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import {
  formatOf,
  formatValue,
  isNumeric,
  sheetTotals,
  type ExportDocument,
  type ExportSheet,
} from '@/shared/export/model'

/**
 * A printable business document: letterhead, title block with the period or
 * reference, applied filters, the body and a generated-by footer. Rendered inside
 * `PrintPreview`; the same markup is what prints. Use print-sized type (10-11pt)
 * and no interactive controls inside.
 */
export function PrintDocument({
  title,
  subtitle,
  reference,
  details,
  status,
  children,
  note,
}: {
  title: string
  /** Period, as-of date or record summary under the title. */
  subtitle?: string
  /** Business reference shown at the top end, for example `PO-2041`. */
  reference?: string
  /** Filters or header fields as label/value pairs. */
  details?: [string, string][]
  /** Short status text shown next to the reference, for example "Approved". */
  status?: string
  children: ReactNode
  /** Extra footer text such as "Amounts in EGP". */
  note?: string
}) {
  const { t } = useTranslation()
  const { session } = useServices()
  const brand = getBrand()
  return (
    <article className="flex flex-col gap-5 text-[10.5pt] leading-snug text-foreground">
      <header className="flex items-start justify-between gap-6 border-b-2 border-foreground pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark className="size-11 rounded-md" />
          <div className="min-w-0">
            <p className="text-[13pt] font-semibold">
              {brand.letterhead?.organization ?? brand.name}
            </p>
            {brand.letterhead?.lines.map((line) => (
              <p key={line} className="text-[8.5pt] text-muted-foreground">
                {line}
              </p>
            ))}
            <p className="text-[8.5pt] text-muted-foreground">
              {session.workspace.name}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-end">
          <h1 className="text-[16pt] leading-tight font-semibold">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-[9.5pt] text-muted-foreground">
              {subtitle}
            </p>
          )}
          {(reference || status) && (
            <p className="mt-1 text-[9.5pt]">
              {reference && (
                <bdi className="font-mono font-semibold">{reference}</bdi>
              )}
              {reference && status && ' · '}
              {status}
            </p>
          )}
        </div>
      </header>
      {details && details.length > 0 && (
        <dl className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-x-6 gap-y-2 rounded-md border px-4 py-3 text-[9pt]">
          {details.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium break-words">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="flex flex-col gap-5">{children}</div>
      <footer className="mt-2 flex justify-between gap-4 border-t pt-2 text-[8pt] text-muted-foreground">
        <span>
          {t('printedBy', { date: dateTime(), name: session.user.name })}
        </span>
        {note && <span>{note}</span>}
      </footer>
    </article>
  )
}

/** Titled block inside a document; keeps its heading with the first rows. */
export function PrintSection({
  title,
  children,
  className,
}: {
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex flex-col gap-2', className)}>
      {title && (
        <h2 className="text-[11pt] font-semibold break-after-avoid">{title}</h2>
      )}
      {children}
    </section>
  )
}

/** Label/value grid for record headers. */
export function PrintFields({
  fields,
  columns = 3,
}: {
  fields: [string, ReactNode][]
  columns?: 2 | 3 | 4
}) {
  return (
    <dl
      className={cn(
        'grid gap-x-6 gap-y-2 text-[9.5pt]',
        columns === 2 && 'grid-cols-2',
        columns === 3 && 'grid-cols-3',
        columns === 4 && 'grid-cols-4',
      )}
    >
      {fields.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[8.5pt] text-muted-foreground">{label}</dt>
          <dd className="font-medium break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Signature lines for approvals on printed records. */
export function PrintSignatures({ roles }: { roles: string[] }) {
  return (
    <div
      className="mt-6 grid gap-8 break-inside-avoid"
      style={{ gridTemplateColumns: `repeat(${roles.length}, minmax(0, 1fr))` }}
    >
      {roles.map((role) => (
        <div key={role} className="text-[9pt]">
          <div className="h-10 border-b border-foreground" />
          <p className="mt-1 text-muted-foreground">{role}</p>
        </div>
      ))}
    </div>
  )
}

/**
 * The print rendering of an export sheet: same columns, formats, structure and
 * totals as the spreadsheet, so screen, Excel and paper always agree. Headers
 * repeat on every page.
 */
export function PrintTable<Row>({
  sheet,
  document,
  caption,
}: {
  sheet: ExportSheet<Row>
  document: Pick<ExportDocument, 'currency'>
  caption?: string
}) {
  const { i18n } = useTranslation()
  const options = { currency: document.currency, locale: i18n.language }
  const totals = sheetTotals(sheet)
  const align = (numeric: boolean) => (numeric ? 'text-end' : 'text-start')
  return (
    <table className="w-full border-collapse text-[9pt] tabular-nums">
      {caption && <caption className="sr-only">{caption}</caption>}
      <thead>
        <tr className="border-y-2 border-foreground">
          {sheet.columns.map((column, columnIndex) => (
            <th
              key={`${columnIndex}-${column.header}`}
              scope="col"
              className={cn(
                'px-2 py-1.5 font-semibold whitespace-nowrap',
                align(
                  typeof column.format === 'function' ||
                    isNumeric(column.format),
                ),
              )}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sheet.rows.map((row, index) => {
          const kind = sheet.rowKind?.(row)
          const level = sheet.indent?.(row) ?? 0
          return (
            <tr
              key={index}
              className={cn(
                'border-b border-border',
                kind === 'section' && 'bg-muted font-semibold',
                kind === 'subtotal' &&
                  'border-t border-t-foreground/60 font-semibold',
                kind === 'total' &&
                  'border-t-2 border-b-4 border-double border-foreground font-bold',
              )}
            >
              {sheet.columns.map((column, columnIndex) => {
                const format = formatOf(column, row)
                return (
                  <td
                    key={`${columnIndex}-${column.header}`}
                    className={cn(
                      'px-2 py-1 align-top',
                      align(isNumeric(format)),
                      isNumeric(format) && 'whitespace-nowrap',
                    )}
                    style={
                      columnIndex === 0 && level
                        ? { paddingInlineStart: `${0.5 + level * 0.9}rem` }
                        : undefined
                    }
                  >
                    <bdi>{formatValue(column.value(row), format, options)}</bdi>
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
      {totals && (
        <tfoot>
          <tr className="border-t-2 border-b-4 border-double border-foreground font-bold">
            {sheet.columns.map((column, index) => (
              <td
                key={`${index}-${column.header}`}
                className={cn(
                  'px-2 py-1.5 whitespace-nowrap',
                  align(index > 0 && totals[index] !== null),
                )}
              >
                {index === 0 && totals[0] === null ? (
                  sheet.totalsLabel
                ) : (
                  <bdi>
                    {formatValue(
                      totals[index],
                      typeof column.format === 'function'
                        ? undefined
                        : column.format,
                      options,
                    )}
                  </bdi>
                )}
              </td>
            ))}
          </tr>
        </tfoot>
      )}
    </table>
  )
}
