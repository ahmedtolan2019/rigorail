import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Check, ListFilter, Search, X } from 'lucide-react'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  DateRangePicker,
  type DateRangePreset,
  type DateRangeValue,
} from '@/shared/ui/date-range-picker'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/shared/ui/drawer'
import { Input } from '@/shared/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Spinner } from '@/shared/ui/spinner'

export interface FilterOption {
  value: string
  label: string
  icon?: ComponentType<{ className?: string }>
  /** Matching records with every other filter applied, supplied by the server. */
  count?: number
}
export type FilterDefinition =
  | {
      id: string
      label: string
      type: 'options'
      /** All options, or the top options (for example by count) of a long list. */
      options: readonly FilterOption[]
      value: readonly string[]
      onChange: (value: string[]) => void
      /** Distinct values on the server when `options` is only the top of a long list. */
      total?: number
      /** Server search for long or unbounded lists such as people or customers. */
      search?: (query: string, signal: AbortSignal) => Promise<FilterOption[]>
    }
  | {
      id: string
      label: string
      type: 'date'
      presets: DateRangePreset[]
      value: DateRangeValue
      onChange: (value: DateRangeValue) => void
    }

const isActive = (filter: FilterDefinition) =>
  filter.type === 'options'
    ? filter.value.length > 0
    : Boolean(filter.value.from)

/**
 * One "Filters" button holding every filter (popover on desktop, drawer on phones)
 * so the toolbar never wraps, however many filters a screen has.
 */
export function DataTableFilters({
  filters,
  onClearAll,
}: {
  filters: FilterDefinition[]
  onClearAll: () => void
}) {
  const { t } = useTranslation()
  const mobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const active = filters.filter(isActive).length
  const trigger = (
    <Button
      variant="outline"
      size="sm"
      className="h-9 gap-1.5"
      onClick={mobile ? () => setOpen(true) : undefined}
      aria-label={active ? `${t('filters')} (${active})` : t('filters')}
    >
      <ListFilter aria-hidden="true" />
      <span className="hidden sm:inline">{t('filters')}</span>
      {active > 0 && (
        <Badge className="h-5 min-w-5 rounded-full px-1.5 tabular-nums">
          {active}
        </Badge>
      )}
    </Button>
  )
  const body = (
    <div className="grid gap-5">
      {filters.map((filter) => (
        <FilterSection key={filter.id} filter={filter} />
      ))}
    </div>
  )
  const clear = (
    <Button variant="ghost" size="sm" disabled={!active} onClick={onClearAll}>
      {t('clearFilters')}
    </Button>
  )
  if (mobile)
    return (
      <>
        {trigger}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t('filters')}</DrawerTitle>
              <DrawerDescription className="sr-only">
                {t('filters')}
              </DrawerDescription>
            </DrawerHeader>
            <div className="max-h-[60vh] overflow-y-auto px-4">{body}</div>
            <DrawerFooter className="flex-row justify-between">
              {clear}
              <Button onClick={() => setOpen(false)}>{t('done')}</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </>
    )
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      {/* Body scrolls within the space Radix reports; actions stay visible. */}
      <PopoverContent
        align="start"
        collisionPadding={12}
        className="flex max-h-[min(36rem,var(--radix-popover-content-available-height))] w-80 flex-col p-0"
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{body}</div>
        <div className="flex items-center justify-between border-t px-3 py-2">
          {clear}
          <Button size="sm" onClick={() => setOpen(false)}>
            {t('done')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function FilterSection({ filter }: { filter: FilterDefinition }) {
  const { t } = useTranslation()
  return (
    <section className="grid gap-2" aria-label={filter.label}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {filter.label}
        </h3>
        {isActive(filter) && (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() =>
              filter.type === 'options'
                ? filter.onChange([])
                : filter.onChange({})
            }
          >
            {t('clear')}
          </button>
        )}
      </div>
      {filter.type === 'date' ? (
        <DateRangePicker
          value={filter.value}
          onChange={filter.onChange}
          presets={filter.presets}
          placeholder={t('anyTime')}
          allowClear
          className="w-full"
        />
      ) : (
        <OptionsFilter filter={filter} />
      )}
    </section>
  )
}

type OptionsDefinition = Extract<FilterDefinition, { type: 'options' }>
const VISIBLE = 8
// Remembers labels of values seen in options or search results, so chips and pinned
// selections never fall back to raw identifiers while the list refetches.
const labels = new Map<string, FilterOption>()
const remember = (
  filter: OptionsDefinition,
  options: readonly FilterOption[],
) => {
  for (const option of options)
    labels.set(`${filter.id}:${option.value}`, option)
}
const known = (filter: OptionsDefinition, value: string) =>
  filter.options.find((option) => option.value === value) ??
  labels.get(`${filter.id}:${value}`) ?? { value, label: value }

/**
 * Checkbox list that scales: short lists filter locally and expand on demand; long
 * lists (`search`) show the top options and query the server as the user types.
 * Selected values always stay on top.
 */
