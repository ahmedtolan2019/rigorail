import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarDays, ChevronDown, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { fromIsoDate, toIsoDate } from '@/shared/lib/date-range'
import { Button } from './button'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

/**
 * Single-date field: a trigger button showing the localized date and a calendar
 * popover. Values are ISO calendar dates (`yyyy-mm-dd`), the same shape forms and
 * API contracts use, so it drops into react-hook-form through `Controller`.
 * Use it instead of `<input type="date">`; use `DateRangePicker` for ranges.
 */
export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  placeholder,
  disabled = false,
  clearable = false,
  invalid = false,
  className,
  triggerClassName,
  align = 'start',
  'aria-label': ariaLabel,
  'aria-describedby': describedBy,
}: {
  id?: string
  value: string | undefined | null
  onChange: (value: string | undefined) => void
  /** Earliest selectable ISO date. */
  min?: string
  /** Latest selectable ISO date. */
  max?: string
  placeholder?: string
  disabled?: boolean
  /** Classes for the trigger button, for example a borderless grid cell. */
  triggerClassName?: string
  /** Show a clear button when a value is set (optional fields). */
  clearable?: boolean
  invalid?: boolean
  className?: string
  align?: 'start' | 'end'
  /** Names the field when no visible label points at `id`; the date is appended. */
  'aria-label'?: string
  'aria-describedby'?: string
}) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const selected = fromIsoDate(value ?? undefined)
  const label = selected
    ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
        selected,
      )
    : (placeholder ?? t('pickDate'))
  const before = fromIsoDate(min)
  const after = fromIsoDate(max)
  const disabledDays = [
    ...(before ? [{ before }] : []),
    ...(after ? [{ after }] : []),
  ]
  return (
    <div className={cn('relative flex w-full items-center', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-label={ariaLabel ? `${ariaLabel}: ${label}` : undefined}
            aria-describedby={describedBy}
            aria-haspopup="dialog"
            className={cn(
              'h-9 w-full justify-start gap-2 bg-transparent px-3 font-normal hover:bg-muted/40 aria-invalid:border-destructive dark:bg-input/30',
              !selected && 'text-muted-foreground',
              clearable && selected && 'pe-16',
              triggerClassName,
            )}
          >
            <CalendarDays aria-hidden="true" />
            <span className="truncate">{label}</span>
            <ChevronDown aria-hidden="true" className="ms-auto opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align={align}
          collisionPadding={12}
          className="w-auto p-0"
        >
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={selected}
            defaultMonth={selected ?? after ?? new Date()}
            startMonth={new Date(2000, 0)}
            endMonth={new Date(new Date().getFullYear() + 5, 11)}
            disabled={disabledDays}
            onSelect={(date) => {
              if (!date) return
              onChange(toIsoDate(date))
              setOpen(false)
            }}
            autoFocus
          />
          <div className="flex items-center justify-between gap-2 border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(toIsoDate(new Date()))
                setOpen(false)
              }}
            >
              {t('today')}
            </Button>
            {clearable && selected && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange(undefined)
                  setOpen(false)
                }}
              >
                {t('clear')}
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {clearable && selected && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute end-8 size-7 text-muted-foreground"
          aria-label={t('clear')}
          onClick={() => onChange(undefined)}
        >
          <X />
        </Button>
      )}
    </div>
  )
}
