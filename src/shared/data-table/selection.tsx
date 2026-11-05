import { useState } from 'react'
import type { OnChangeFn, RowSelectionState } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Button } from '@/shared/ui/button'

/**
 * Selection that survives server pagination. `ids` lists picked records; `all`
 * means every record matching the current filters except `excluded`, so bulk
 * commands can send the filter instead of thousands of ids.
 */
export type ServerSelection =
  { mode: 'ids'; ids: string[] } | { mode: 'all'; excluded: string[] }

const none: ServerSelection = { mode: 'ids', ids: [] }

export function useServerSelection({
  pageIds,
  total,
  scope,
}: {
  /** Ids of the rows on the current page, in order. */
  pageIds: readonly string[]
  /** Records matching the current filters on the server. */
  total: number
  /** Changes when filters change; selection resets so it never targets hidden records. */
  scope: string
}) {
  const [selection, setSelection] = useState<ServerSelection>(none)
  const [currentScope, setCurrentScope] = useState(scope)
  if (scope !== currentScope) {
    setCurrentScope(scope)
    setSelection(none)
  }
  const isSelected = (id: string) =>
    selection.mode === 'ids'
      ? selection.ids.includes(id)
      : !selection.excluded.includes(id)
  const rowSelection: RowSelectionState = Object.fromEntries(
    pageIds.filter(isSelected).map((id) => [id, true]),
  )
  const onRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
    const next = typeof updater === 'function' ? updater(rowSelection) : updater
    setSelection((current) => {
      const picked = pageIds.filter((id) => next[id])
      const dropped = pageIds.filter((id) => !next[id])
      if (current.mode === 'ids')
        return {
          mode: 'ids',
          ids: [
            ...current.ids.filter((id) => !dropped.includes(id)),
            ...picked.filter((id) => !current.ids.includes(id)),
          ],
        }
      return {
        mode: 'all',
        excluded: [
          ...current.excluded.filter((id) => !picked.includes(id)),
          ...dropped.filter((id) => !current.excluded.includes(id)),
        ],
      }
    })
  }
  const count =
    selection.mode === 'ids'
      ? selection.ids.length
      : Math.max(0, total - selection.excluded.length)
  return {
    selection,
    rowSelection,
    onRowSelectionChange,
    count,
    allMatching: selection.mode === 'all',
    pageFullySelected:
      pageIds.length > 0 && pageIds.every((id) => isSelected(id)),
    selectAllMatching: () => setSelection({ mode: 'all', excluded: [] }),
    clear: () => setSelection(none),
  }
}

/** Floating bar for bulk actions. Offers "select all matching" once a page is selected. */
export function DataTableSelectionBar({
  count,
  total,
  allMatching,
  pageFullySelected,
  onSelectAll,
  onClear,
  children,
}: {
  count: number
  total: number
  allMatching: boolean
  pageFullySelected: boolean
  onSelectAll: () => void
  onClear: () => void
  children?: React.ReactNode
}) {
  const { t } = useTranslation()
  if (count === 0) return null
  return (
    <div
      role="region"
      aria-label={t('bulkActions')}
      className="sticky bottom-4 z-30 mx-auto mt-4 flex w-fit max-w-full animate-in flex-wrap items-center gap-2 rounded-xl border bg-popover p-2 ps-4 text-sm shadow-lg duration-200 fade-in-0 slide-in-from-bottom-4"
    >
      <span className="font-medium tabular-nums" aria-live="polite">
        {allMatching
          ? t('allMatchingSelected', { count })
          : t('selectedCount', { count })}
      </span>
      {!allMatching && pageFullySelected && total > count && (
        <Button
          variant="link"
          size="sm"
          className="h-8 px-1"
          onClick={onSelectAll}
        >
          {t('selectAllMatching', { count: total })}
        </Button>
      )}
      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      {children}
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label={t('clearSelection')}
        onClick={onClear}
      >
        <X />
      </Button>
    </div>
  )
}