function OptionsFilter({ filter }: { filter: OptionsDefinition }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [expanded, setExpanded] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 250)
    return () => clearTimeout(timer)
  }, [query])
  remember(filter, filter.options)
  const remote = useQuery({
    queryKey: ['filter-options', filter.id, debounced],
    queryFn: ({ signal }) => filter.search!(debounced, signal),
    enabled: Boolean(filter.search && debounced),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
  if (remote.data) remember(filter, remote.data)
  const searching = Boolean(filter.search && debounced)
  const matches = (option: FilterOption) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase())
  const pool = searching ? (remote.data ?? []) : filter.options.filter(matches)
  const selected = filter.value
    .map((value) => known(filter, value))
    .filter(matches)
  const rest = pool.filter((option) => !filter.value.includes(option.value))
  const capped =
    !searching && !query && !expanded ? rest.slice(0, VISIBLE) : rest
  const total = filter.total ?? filter.options.length
  const toggle = (value: string) =>
    filter.onChange(
      filter.value.includes(value)
        ? filter.value.filter((item) => item !== value)
        : [...filter.value, value],
    )
  return (
    <>
      {(filter.search || filter.options.length > VISIBLE) && (
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              filter.total
                ? t('searchOf', { count: filter.total })
                : t('search')
            }
            aria-label={`${t('search')} ${filter.label}`}
            className="h-8 ps-8 pe-8 text-sm [&::-webkit-search-cancel-button]:hidden"
          />
          {remote.isFetching && (
            <Spinner className="absolute end-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          )}
        </div>
      )}
      <ul className={cn('grid gap-0.5', remote.isFetching && 'opacity-70')}>
        {[...selected, ...capped].map((option) => (
          <OptionRow
            key={option.value}
            option={option}
            checked={filter.value.includes(option.value)}
            onToggle={() => toggle(option.value)}
          />
        ))}
      </ul>
      {selected.length + capped.length === 0 && !remote.isFetching && (
        <p className="px-2 py-1 text-sm text-muted-foreground">
          {t('commandEmpty')}
        </p>
      )}
      {!searching && !query && rest.length > VISIBLE && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="justify-self-start rounded-sm px-2 text-xs font-medium text-primary hover:underline"
        >
          {t('showAll', { count: rest.length })}
        </button>
      )}
      {filter.search && !query && total > filter.options.length && (
        <p className="px-2 text-xs text-muted-foreground">
          {t('showingTop', { shown: filter.options.length, total })}
        </p>
      )}
    </>
  )
}

function OptionRow({
  option,
  checked,
  onToggle,
}: {
  option: FilterOption
  checked: boolean
  onToggle: () => void
}) {
  const Icon = option.icon
  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-start text-sm transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span
          className={cn(
            'grid size-4 shrink-0 place-items-center rounded-[4px] border border-input transition-colors',
            checked && 'border-primary bg-primary text-primary-foreground',
          )}
        >
          <Check className={cn('size-3', !checked && 'invisible')} />
        </span>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        <span className="truncate">{option.label}</span>
        {option.count !== undefined && (
          <span className="ms-auto text-xs text-muted-foreground tabular-nums">
            {option.count}
          </span>
        )}
      </button>
    </li>
  )
}

/**
 * Active filters as removable chips on one line. Overflow scrolls horizontally
 * with faded edges instead of wrapping; "Clear all" stays pinned at the end.
 */
export function ActiveFilters({
  filters,
  onClearAll,
  extra,
}: {
  filters: FilterDefinition[]
  onClearAll: () => void
  /** Chips for state outside the filter panel, such as the search term. */
  extra?: { id: string; label: ReactNode; onRemove: () => void }[]
}) {
  const { t, i18n } = useTranslation()
  const format = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
  })
  const chips = [
    ...(extra ?? []),
    ...filters.filter(isActive).map((filter) => ({
      id: filter.id,
      label: (
        <>
          <span className="text-muted-foreground">{filter.label}:</span>{' '}
          {filter.type === 'date'
            ? (filter.presets.find(
                (preset) => preset.id === filter.value.preset,
              )?.label ??
              (filter.value.from && filter.value.to
                ? format.formatRange(filter.value.from, filter.value.to)
                : ''))
            : filter.value.length > 2
              ? t('selectedCount', { count: filter.value.length })
              : filter.value
                  .map((value) => known(filter, value).label)
                  .join(', ')}
        </>
      ),
      onRemove: () =>
        filter.type === 'options' ? filter.onChange([]) : filter.onChange({}),
    })),
  ]
  if (!chips.length) return null
  return (
    <div className="flex min-w-0 items-center gap-2">
      <ul
        aria-label={t('filtersApplied')}
        className="flex min-w-0 flex-1 animate-in items-center gap-1.5 overflow-x-auto duration-200 fade-in-0 [scrollbar-width:none] [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-24px),transparent)] rtl:[mask-image:linear-gradient(to_left,transparent,black_12px,black_calc(100%-24px),transparent)] [&::-webkit-scrollbar]:hidden"
      >
        {chips.map((chip) => (
          <li key={chip.id} className="shrink-0 first:ps-0.5">
            <span className="inline-flex h-7 items-center gap-1 rounded-full border bg-card ps-2.5 pe-1 text-xs whitespace-nowrap shadow-xs">
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={t('remove')}
                className="grid size-5 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </span>
          </li>
        ))}
      </ul>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 shrink-0 px-2 text-xs"
        onClick={onClearAll}
      >
        {t('clearAll')}
      </Button>
    </div>
  )
}
