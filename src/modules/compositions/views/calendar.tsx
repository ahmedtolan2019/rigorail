import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { ns } from '../messages'

type Kind = 'deadline' | 'meeting' | 'payment'
interface Entry {
  /** Days from today. */
  offset: number
  time?: string
  title: string
  kind: Kind
}
const entries: Entry[] = [
  { offset: 0, time: '10:00', title: 'Budget review', kind: 'meeting' },
  { offset: 0, title: 'REQ-1212 approval due', kind: 'deadline' },
  {
    offset: 0,
    time: '15:30',
    title: 'Supplier call: Northwind',
    kind: 'meeting',
  },
  { offset: 1, title: 'Invoice INV-3301 payment', kind: 'payment' },
  { offset: 3, time: '09:00', title: 'Quarterly planning', kind: 'meeting' },
  { offset: 3, title: 'REQ-1198 approval due', kind: 'deadline' },
  { offset: 6, title: 'Payroll run', kind: 'payment' },
  { offset: -2, time: '11:00', title: 'Vendor onboarding', kind: 'meeting' },
  { offset: -5, title: 'Invoice INV-3287 payment', kind: 'payment' },
  { offset: 9, title: 'Contract renewal deadline', kind: 'deadline' },
  { offset: 12, time: '14:00', title: 'Audit walkthrough', kind: 'meeting' },
  { offset: 12, title: 'Tax filing', kind: 'deadline' },
  { offset: 12, title: 'Rent payment', kind: 'payment' },
  { offset: 12, time: '16:00', title: 'Team retrospective', kind: 'meeting' },
]
const tone: Record<Kind, { pill: string; dot: string }> = {
  deadline: {
    pill: 'bg-destructive/10 text-destructive',
    dot: 'bg-destructive',
  },
  meeting: { pill: 'bg-info/12 text-info', dot: 'bg-info' },
  payment: { pill: 'bg-success/12 text-success', dot: 'bg-success' },
}
const kindLabel = {
  deadline: 'kindDeadline',
  meeting: 'kindMeeting',
  payment: 'kindPayment',
} as const
const PILLS = 2

const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate())
const key = (value: Date) =>
  `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`

