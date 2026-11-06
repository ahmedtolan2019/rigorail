import { useTranslation } from 'react-i18next'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'

/** Server-pagination footer: range summary, rows-per-page and page navigation. */
export function DataTablePagination({
  page,
  pageSize,
  total,
  pageSizes = [10, 20, 50],
  disabled = false,
  summary,
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
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}) {
  const { t } = useTranslation()
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
    <div className="flex flex-col-reverse gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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
