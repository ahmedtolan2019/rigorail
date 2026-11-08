import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'

export interface GridColumn<Row> {
  key: keyof Row & string
  header: string
  /** CSS width of the column, for example '6rem'; free text columns can omit it. */
  width?: string
  align?: 'start' | 'end'
  inputMode?: 'text' | 'decimal' | 'numeric'
  placeholder?: string
  /** Cleans typed or pasted text, for example Arabic digits to Latin. */
  normalize?: (value: string) => string
  /** Custom editor for the cell (a picker); receives the row and an updater. */
  render?: (cell: {
    row: Row
    index: number
    id: string
    invalid: boolean
    update: (patch: Partial<Row>) => void
  }) => React.ReactNode
}
export interface GridComputed<Row> {
  id: string
  header: string
  width?: string
  render: (row: Row, index: number) => React.ReactNode
}

/**
 * Spreadsheet-style line entry: one row per line, headers once, borderless cells
 * that show their border on hover and focus. Enter moves down the column and adds
 * a line after the last one; pasting rows copied from Excel fills the grid from the
 * cell you paste into. Use it wherever users enter many lines (order lines, BOQ
 * items, journal lines) instead of one card of fields per line.
 */
export function GridEditor<Row extends Record<string, string>>({
  caption,
  columns,
  computed = [],
  rows,
  onChange,
  blank,
  error,
  minRows = 1,
  addLabel,
  rowLabel,
  footer,
  disabled = false,
  idPrefix,
}: {
  caption: string
  columns: GridColumn<Row>[]
  computed?: GridComputed<Row>[]
  rows: Row[]
  onChange: (rows: Row[]) => void
  /** A new empty line. */
  blank: () => Row
  /** Message for an invalid cell, shown on the cell and to screen readers. */
  error?: (index: number, key: keyof Row & string) => string | undefined
  minRows?: number
  addLabel: string
  /** Accessible name of a row, for example "Line 3". */
  rowLabel: (index: number) => string
  footer?: React.ReactNode
  disabled?: boolean
  /** Unique prefix for cell ids when several grids share a page. */
  idPrefix: string
}) {
  const { t } = useTranslation()
  const cells = React.useRef(new Map<string, HTMLInputElement>())
  const [focusNext, setFocusNext] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (!focusNext) return
    cells.current.get(focusNext)?.focus()
    setFocusNext(null)
  }, [focusNext, rows])
  const editable = columns.filter((column) => !column.render)
  const cellId = (row: number, key: string) => `${idPrefix}-${row}-${key}`
  const update = (index: number, patch: Partial<Row>) =>
    onChange(rows.map((row, at) => (at === index ? { ...row, ...patch } : row)))

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>, row: number, key: string) {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
    event.preventDefault()
    const target = event.shiftKey ? row - 1 : row + 1
    if (target < 0) return
    if (target >= rows.length) onChange([...rows, blank()])
    setFocusNext(cellId(target, key))
  }

  function onPaste(event: React.ClipboardEvent<HTMLInputElement>, row: number, key: string) {
    const text = event.clipboardData.getData('text/plain')
    if (!/[\t\n]/.test(text.trim())) return
    event.preventDefault()
    const lines = text
      .replace(/\r/g, '')
      .split('\n')
      .filter((line) => line.trim().length)
      .map((line) => line.split('\t'))
    const start = editable.findIndex((column) => column.key === key)
    const next = [...rows]
    lines.forEach((values, offset) => {
      const index = row + offset
      const current = { ...(next[index] ?? blank()) } as Record<string, string>
      values.forEach((value, column) => {
        const target = editable[start + column]
        if (target) current[target.key] = target.normalize ? target.normalize(value.trim()) : value.trim()
      })
      next[index] = current as Row
    })
    onChange(next)
  }

  const template = [
    ...columns.map((column) => column.width ?? 'minmax(12rem,1fr)'),
    ...computed.map((column) => column.width ?? '8rem'),
    '2.5rem',
  ].join(' ')
  // Fixed layout keeps every column at its declared width, so a long picked value
  // truncates in its cell instead of reflowing the whole grid while a popover is open.
  const minWidth = `${template
    .split(' ')
    .reduce((sum, width) => sum + Number(/([\d.]+)rem/.exec(width)?.[1] ?? 0), 0)}rem`
  return (
    <div className="grid gap-3">
      {/* `relative` clips the sr-only header label; inline-size containment keeps the wide table from widening its ancestors (and the page on phones). */}
      <div className="relative overflow-x-auto rounded-lg border bg-card [contain:inline-size]">
        <table className="w-full table-fixed border-separate border-spacing-0 text-sm" style={{ minWidth }}>
          <caption className="sr-only">{caption}</caption>
          <colgroup>
            {template.split(' ').map((width, index) => (
              <col key={index} style={width.startsWith('minmax') ? undefined : { width }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {[...columns, ...computed].map((column) => (
                <th
                  key={'key' in column ? column.key : column.id}
                  scope="col"
                  className={cn(
                    'border-b bg-muted px-2 py-2 text-xs font-semibold whitespace-nowrap text-muted-foreground first:ps-3',
                    'align' in column && column.align === 'end' ? 'text-end' : 'text-start',
                    !('key' in column) && 'text-end',
                  )}
                >
                  {column.header}
                </th>
              ))}
              <th scope="col" className="border-b bg-muted">
                <span className="sr-only">{t('rowActions')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} aria-label={rowLabel(index)} className="group/row">
                {columns.map((column) => {
                  const message = error?.(index, column.key)
                  const id = cellId(index, column.key)
                  return (
                    <td key={column.key} className="border-b px-1 py-1 align-top first:ps-2 group-last/row:border-b-0">
                      {column.render ? (
                        column.render({ row, index, id, invalid: Boolean(message), update: (patch) => update(index, patch) })
                      ) : (
                        <input
                          id={id}
                          ref={(node) => {
                            if (node) cells.current.set(id, node)
                            else cells.current.delete(id)
                          }}
                          value={row[column.key] ?? ''}
                          disabled={disabled}
                          inputMode={column.inputMode}
                          placeholder={column.placeholder}
                          aria-label={`${column.header}, ${rowLabel(index)}`}
                          aria-invalid={Boolean(message) || undefined}
                          aria-describedby={message ? `${id}-error` : undefined}
                          onChange={(event) =>
                            update(index, {
                              [column.key]: column.normalize ? column.normalize(event.target.value) : event.target.value,
                            } as Partial<Row>)
                          }
                          onKeyDown={(event) => onKeyDown(event, index, column.key)}
                          onPaste={(event) => onPaste(event, index, column.key)}
                          className={cn(
                            'h-8 w-full rounded-md border border-transparent bg-transparent px-2 outline-none transition-colors placeholder:text-muted-foreground/60 hover:border-input focus-visible:border-ring focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:bg-destructive/5',
                            column.align === 'end' && 'text-end tabular-nums',
                          )}
                        />
                      )}
                      {message && (
                        <p id={`${id}-error`} className="px-2 pt-0.5 text-xs text-destructive">
                          {message}
                        </p>
                      )}
                    </td>
                  )
                })}
                {computed.map((column) => (
                  <td key={column.id} className="border-b px-2 py-1 text-end align-top tabular-nums group-last/row:border-b-0">
                    <div className="flex h-8 items-center justify-end">{column.render(row, index)}</div>
                  </td>
                ))}
                <td className="border-b px-1 py-1 align-top group-last/row:border-b-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground opacity-50 group-hover/row:opacity-100 hover:text-destructive focus-visible:opacity-100"
                    aria-label={`${t('remove')} ${rowLabel(index)}`}
                    disabled={disabled || rows.length <= minRows}
                    onClick={() => onChange(rows.filter((_, at) => at !== index))}
                  >
                    <Trash2 />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          {footer && <tfoot>{footer}</tfoot>}
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => {
            onChange([...rows, blank()])
            setFocusNext(cellId(rows.length, editable[0]?.key ?? ''))
          }}
        >
          <Plus data-icon="inline-start" />
          {addLabel}
        </Button>
        <p className="text-xs text-muted-foreground">{t('gridHint')}</p>
      </div>
    </div>
  )
}
