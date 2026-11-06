import type { Column } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  EyeOff,
  Pin,
  PinOff,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'

/** Header with sort and hide actions. Falls back to plain text for fixed columns. */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: {
  column: Column<TData, TValue>
  title: string
  className?: string
}) {
  const { t } = useTranslation()
  if (!column.getCanSort() && !column.getCanHide() && !column.getCanPin())
    return <span className={className}>{title}</span>
  const pinned = column.getIsPinned()
  const sorted = column.getIsSorted()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            '-ms-2.5 h-8 gap-1.5 px-2.5 font-semibold data-[state=open]:bg-accent',
            className,
          )}
        >
          {pinned && (
            <Pin aria-hidden="true" className="size-3 text-muted-foreground" />
          )}
          {title}
          {pinned && <span className="sr-only">, {t('pinned')}</span>}
          {sorted && (
            <span className="sr-only">
              , {t(sorted === 'asc' ? 'sortedAscending' : 'sortedDescending')}
            </span>
          )}
          {sorted === 'desc' ? (
            <ArrowDown aria-hidden="true" />
          ) : sorted === 'asc' ? (
            <ArrowUp aria-hidden="true" />
          ) : (
            <ChevronsUpDown aria-hidden="true" className="opacity-50" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {column.getCanSort() && (
          <>
            <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
              <ArrowUp />
              {t('sortAscending')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
              <ArrowDown />
              {t('sortDescending')}
            </DropdownMenuItem>
          </>
        )}
        {column.getCanPin() && (
          <>
            {column.getCanSort() && <DropdownMenuSeparator />}
            {pinned !== 'left' && (
              <DropdownMenuItem onClick={() => column.pin('left')}>
                <Pin />
                {t('pinStart')}
              </DropdownMenuItem>
            )}
            {pinned !== 'right' && (
              <DropdownMenuItem onClick={() => column.pin('right')}>
                <Pin className="-scale-x-100" />
                {t('pinEnd')}
              </DropdownMenuItem>
            )}
            {pinned && (
              <DropdownMenuItem onClick={() => column.pin(false)}>
                <PinOff />
                {t('unpin')}
              </DropdownMenuItem>
            )}
          </>
        )}
        {(column.getCanSort() || column.getCanPin()) && column.getCanHide() && (
          <DropdownMenuSeparator />
        )}
        {column.getCanHide() && (
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOff />
            {t('hideColumn')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
