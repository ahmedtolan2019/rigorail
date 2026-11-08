import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Badge } from './badge'
import { Button } from './button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

export interface ComboboxOption {
  value: string
  label: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

type Props = {
  options: readonly ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  id?: string
  'aria-invalid'?: boolean
  /** Name when no visible <label htmlFor={id}> exists. */
  'aria-label'?: string
} & (
  | {
      multiple?: false
      value: string | null
      onChange: (value: string | null) => void
    }
  | {
      multiple: true
      value: readonly string[]
      onChange: (value: string[]) => void
    }
)

/**
 * Searchable select built from Popover and Command (the shadcn Radix pattern).
 * Use Select for short fixed lists and Combobox when users need to search.
 */
function Combobox(props: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const selected = new Set(
    props.multiple ? props.value : props.value ? [props.value] : [],
  )
  const chosen = props.options.filter((option) => selected.has(option.value))
  const toggle = (value: string) => {
    if (props.multiple) {
      const next = new Set(selected)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      props.onChange(
        props.options
          .map((option) => option.value)
          .filter((item) => next.has(item)),
      )
    } else {
      props.onChange(selected.has(value) ? null : value)
      setOpen(false)
    }
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={props.id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={props['aria-invalid']}
          aria-label={props['aria-label']}
          disabled={props.disabled}
          data-slot="combobox-trigger"
          className={cn(
            'h-auto min-h-9 w-full justify-between gap-2 bg-transparent px-3 py-1.5 font-normal shadow-xs hover:bg-muted/40 aria-invalid:border-destructive dark:bg-input/30',
            props.className,
          )}
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-start">
            {chosen.length === 0 ? (
              <span className="text-muted-foreground">
                {props.placeholder ?? t('selectOption')}
              </span>
            ) : props.multiple ? (
              chosen.map((option) => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="gap-1 rounded-sm pe-0.5 font-normal"
                >
                  {option.label}
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label={`${t('remove')} ${option.label}`}
                    className="rounded-sm p-0.5 hover:bg-foreground/10"
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                      event.stopPropagation()
                      toggle(option.value)
                    }}
                  >
                    <X className="size-3" />
                  </span>
                </Badge>
              ))
            ) : (
              <span className="flex min-w-0 items-center gap-2">
                {chosen[0]!.icon &&
                  React.createElement(chosen[0]!.icon, {
                    className: 'size-4 shrink-0 text-muted-foreground',
                  })}
                <span className="truncate" title={chosen[0]!.label}>{chosen[0]!.label}</span>
              </span>
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-56 p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={props.searchPlaceholder ?? t('search')} />
          <CommandList>
            <CommandEmpty>{props.emptyText ?? t('commandEmpty')}</CommandEmpty>
            <CommandGroup>
              {props.options.map((option) => {
                const active = selected.has(option.value)
                const Icon = option.icon
                return (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.description ?? ''}`}
                    disabled={option.disabled}
                    onSelect={() => toggle(option.value)}
                    data-checked={active}
                  >
                    {Icon && <Icon className="text-muted-foreground" />}
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{option.label}</span>
                      {option.description && (
                        <span className="truncate text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </span>
                    <Check
                      className={cn(
                        'ms-auto',
                        active ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox }
