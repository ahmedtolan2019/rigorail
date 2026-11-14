import type { Column, Table } from '@tanstack/react-table'

// Header text seen on screen, per table, so menus can name a column after it is hidden.
const seen = new WeakMap<object, Map<string, string>>()

/** Records the visible header texts; call after the table renders. */
export function rememberColumnLabels(table: Table<never> | Table<unknown>, root: HTMLElement | null) {
  if (!root) return
  const labels = seen.get(table) ?? new Map<string, string>()
  for (const cell of root.querySelectorAll<HTMLElement>('thead th[data-column]')) {
    const text = cell.textContent?.trim() ?? ''
    if (cell.dataset.column) labels.set(cell.dataset.column, text)
  }
  seen.set(table, labels)
}

/**
 * A column's name for menus: its label, a plain-text header, or the text last shown.
 * Never the raw key: an unnamed column (actions, selection) gives '' and a column
 * never seen gets its id turned into words (`dueOn` -> "Due on").
 */
export function columnLabel<TData>(table: Table<TData>, column: Column<TData, unknown>) {
  const header = column.columnDef.header
  if (column.columnDef.meta?.label) return column.columnDef.meta.label
  if (typeof header === 'string') return header.trim()
  if (header === undefined || ['select', 'actions'].includes(column.id)) return ''
  const seenText = seen.get(table)?.get(column.id)
  if (seenText !== undefined) return seenText
  const words = column.id.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim().toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}
