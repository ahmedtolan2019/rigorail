import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  flexRender,
  type Cell,
  type Column,
  type Header,
  type Row,
  type Table as TanstackTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Skeleton } from '@/shared/ui/skeleton'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** Translated name for menus such as column visibility. */
    label?: string
    /**
     * Extra classes for this column's header and cells, e.g. `text-end`. Cells do
     * not wrap by default; add `whitespace-normal` for long free text.
     */
    className?: string
  }
}

/**
 * Renders a TanStack table with the application's conventions: sticky header,
 * pinned start/end columns, grouping and tree expansion, skeleton loading, a
 * refetch indicator, clickable rows and optional row virtualization.
 *
 * Server pagination is the default. Use `virtualize` only for measured large
 * client-side datasets; it needs a bounded `height`.
 */
export function DataTable<TData>({
  table,
  loading = false,
  fetching = false,
  empty,
  onRowClick,
  virtualize = false,
  height = 560,
  skeletonRows = 8,
  caption,
  className,
  fitViewport = false,
}: {
  table: TanstackTable<TData>
  loading?: boolean
  fetching?: boolean
  empty?: ReactNode
  onRowClick?: (row: Row<TData>) => void
  virtualize?: boolean
  height?: number
  skeletonRows?: number
  caption?: string
  className?: string
  /**
   * On tablet and desktop, size the table to the remaining viewport so its header
   * stays visible while rows scroll. Phones keep normal page scrolling.
   */
  fitViewport?: boolean
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const tableElement = useRef<HTMLTableElement>(null)
  const offsets = usePinnedOffsets(table, tableElement)
  const fitHeight = useViewportFit(scroller, fitViewport && !virtualize)
  const rows = table.getRowModel().rows
  const resizable = table.options.enableColumnResizing === true
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scroller.current,
    estimateSize: () => 41,
    overscan: 12,
    enabled: virtualize,
    // Avoid synchronous re-render during the first measurement (React 19 warning).
    useFlushSync: false,
  })
  const items = virtualize ? virtualizer.getVirtualItems() : []
  const visible = virtualize ? items.map((item) => rows[item.index]!) : rows
  const padStart = virtualize ? (items[0]?.start ?? 0) : 0
  const padEnd = virtualize
    ? virtualizer.getTotalSize() - (items[items.length - 1]?.end ?? 0)
    : 0
  const columns = table.getVisibleLeafColumns().length
  return (
    <div
      data-slot="data-table"
      aria-busy={loading || fetching}
      className={cn(
        'relative overflow-hidden rounded-lg border bg-card',
        className,
      )}
    >
      {/* Mounted only while refetching so no animation runs when idle. */}
      {fetching && !loading && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-30 h-0.5 animate-in overflow-clip delay-150 duration-300 fill-mode-backwards fade-in-0 [contain:strict]"
        >
          <div className="h-full w-1/3 animate-progress bg-primary" />
        </div>
      )}
      <div
        ref={scroller}
        // Contain only horizontal overscroll (no browser back-swipe). Vertical
        // containment would trap the wheel whenever rows fit, so the page could
        // not scroll while the pointer is over the table.
        className="relative w-full overflow-auto overscroll-x-contain"
        style={
          virtualize
            ? { height }
            : fitHeight
              ? { maxHeight: fitHeight }
              : undefined
        }
      >
        <table
          ref={tableElement}
          className={cn(
            'w-full caption-bottom border-separate border-spacing-0 text-sm',
            resizable && 'table-fixed',
          )}
          style={
            resizable
              ? { width: table.getTotalSize(), minWidth: '100%' }
              : undefined
          }
        >
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="sticky top-0 z-20">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    scope="col"
                    data-column={header.column.id}
                    style={cellStyle(header.column, resizable, offsets)}
                    onClick={
                      header.column.id === 'select'
                        ? (event) => {
                            if (
                              !(event.target as HTMLElement).closest(
                                '[role=checkbox]',
                              )
                            )
                              table.toggleAllPageRowsSelected(
                                !table.getIsAllPageRowsSelected(),
                              )
                          }
                        : undefined
                    }
                    className={cn(
                      header.column.id === 'select' && 'cursor-pointer',
                      'h-11 border-b bg-muted px-3 text-start align-middle text-[0.8125rem] font-semibold whitespace-nowrap text-foreground first:ps-4 last:pe-4',
                      pinnedClass(header.column),
                      header.column.columnDef.meta?.className,
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    {resizable && header.column.getCanResize() && (
                      <Resizer header={header} />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody
            className={cn(
              'transition-opacity duration-200',
              fetching && !loading && 'opacity-60',
            )}
          >
            {loading ? (
              Array.from({ length: skeletonRows }, (_, index) => (
                <tr key={index}>
                  {table.getVisibleLeafColumns().map((column) => (
                    <td
                      key={column.id}
                      className="border-b px-3 py-(--row-space) first:ps-4 last:pe-4"
                    >
                      <Skeleton
                        className="h-4"
                        style={{
                          width: `${45 + ((index * 17 + column.getIndex() * 23) % 45)}%`,
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns} className="p-0">
                  {empty}
                </td>
              </tr>
            ) : (
              <>
                {padStart > 0 && (
                  <tr aria-hidden="true">
                    <td colSpan={columns} style={{ height: padStart }} />
                  </tr>
                )}
                {visible.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    onClick={
                      onRowClick
                        ? (event) => {
                            const target = event.target as HTMLElement
                            if (
                              target.closest(
                                'a,button,input,label,[role=checkbox],[role=menuitem],[data-row-action]',
                              )
                            )
                              return
                            onRowClick(row)
                          }
                        : undefined
                    }
                    className={cn(
                      'group/row transition-colors hover:bg-muted/50 data-[state=selected]:bg-primary/[0.06]',
                      onRowClick && 'cursor-pointer',
                      row.getIsGrouped() && 'bg-muted/30 font-medium',
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={cellStyle(cell.column, resizable, offsets)}
                        // The whole selection cell is the hit area; it never opens the row.
                        {...(cell.column.id === 'select'
                          ? {
                              'data-row-action': true,
                              onClick: (event: React.MouseEvent) => {
                                if (
                                  row.getCanSelect() &&
                                  !(event.target as HTMLElement).closest(
                                    '[role=checkbox]',
                                  )
                                )
                                  row.toggleSelected()
                              },
                            }
                          : {})}
                        className={cn(
                          // Cells stay on one line (dates, amounts, statuses); the table
                          // scrolls sideways instead. Opt a column into wrapping with
                          // `meta.className: 'whitespace-normal'`.
                          'border-b px-3 py-(--row-space) align-middle whitespace-nowrap first:ps-4 last:pe-4 group-last/row:border-b-0',
                          cell.column.id === 'select' && 'cursor-pointer',
                          resizable && 'truncate',
                          pinnedClass(cell.column, true),
                          cell.column.columnDef.meta?.className,
                        )}
                      >
                        <CellContent cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
                {padEnd > 0 && (
                  <tr aria-hidden="true">
                    <td colSpan={columns} style={{ height: padEnd }} />
                  </tr>
                )}
              </>
            )}
          </tbody>
          {!loading &&
            rows.length > 0 &&
            table
              .getVisibleLeafColumns()
              .some((column) => column.columnDef.footer) && (
              <tfoot>
                {table
                  .getFooterGroups()
                  .slice(0, 1)
                  .map((group) => (
                    <tr key={group.id}>
                      {group.headers.map((header) => (
                        <td
                          key={header.id}
                          style={cellStyle(header.column, resizable, offsets)}
                          className={cn(
                            'border-t bg-muted/60 px-3 py-(--row-space) font-semibold first:ps-4 last:pe-4',
                            pinnedClass(header.column),
                            header.column.columnDef.meta?.className,
                          )}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.footer,
                                header.getContext(),
                              )}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tfoot>
            )}
        </table>
      </div>
    </div>
  )
}

function CellContent<TData>({ cell }: { cell: Cell<TData, unknown> }) {
  const { t } = useTranslation()
  const row = cell.row
  if (cell.getIsGrouped())
    return (
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2 h-7 gap-1 px-2"
        aria-expanded={row.getIsExpanded()}
        onClick={row.getToggleExpandedHandler()}
      >
        <ChevronRight
          aria-hidden="true"
          className={cn(
            'transition-transform rtl:rotate-180',
            row.getIsExpanded() && 'rotate-90 rtl:rotate-90',
          )}
        />
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
        <span className="font-normal text-muted-foreground tabular-nums">
          ({row.subRows.length})
        </span>
      </Button>
    )
  // TanStack marks every expandable row as aggregated; only grouping aggregates values.
  const grouping = cell.getContext().table.getState().grouping.length > 0
  if (grouping && cell.getIsAggregated())
    return flexRender(
      cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
      cell.getContext(),
    )
  if (cell.getIsPlaceholder()) return null
  const content = flexRender(cell.column.columnDef.cell, cell.getContext())
  // Tree rows: indent the first visible column and add an expander.
  if (
    !row.getIsGrouped() &&
    (row.depth > 0 || row.getCanExpand()) &&
    cell.column.getIndex() === firstDataColumn(row)
  )
    return (
      <span
        className="flex items-center gap-1"
        style={{ paddingInlineStart: `${row.depth * 1.25}rem` }}
      >
        {row.getCanExpand() ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            aria-label={t(row.getIsExpanded() ? 'collapseRow' : 'expandRow')}
            aria-expanded={row.getIsExpanded()}
            onClick={row.getToggleExpandedHandler()}
          >
            <ChevronRight
              className={cn(
                'transition-transform rtl:rotate-180',
                row.getIsExpanded() && 'rotate-90 rtl:rotate-90',
              )}
            />
          </Button>
        ) : (
          <span className="inline-block size-6" />
        )}
        {content}
      </span>
    )
  return content
}

function firstDataColumn<TData>(row: Row<TData>) {
  const cell = row.getVisibleCells().find((item) => item.column.id !== 'select')
  return cell?.column.getIndex() ?? 0
}

function cellStyle<TData>(
  column: Column<TData, unknown>,
  sized: boolean,
  offsets: Record<string, number>,
): CSSProperties {
  const pinned = column.getIsPinned()
  return {
    ...(sized ? { width: column.getSize() } : {}),
    ...(pinned === 'left'
      ? { insetInlineStart: offsets[column.id] ?? column.getStart('left') }
      : pinned === 'right'
        ? { insetInlineEnd: offsets[column.id] ?? column.getAfter('right') }
        : {}),
  }
}

// Space kept below the table for pagination and page padding.
const FOOTER_SPACE = 88
/**
 * Max height so the table ends at the viewport bottom. Re-measured when the window
 * or content above it changes (for example when filter chips appear).
 */
function useViewportFit(
  element: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
) {
  const [height, setHeight] = useState<number | undefined>()
  useLayoutEffect(() => {
    const node = element.current
    if (!enabled || !node) return
    const measure = () => {
      if (window.innerWidth < 640) return setHeight(undefined)
      const top = node.getBoundingClientRect().top + window.scrollY
      const next = Math.max(
        320,
        Math.round(window.innerHeight - top - FOOTER_SPACE),
      )
      setHeight((current) => (current === next ? current : next))
    }
    measure()
    const main = node.closest('main') ?? document.body
    let frame = 0
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(main)
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', schedule)
    }
  }, [element, enabled])
  return enabled ? height : undefined
}

/**
 * Sticky offsets from rendered header widths. TanStack's getStart() uses declared
 * sizes, which only match the layout for fixed-width (resizable) tables; content-sized
 * tables need measurement once more than one column is pinned on a side.
 */
function usePinnedOffsets<TData>(
  table: TanstackTable<TData>,
  element: React.RefObject<HTMLTableElement | null>,
) {
  const [offsets, setOffsets] = useState<Record<string, number>>({})
  const left = table.getLeftVisibleLeafColumns().map((column) => column.id)
  const right = table.getRightVisibleLeafColumns().map((column) => column.id)
  const key = `${left.join(',')}|${right.join(',')}`
  useLayoutEffect(() => {
    const node = element.current
    if (!node || key === '|') return
    const [start = [], end = []] = key
      .split('|')
      .map((ids) => ids.split(',').filter(Boolean))
    const measure = () => {
      const width = (id: string) =>
        node
          .querySelector<HTMLElement>(
            `thead th[data-column="${CSS.escape(id)}"]`,
          )
          ?.getBoundingClientRect().width ?? 0
      const next: Record<string, number> = {}
      let offset = 0
      for (const id of start) {
        next[id] = offset
        offset += width(id)
      }
      offset = 0
      for (const id of [...end].reverse()) {
        next[id] = offset
        offset += width(id)
      }
      setOffsets((current) =>
        Object.keys(next).every((id) => current[id] === next[id]) &&
        Object.keys(current).length === Object.keys(next).length
          ? current
          : next,
      )
    }
    measure()
    // Defer to the next frame so state updates never re-enter the observer loop.
    let frame = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    })
    observer.observe(node)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [element, key])
  return offsets
}

function pinnedClass<TData>(column: Column<TData, unknown>, body = false) {
  const pinned = column.getIsPinned()
  if (!pinned) return undefined
  return cn(
    'sticky z-10',
    body &&
      'bg-card group-hover/row:bg-muted group-data-[state=selected]/row:bg-[color-mix(in_oklab,var(--primary)_6%,var(--card))]',
    pinned === 'left' &&
      column.getIsLastColumn('left') &&
      'shadow-[inset_-1px_0_0_var(--border)] rtl:shadow-[inset_1px_0_0_var(--border)]',
    pinned === 'right' &&
      column.getIsFirstColumn('right') &&
      'shadow-[inset_1px_0_0_var(--border)] rtl:shadow-[inset_-1px_0_0_var(--border)]',
  )
}

function Resizer<TData>({ header }: { header: Header<TData, unknown> }) {
  const { t } = useTranslation()
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={t('resizeColumn')}
      onDoubleClick={() => header.column.resetSize()}
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      className={cn(
        'absolute end-0 top-0 h-full w-1.5 cursor-col-resize touch-none select-none hover:bg-primary/40',
        header.column.getIsResizing() && 'bg-primary',
      )}
    />
  )
}

/** Checkbox column for the current page with an indeterminate header state. */
export function selectionColumn<TData>(labels: { all: string; row: string }) {
  return {
    id: 'select',
    size: 40,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    enablePinning: false,
    header: ({ table }: { table: TanstackTable<TData> }) => (
      <Checkbox
        aria-label={labels.all}
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        // Nothing to select while rows are loading or locked.
        disabled={!table.getRowModel().rows.some((row) => row.getCanSelect())}
        className="translate-y-0.5"
      />
    ),
    cell: ({ row }: { row: Row<TData> }) => (
      <Checkbox
        aria-label={labels.row}
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        className="translate-y-0.5"
      />
    ),
  }
}
