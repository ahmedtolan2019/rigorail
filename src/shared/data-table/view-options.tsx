import type { Table } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { usePreferences } from '@/shared/preferences/store'
import { columnLabel } from './column-labels'
import { RotateCcw, Settings2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'

/** Column visibility menu. Columns declare `meta.label` for a translated name. */
export function DataTableViewOptions<TData>({
  table,
}: {
  table: Table<TData>
}) {
  const { t } = useTranslation()
  const pinned = usePreferences((state) => state.value.tableHeader === 'pinned')
  const pinnedPages = usePreferences((state) => state.value.tablePagination === 'pinned')
  const hidden = table.getAllLeafColumns().filter((column) => column.getCanHide() && !column.getIsVisible()).length
  const setPreferences = usePreferences((state) => state.set)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-1.5 px-3">
          <Settings2 aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">{t('view')}</span>
          {/* Hidden columns are easy to forget: the button says how many. */}
          {hidden > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[0.6875rem] font-semibold text-primary-foreground tabular-nums">
              {hidden}
              <span className="sr-only"> {t('hiddenColumns', { count: hidden })}</span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>{t('toggleColumns')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ColumnItems table={table} />
        <DropdownMenuSeparator />
        {/* A personal preference: every table follows it. */}
        <DropdownMenuCheckboxItem
          checked={pinned}
          onCheckedChange={(value) => setPreferences({ tableHeader: value ? 'pinned' : 'scroll' })}
          onSelect={(event) => event.preventDefault()}
        >
          {t('pinHeader')}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={pinnedPages}
          onCheckedChange={(value) => setPreferences({ tablePagination: value ? 'pinned' : 'scroll' })}
          onSelect={(event) => event.preventDefault()}
        >
          {t('pinPagination')}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {/* Restores the table's initial visibility, pinning and sizing. */}
        <DropdownMenuItem
          onClick={() => {
            table.resetColumnVisibility()
            table.resetColumnPinning()
            table.resetColumnSizing()
          }}
        >
          <RotateCcw />
          {t('resetColumns')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * The column toggles. A component of its own so it renders when the menu opens,
 * after the table has shown its header text (the names of columns without a label).
 */
function ColumnItems<TData>({ table }: { table: Table<TData> }) {
  return table
    .getAllLeafColumns()
    // Columns without a name (row actions, selection) are not worth a menu line.
    .map((column) => ({ column, label: columnLabel(table, column) }))
    .filter(({ column, label }) => column.getCanHide() && label !== '')
    .map(({ column, label }) => (
      <DropdownMenuCheckboxItem
        key={column.id}
        checked={column.getIsVisible()}
        onCheckedChange={(value) => column.toggleVisibility(value)}
        onSelect={(event) => event.preventDefault()}
      >
        {label}
      </DropdownMenuCheckboxItem>
    ))
}
