import * as React from 'react'
import { useTranslation } from 'react-i18next'
import type { DateRange } from 'react-day-picker'
import { CalendarDays, ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import { Button } from './button'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import {
  fromIsoDate,
  presetKeys,
  presetRanges,
  toIsoDate,
  type PresetId,
} from '@/shared/lib/date-range'

export { fromIsoDate, presetRanges, toIsoDate, type PresetId }

export interface DateRangePreset {
  id: string
  label: string
  range: () => { from: Date; to: Date }
}
export interface DateRangeValue {
  /** Inclusive local dates. */
  from?: Date
  to?: Date
  /** Selected preset id, or undefined for a custom range. */
  preset?: string
}

/** Translated presets; pass `ids` to offer a subset. */
export function standardPresets(
  t: (key: string) => string,
  ids: readonly PresetId[] = Object.keys(presetRanges) as PresetId[],
): DateRangePreset[] {
  return ids.map((id) => ({
    id,
    label: t(`common:${presetKeys[id]}`),
    range: presetRanges[id],
  }))
}

/**
 * Preset list plus a range calendar, applied explicitly so data does not reload on
 * every click. Two months on desktop, one on phones. Pass `allowClear` for filters.
 */
export function DateRangePicker({
  value,
  onChange,
  presets,
  placeholder,
  allowClear = false,
  className,
  align = 'start',
}: {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  presets: DateRangePreset[]
  placeholder?: string
  allowClear?: boolean
  className?: string
  align?: 'start' | 'end'
}) {
  const { t, i18n } = useTranslation()
  const mobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<DateRange | undefined>()
  const [draftPreset, setDraftPreset] = React.useState<string | undefined>()
  const format = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const preset = presets.find((item) => item.id === value.preset)
  const label = preset
    ? preset.label
    : value.from && value.to
      ? format.formatRange(value.from, value.to)
      : (placeholder ?? t('dateRange'))
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setDraft({ from: value.from, to: value.to })
          setDraftPreset(value.preset)
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 justify-start gap-2 font-normal',
            !value.from && !preset && 'text-muted-foreground',
            className,
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
        className="w-auto max-w-[calc(100vw-1.5rem)] p-0"
      >
        <div className="flex flex-col sm:flex-row">
          <ul
            className="flex w-0 min-w-full gap-1 overflow-x-auto border-b p-2 sm:w-40 sm:min-w-0 sm:flex-col sm:border-e sm:border-b-0"
            aria-label={t('presets')}
          >
            {presets.map((item) => (
              <li key={item.id} className="shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-pressed={draftPreset === item.id}
                  className="w-full justify-start font-normal aria-pressed:bg-accent aria-pressed:font-medium"
                  onClick={() => {
                    setDraft(item.range())
                    setDraftPreset(item.id)
                  }}
                >
                  {item.label}
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex flex-col">
            <Calendar
              mode="range"
              numberOfMonths={mobile ? 1 : 2}
              defaultMonth={
                draft?.from ??
                new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
              }
              selected={draft}
              onSelect={(range) => {
                setDraft(range)
                setDraftPreset(undefined)
              }}
              disabled={{ after: new Date() }}
            />
            <div className="flex items-center justify-end gap-2 border-t p-3">
              {allowClear && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="me-auto"
                  onClick={() => {
                    onChange({})
                    setOpen(false)
                  }}
                >
                  {t('clear')}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                {t('cancel')}
              </Button>
              <Button
                size="sm"
                disabled={!draft?.from}
                onClick={() => {
                  onChange({
                    from: draft?.from,
                    to: draft?.to ?? draft?.from,
                    preset: draftPreset,
                  })
                  setOpen(false)
                }}
              >
                {t('apply')}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
