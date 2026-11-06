import type { Table } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <Settings2 aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">{t('view')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t('toggleColumns')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllLeafColumns()
          .filter((column) => column.getCanHide())
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(value)}
              onSelect={(event) => event.preventDefault()}
            >
              {column.columnDef.meta?.label ?? column.id}
            </DropdownMenuCheckboxItem>
          ))}
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