export default function CalendarView() {
  const { t, i18n } = useTranslation(ns)
  const today = useMemo(() => startOfDay(new Date()), [])
  const [month, setMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selected, setSelected] = useState(today)
  // Locale-aware first day of week; Arabic calendars commonly start on Saturday.
  const weekStart = i18n.language === 'ar' ? 6 : 0
  const byDay = useMemo(() => {
    const map = new Map<string, Entry[]>()
    for (const entry of entries) {
      const day = new Date(today)
      day.setDate(day.getDate() + entry.offset)
      const list = map.get(key(day)) ?? []
      list.push(entry)
      map.set(key(day), list)
    }
    return map
  }, [today])
  const cells = useMemo(() => {
    const first = new Date(month)
    first.setDate(1 - ((month.getDay() - weekStart + 7) % 7))
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(first)
      day.setDate(first.getDate() + index)
      return day
    })
  }, [month, weekStart])
  const weekdays = cells.slice(0, 7).map((day) => ({
    short: new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(
      day,
    ),
    long: new Intl.DateTimeFormat(i18n.language, { weekday: 'long' }).format(
      day,
    ),
  }))
  const shift = (delta: number) =>
    setMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + delta, 1),
    )
  const agenda = byDay.get(key(selected)) ?? []

  return (
    <div className="grid gap-3 lg:gap-4 2xl:grid-cols-[minmax(0,1fr)_18rem]">
      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex items-center gap-2 border-b px-4 py-2.5">
          <h3 className="text-sm font-semibold" aria-live="polite">
            {new Intl.DateTimeFormat(i18n.language, {
              month: 'long',
              year: 'numeric',
            }).format(month)}
          </h3>
          <div className="ms-auto flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setMonth(new Date(today.getFullYear(), today.getMonth(), 1))
                setSelected(today)
              }}
            >
              {t('today')}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={() => shift(-1)}
              aria-label={t('prevMonth')}
            >
              <ChevronLeft className="rtl:-scale-x-100" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={() => shift(1)}
              aria-label={t('nextMonth')}
            >
              <ChevronRight className="rtl:-scale-x-100" />
            </Button>
          </div>
        </div>
        <div
          role="grid"
          aria-label={t('calendar')}
          className="grid grid-cols-7"
        >
          <div role="row" className="contents">
            {weekdays.map((day) => (
              <div
                key={day.long}
                role="columnheader"
                aria-label={day.long}
                className="border-b py-1.5 text-center text-xs font-medium text-muted-foreground"
              >
                {day.short}
              </div>
            ))}
          </div>
          {Array.from({ length: 6 }, (_, week) => (
            <div key={week} role="row" className="contents">
              {cells.slice(week * 7, week * 7 + 7).map((day) => {
                const items = byDay.get(key(day)) ?? []
                const outside = day.getMonth() !== month.getMonth()
                const isToday = day.getTime() === today.getTime()
                const isSelected = day.getTime() === selected.getTime()
                return (
                  <div
                    key={key(day)}
                    role="gridcell"
                    aria-selected={isSelected}
                    className="border-e border-b nth-[7n]:border-e-0"
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(day)}
                      className={cn(
                        'flex h-14 w-full flex-col items-stretch gap-0.5 p-1 text-start transition-colors hover:bg-muted/50 focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:h-24 md:p-1.5',
                        outside && 'bg-muted/30 text-muted-foreground',
                        isSelected && 'bg-primary/5 hover:bg-primary/8',
                      )}
                    >
                      <span
                        className={cn(
                          'grid size-6 place-items-center self-center rounded-full text-xs tabular-nums md:self-start',
                          isToday &&
                            'bg-primary font-semibold text-primary-foreground',
                          isSelected && !isToday && 'ring-1 ring-primary',
                        )}
                      >
                        <span aria-hidden="true">{day.getDate()}</span>
                        {/* Full date for screen readers; event names follow. */}
                        <span className="sr-only">
                          {new Intl.DateTimeFormat(i18n.language, {
                            dateStyle: 'full',
                          }).format(day)}
                        </span>
                      </span>
                      {/* Phones show dots; wider screens show labelled pills. */}
                      <span className="flex justify-center gap-0.5 md:hidden">
                        {items.slice(0, 3).map((item, index) => (
                          <span
                            key={index}
                            className={cn(
                              'size-1.5 rounded-full',
                              tone[item.kind].dot,
                            )}
                          />
                        ))}
                      </span>
                      <span className="hidden min-w-0 flex-col gap-0.5 md:flex">
                        {items.slice(0, PILLS).map((item, index) => (
                          <span
                            key={index}
                            className={cn(
                              'truncate rounded px-1 py-px text-[0.6875rem] leading-4 font-medium',
                              tone[item.kind].pill,
                            )}
                          >
                            {item.title}
                          </span>
                        ))}
                        {items.length > PILLS && (
                          <span className="truncate px-1 text-[0.6875rem] leading-4 text-muted-foreground">
                            {t('moreCount', { count: items.length - PILLS })}
                          </span>
                        )}
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </Card>
      <Card className="gap-3 px-5 py-4 2xl:self-start">
        <div>
          <h3 className="text-sm font-semibold">
            {new Intl.DateTimeFormat(i18n.language, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }).format(selected)}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t('agendaCount', { count: agenda.length })}
          </p>
        </div>
        {agenda.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
            {t('agendaEmpty')}
          </p>
        ) : (
          <ul className="grid gap-2">
            {[...agenda]
              .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
              .map((item, index) => (
                <li
                  key={index}
                  className="flex gap-3 rounded-lg border px-3 py-2"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'w-1 shrink-0 rounded-full',
                      tone[item.kind].dot,
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.time ? (
                        <span dir="ltr">{item.time}</span>
                      ) : (
                        t('allDay')
                      )}{' '}
                      · {t(kindLabel[item.kind])}
                    </p>
                  </div>
                </li>
              ))}
          </ul>
        )}
        <ul
          className="mt-1 flex flex-wrap gap-x-3 gap-y-1 border-t pt-3 text-xs text-muted-foreground"
          aria-label={t('legend')}
        >
          {(Object.keys(tone) as Kind[]).map((kind) => (
            <li key={kind} className="flex items-center gap-1.5">
              <span className={cn('size-2 rounded-full', tone[kind].dot)} />
              {t(kindLabel[kind])}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
