import * as React from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'
import type { ComboboxOption } from './combobox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Spinner } from './spinner'

export interface RemoteSearchResult {
  options: ComboboxOption[]
  /** Every match on the server, so the list can say when it shows only some. */
  total: number
}

const DEBOUNCE_MS = 250

/**
 * Single-choice picker whose options come from the API with server-side search.
 * Use it for collections that grow with the business (projects, suppliers,
 * employees, accounts): it never loads the whole list, searches as the user
 * types, and resolves the label of the current value by id.
 *
 * Use `Select` for short fixed lists and `Combobox` for small client-side lists.
 * Pass `allOption` for filters where "nothing chosen" means "all".
 */
export function RemoteCombobox({
  id,
  value,
  onChange,
  queryKey,
  search,
  lookup,
  allOption,
  onCreate,
  createLabel,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled = false,
  invalid = false,
  className,
  'aria-label': ariaLabel,
}: {
  id?: string
  value: string | null
  onChange: (value: string | null, option: ComboboxOption | null) => void
  /** Base cache key for this collection, scoped to the workspace. */
  queryKey: readonly unknown[]
  /** Server search; return the first page of matches for `query` (may be empty). */
  search: (query: string, signal: AbortSignal) => Promise<RemoteSearchResult>
  /** Loads one option by value, for a selection that is not in the current results. */
  lookup: (value: string, signal: AbortSignal) => Promise<ComboboxOption | null>
  allOption?: { label: string }
  /**
   * Offers "Add <typed text>" when the search finds no exact match. The caller opens
   * its quick-create form and selects the new record when it is saved.
   */
  onCreate?: (text: string) => void
  /** Label of the create action, for example (text) => `Add "${text}"`. */
  createLabel?: (text: string) => string
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  invalid?: boolean
  className?: string
  'aria-label'?: string
}) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const [text, setText] = React.useState('')
  const [query, setQuery] = React.useState('')
  React.useEffect(() => {
    const timer = setTimeout(() => setQuery(text.trim()), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [text])
  const results = useQuery({
    queryKey: [...queryKey, 'search', query],
    queryFn: ({ signal }) => search(query, signal),
    enabled: open,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
  const inResults = results.data?.options.find((option) => option.value === value)
  const selected = useQuery({
    queryKey: [...queryKey, 'option', value],
    queryFn: ({ signal }) => lookup(value!, signal),
    enabled: Boolean(value) && !inResults,
    staleTime: 5 * 60_000,
  })
  const current = value ? (inResults ?? selected.data ?? null) : null
  const label = value
    ? (current?.label ?? (selected.isPending ? t('loading') : value))
    : (allOption?.label ?? placeholder ?? t('selectOption'))
  const options = results.data?.options ?? []
  const more = results.data ? results.data.total - options.length : 0
  const choose = (next: ComboboxOption | null) => {
    onChange(next?.value ?? null, next)
    setOpen(false)
    setText('')
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          aria-label={ariaLabel ? `${ariaLabel}: ${label}` : undefined}
          disabled={disabled}
          data-slot="combobox-trigger"
          className={cn(
            'w-full justify-between gap-2 bg-transparent px-3 font-normal shadow-xs hover:bg-muted/40 aria-invalid:border-destructive dark:bg-input/30',
            !value && !allOption && 'text-muted-foreground',
            className,
          )}
        >
          <span className="min-w-0 truncate">{label}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-80 p-0"
        align="start"
      >
        {/* The server filters; the command list only handles keyboard navigation. */}
        <Command shouldFilter={false}>
          <CommandInput
            value={text}
            onValueChange={setText}
            placeholder={searchPlaceholder ?? t('search')}
          />
          <CommandList aria-busy={results.isFetching}>
            {results.isPending ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Spinner />
                {t('loading')}
              </div>
            ) : results.isError ? (
              <div className="grid justify-items-center gap-2 py-5 text-sm">
                <p className="text-muted-foreground">{t('searchFailed')}</p>
                <Button size="sm" variant="outline" onClick={() => void results.refetch()}>
                  {t('retry')}
                </Button>
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyText ?? t('commandEmpty')}</CommandEmpty>
                <CommandGroup>
                  {allOption && !query && (
                    <CommandItem value="__all" onSelect={() => choose(null)} data-checked={!value}>
                      <span className="truncate">{allOption.label}</span>
                      <Check className={cn('ms-auto', value ? 'opacity-0' : 'opacity-100')} />
                    </CommandItem>
                  )}
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      onSelect={() => choose(option)}
                      data-checked={option.value === value}
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{option.label}</span>
                        {option.description && (
                          <span className="truncate text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        )}
                      </span>
                      <Check
                        className={cn('ms-auto', option.value === value ? 'opacity-100' : 'opacity-0')}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
                {onCreate && text.trim() && !options.some((option) => option.label.trim().toLowerCase() === text.trim().toLowerCase()) && (
                  <CommandGroup className="border-t">
                    <CommandItem
                      value="__create"
                      onSelect={() => {
                        const typed = text.trim()
                        setOpen(false)
                        setText('')
                        onCreate(typed)
                      }}
                    >
                      <Plus className="text-primary" />
                      <span className="truncate font-medium">{createLabel ? createLabel(text.trim()) : text.trim()}</span>
                    </CommandItem>
                  </CommandGroup>
                )}
                {more > 0 && (
                  <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                    {t('moreResults', { count: more })}
                  </p>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
