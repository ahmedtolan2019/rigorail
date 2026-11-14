import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { usePreferences } from '@/shared/preferences/store'
import { Button } from '@/shared/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'

/**
 * Server-pagination footer: range summary, rows-per-page and page navigation. It
 * carries its own top margin so it never touches the table above it.
 */
export function DataTablePagination({
  page,
  pageSize,
  total,
  pageSizes = [10, 20, 50],
  disabled = false,
  summary,
  className,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  pageSize: number
  total: number
  pageSizes?: readonly number[]
  disabled?: boolean
  /** Optional text shown before the range, such as a selection count. */
  summary?: string
  className?: string
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}) {
  const { t } = useTranslation()
  const pinned = usePreferences((state) => state.value.tablePagination === 'pinned')
  const bar = useStuck<HTMLDivElement>(pinned)
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const nav = (
    label: string,
    target: number,
    icon: React.ReactNode,
    wide = false,
  ) => (
    <Button
      variant="outline"
      size="icon"
      className={wide ? 'hidden size-8 lg:inline-flex' : 'size-8'}
      aria-label={label}
      disabled={disabled || target < 1 || target > pages || target === page}
      onClick={() => onPageChange(target)}
    >
      <span className="rtl:rotate-180">{icon}</span>
    </Button>
  )
  return (
    <div
      ref={bar}
      className={cn(
        'mt-4 flex flex-col-reverse gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between',
        // Pinned: rides the bottom of the screen while its own table runs past it,
        // then settles under the table; an edge shows while it floats.
        pinned &&
          // Spacing stays constant so the bar never changes height as it pins.
          '-mx-(--page-space) px-(--page-space) py-3 data-[pinned]:sticky data-[pinned]:bottom-0 data-[pinned]:z-20 data-[pinned]:bg-background/95 data-[pinned]:backdrop-blur-sm data-[pinned]:shadow-[0_-1px_0_var(--border),0_-8px_16px_-12px_rgb(0_0_0/0.3)]',
        className,
      )}
    >
      <p className="tabular-nums">
        {summary ? `${summary} · ` : ''}
        {t('rangeOf', { from, to, total })}
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span id="rows-per-page" className="whitespace-nowrap">
              {t('rowsPerPage')}
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
              disabled={disabled}
            >
              <SelectTrigger
                size="sm"
                className="h-8 w-[4.5rem]"
                aria-labelledby="rows-per-page"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizes.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <span className="whitespace-nowrap text-foreground tabular-nums">
          {t('page', { page, pages })}
        </span>
        <div className="flex items-center gap-1">
          {nav(t('firstPage'), 1, <ChevronsLeft />, true)}
          {nav(t('previous'), page - 1, <ChevronLeft />)}
          {nav(t('next'), page + 1, <ChevronRight />)}
          {nav(t('lastPage'), pages, <ChevronsRight />, true)}
        </div>
      </div>
    </div>
  )
}

/**
 * Pins the bar (`data-pinned`) only while its own table still runs below the screen,
 * so a page with several tables never has one table's pagination covering another.
 */
function useStuck<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const node = ref.current
    if (!enabled || !node) return
    const table = ownTable(node)
    if (!table) return
    let frame = 0
    const check = () => {
      frame = 0
      const box = table.getBoundingClientRect()
      const runsPast = box.top < window.innerHeight && box.bottom > window.innerHeight - node.offsetHeight
      if (runsPast) node.dataset.pinned = ''
      else delete node.dataset.pinned
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check)
    }
    check()
    document.addEventListener('scroll', schedule, { capture: true, passive: true })
    window.addEventListener('resize', schedule)
    const observer = new ResizeObserver(schedule)
    observer.observe(table)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('scroll', schedule, { capture: true })
      window.removeEventListener('resize', schedule)
      observer.disconnect()
      delete node.dataset.pinned
    }
  }, [enabled])
  return ref
}

/** The data table this bar pages: the nearest one before it in the page. */
function ownTable(node: HTMLElement) {
  let current: Element | null = node
  for (let depth = 0; current && depth < 4; depth++, current = current.parentElement) {
    for (let sibling = current.previousElementSibling; sibling; sibling = sibling.previousElementSibling) {
      const table = sibling.matches('[data-slot=data-table]') ? sibling : sibling.querySelector('[data-slot=data-table]')
      if (table) return table as HTMLElement
    }
  }
  return null
}
