import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'
import { accounting, type StatementColumn, type StatementRow } from './model'

/**
 * A financial statement table (income statement, balance sheet, cash flow):
 * section headings, indented lines, ruled subtotals and a double-ruled total,
 * with figures aligned on the decimal edge. Pass `shareHeader` to add a column
 * with each row's share of a reference total as a percentage and a bar.
 *
 * Wide statements scroll horizontally with the label column pinned.
 */
export function FinancialStatement({
  caption,
  columns,
  rows,
  decimals = 0,
  shareHeader,
  labelHeader,
  className,
}: {
  caption: string
  columns: StatementColumn[]
  rows: StatementRow[]
  decimals?: number
  shareHeader?: string
  labelHeader?: string
  className?: string
}) {
  const { i18n } = useTranslation()
  const percent = new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 1,
  })
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className={cn(
        'relative w-full overflow-x-auto rounded-lg border bg-card focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
        className,
      )}
    >
      <table className="w-full border-separate border-spacing-0 text-sm tabular-nums">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky start-0 z-10 min-w-64 border-b bg-muted px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase"
            >
              {labelHeader}
            </th>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={cn(
                  'border-b bg-muted px-4 py-2.5 text-end text-xs font-semibold whitespace-nowrap uppercase',
                  column.muted ? 'text-muted-foreground' : 'text-foreground',
                )}
              >
                {column.header}
              </th>
            ))}
            {shareHeader && (
              <th
                scope="col"
                className="w-40 border-b bg-muted px-4 py-2.5 text-end text-xs font-semibold whitespace-nowrap text-muted-foreground uppercase"
              >
                {shareHeader}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const kind = row.kind ?? 'line'
            const firstOfSection = kind === 'section' && index > 0
            const strong = kind === 'subtotal' || kind === 'total'
            const ruled = cn(
              kind === 'subtotal' && 'border-t border-foreground/40',
              kind === 'total' &&
                'border-t-2 border-b-[3px] border-double border-t-foreground border-b-foreground',
            )
            if (kind === 'group')
              return (
                <tr key={row.id}>
                  <th
                    scope="rowgroup"
                    colSpan={columns.length + 1 + (shareHeader ? 1 : 0)}
                    className="sticky start-0 bg-card px-4 pt-2.5 pb-1 text-start font-medium"
                    style={{ paddingInlineStart: `${1 + (row.depth ?? 1)}rem` }}
                  >
                    <span className="flex items-baseline gap-2">
                      {row.code && (
                        <bdi className="font-mono text-xs font-normal text-muted-foreground">
                          {row.code}
                        </bdi>
                      )}
                      {row.labelNode ?? row.label}
                    </span>
                  </th>
                </tr>
              )
            if (kind === 'section')
              return (
                <tr key={row.id}>
                  <th
                    scope="rowgroup"
                    colSpan={columns.length + 1 + (shareHeader ? 1 : 0)}
                    className={cn(
                      'sticky start-0 bg-card px-4 pt-3 pb-1.5 text-start text-xs font-semibold tracking-wide text-primary uppercase',
                      firstOfSection && 'pt-6',
                    )}
                  >
                    {row.label}
                  </th>
                </tr>
              )
            return (
              <tr
                key={row.id}
                className={cn(
                  'group/row',
                  kind === 'line' && 'hover:bg-muted/40',
                  kind === 'total' && 'bg-muted/50',
                )}
              >
                <th
                  scope="row"
                  className={cn(
                    'sticky start-0 bg-card px-4 py-1.5 text-start font-normal group-hover/row:bg-muted/40',
                    strong && 'py-2 font-semibold',
                    kind === 'total' && 'bg-muted/50 text-base',
                  )}
                  style={{
                    paddingInlineStart: `${1 + (row.depth ?? (kind === 'line' ? 1 : 0)) * 1}rem`,
                  }}
                >
                  <span className="flex min-w-0 items-baseline gap-2">
                    {row.code && (
                      <bdi className="shrink-0 font-mono text-xs text-muted-foreground">
                        {row.code}
                      </bdi>
                    )}
                    <span className="min-w-0">
                      {row.labelNode ?? row.label}
                    </span>
                  </span>
                </th>
                {row.values.map((value, column) => (
                  <td
                    key={columns[column]?.id ?? column}
                    className={cn(
                      'px-4 py-1.5 text-end whitespace-nowrap',
                      strong && 'py-2 font-semibold',
                      ruled,
                      columns[column]?.muted && 'text-muted-foreground',
                      // Red marks losses: a negative subtotal or total, or a row flagged
                      // negative. Costs shown in parentheses are expected and stay neutral.
                      (row.tone === 'negative' ||
                        (strong && value !== null && value < 0 && !row.tone)) &&
                        'text-destructive',
                    )}
                  >
                    <bdi>{accounting(value, i18n.language, decimals)}</bdi>
                  </td>
                ))}
                {shareHeader && (
                  <td className={cn('px-4 py-1.5', strong && 'py-2', ruled)}>
                    {row.share !== undefined && row.share !== null && (
                      <span className="flex items-center justify-end gap-2">
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"
                        >
                          <span
                            className={cn(
                              'block h-full rounded-full',
                              row.share < 0
                                ? 'bg-destructive'
                                : 'bg-primary/70',
                            )}
                            style={{
                              width: `${Math.min(100, Math.abs(row.share) * 100)}%`,
                            }}
                          />
                        </span>
                        <span className="w-12 text-end text-xs text-muted-foreground">
                          {percent.format(row.share)}
                        </span>
                      </span>
                    )}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/**
 * A horizontal 100% bar splitting a total into named parts, for statement
 * summaries such as "what the assets are" and "how they are financed".
 */
export function CompositionBar({
  label,
  parts,
  format,
}: {
  label: string
  parts: { id: string; label: string; value: number; className: string }[]
  format: (value: number) => string
}) {
  const total =
    parts.reduce((sum, part) => sum + Math.max(0, part.value), 0) || 1
  return (
    <figure className="grid gap-2">
      <figcaption className="text-xs font-medium text-muted-foreground">
        {label}
      </figcaption>
      <div
        role="img"
        aria-label={`${label}: ${parts.map((part) => `${part.label} ${format(part.value)}`).join(', ')}`}
        className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
      >
        {parts.map((part) => (
          <span
            key={part.id}
            className={cn(
              'h-full first:rounded-s-full last:rounded-e-full',
              part.className,
            )}
            style={{ width: `${(Math.max(0, part.value) / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {parts.map((part) => (
          <li key={part.id} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn('size-2 rounded-full', part.className)}
            />
            <span className="text-muted-foreground">{part.label}</span>
            <bdi className="font-medium tabular-nums">{format(part.value)}</bdi>
          </li>
        ))}
      </ul>
    </figure>
  )
}
