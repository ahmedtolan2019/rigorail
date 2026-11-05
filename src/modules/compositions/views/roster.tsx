import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { TriangleAlert } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { ns } from '../messages'

const shifts = ['morning', 'evening', 'night', 'off', 'leave'] as const
type Shift = (typeof shifts)[number]
const style: Record<Shift, { label: string; short: string; cell: string }> = {
  morning: {
    label: 'shiftMorning',
    short: 'shiftMorningShort',
    cell: 'bg-info/12 text-info',
  },
  evening: {
    label: 'shiftEvening',
    short: 'shiftEveningShort',
    cell: 'bg-primary/12 text-primary',
  },
  night: {
    label: 'shiftNight',
    short: 'shiftNightShort',
    cell: 'bg-foreground/10 text-foreground',
  },
  off: {
    label: 'shiftOff',
    short: 'shiftOffShort',
    cell: 'text-muted-foreground',
  },
  leave: {
    label: 'shiftLeave',
    short: 'shiftLeaveShort',
    cell: 'bg-warning/12 text-warning',
  },
}
const HOURS = 8
const MAX_HOURS = 40
/** Minimum people per working shift, every day. */
const required: Partial<Record<Shift, number>> = {
  morning: 2,
  evening: 2,
  night: 1,
}
const people = [
  'Alex Morgan',
  'Lina Farouk',
  'Omar Haddad',
  'Chen Wei',
  'Nadia Karim',
  'Sam Taylor',
  'Priya Nair',
]
const pattern: Shift[][] = [
  ['morning', 'morning', 'morning', 'morning', 'morning', 'off', 'off'],
  ['morning', 'morning', 'leave', 'leave', 'morning', 'off', 'off'],
  ['evening', 'evening', 'evening', 'evening', 'evening', 'off', 'morning'],
  ['evening', 'evening', 'morning', 'evening', 'off', 'morning', 'evening'],
  ['night', 'night', 'night', 'off', 'off', 'night', 'night'],
  ['off', 'morning', 'evening', 'morning', 'evening', 'evening', 'morning'],
  ['off', 'off', 'night', 'night', 'night', 'evening', 'evening'],
]

export default function Roster() {
  const { t, i18n } = useTranslation(ns)
  const [plan, setPlan] = useState(pattern)
  const days = useMemo(() => {
    const start = new Date()
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, index) => {
      const value = new Date(start)
      value.setDate(start.getDate() + index)
      return {
        weekday: new Intl.DateTimeFormat(i18n.language, {
          weekday: 'short',
        }).format(value),
        date: new Intl.DateTimeFormat(i18n.language, { day: 'numeric' }).format(
          value,
        ),
        long: new Intl.DateTimeFormat(i18n.language, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }).format(value),
      }
    })
  }, [i18n.language])
  const coverage = (day: number, shift: Shift) =>
    plan.filter((row) => row[day] === shift).length
  const gaps = days.flatMap((_, day) =>
    (Object.keys(required) as Shift[])
      .filter((shift) => coverage(day, shift) < required[shift]!)
      .map((shift) => ({ day, shift })),
  )
  const assign = (person: number, day: number, shift: Shift) => {
    setPlan((current) =>
      current.map((row, index) =>
        index === person
          ? row.map((cell, position) => (position === day ? shift : cell))
          : row,
      ),
    )
    toast(
      t('shiftAssigned', {
        name: people[person],
        shift: t(style[shift].label),
        day: days[day]!.long,
      }),
    )
  }

  return (
    <div className="grid gap-3">
      {gaps.length > 0 && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/8 px-4 py-2.5 text-sm"
        >
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-warning"
          />
          <p>
            <span className="font-medium">
              {t('coverageGaps', { count: gaps.length })}
            </span>{' '}
            <span className="text-muted-foreground">
              {gaps
                .slice(0, 3)
                .map(
                  (gap) =>
                    `${days[gap.day]!.weekday} ${t(style[gap.shift].label)}`,
                )
                .join(', ')}
              {gaps.length > 3 &&
                ` ${t('moreCount', { count: gaps.length - 3 })}`}
            </span>
          </p>
        </div>
      )}
      <Card className="min-w-0 gap-0 overflow-hidden py-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-separate border-spacing-0 text-sm">
            <caption className="sr-only">{t('rosterCaption')}</caption>
            <thead>
              <tr className="bg-muted/40">
                <th
                  scope="col"
                  className="sticky start-0 z-10 border-b bg-muted px-4 py-2 text-start text-xs font-medium text-muted-foreground"
                >
                  {t('person')}
                </th>
                {days.map((day) => (
                  <th
                    key={day.long}
                    scope="col"
                    abbr={day.long}
                    className="border-b px-1 py-2 text-center text-xs font-medium"
                  >
                    <span className="block text-muted-foreground">
                      {day.weekday}
                    </span>
                    <span className="tabular-nums">{day.date}</span>
                  </th>
                ))}
                <th
                  scope="col"
                  className="border-b border-s px-3 py-2 text-end text-xs font-medium text-muted-foreground"
                >
                  {t('hours')}
                </th>
              </tr>
            </thead>
            <tbody>
              {people.map((person, row) => {
                const hours =
                  plan[row]!.filter(
                    (shift) => shift !== 'off' && shift !== 'leave',
                  ).length * HOURS
                return (
                  <tr key={person}>
                    <th
                      scope="row"
                      className="sticky start-0 z-10 border-b bg-card px-4 py-1.5 text-start font-medium whitespace-nowrap"
                    >
                      {person}
                    </th>
                    {plan[row]!.map((shift, day) => (
                      <td key={day} className="border-b p-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label={`${person}, ${days[day]!.long}: ${t(style[shift].label)}`}
                            className={cn(
                              'grid h-8 w-full place-items-center rounded-md text-xs font-semibold transition-shadow hover:ring-1 hover:ring-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[state=open]:ring-2 data-[state=open]:ring-primary',
                              style[shift].cell,
                              shift === 'off' && 'border border-dashed',
                            )}
                          >
                            {t(style[shift].short)}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center">
                            <DropdownMenuLabel>
                              {days[day]!.long}
                            </DropdownMenuLabel>
                            <DropdownMenuRadioGroup
                              value={shift}
                              onValueChange={(value) =>
                                assign(row, day, value as Shift)
                              }
                            >
                              {shifts.map((option) => (
                                <DropdownMenuRadioItem
                                  key={option}
                                  value={option}
                                >
                                  {t(style[option].label)}
                                </DropdownMenuRadioItem>
                              ))}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    ))}
                    <td
                      className={cn(
                        'border-b border-s px-3 text-end tabular-nums',
                        hours > MAX_HOURS
                          ? 'font-semibold text-destructive'
                          : 'text-muted-foreground',
                      )}
                      title={hours > MAX_HOURS ? t('overtime') : undefined}
                    >
                      {hours}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              {(Object.keys(required) as Shift[]).map((shift) => (
                <tr key={shift} className="bg-muted/30 text-xs">
                  <th
                    scope="row"
                    className="sticky start-0 z-10 bg-muted px-4 py-1.5 text-start font-medium text-muted-foreground"
                  >
                    {t('coverageOf', { shift: t(style[shift].label) })}
                  </th>
                  {days.map((day, index) => {
                    const count = coverage(index, shift)
                    const short = count < required[shift]!
                    return (
                      <td
                        key={day.long}
                        className={cn(
                          'py-1.5 text-center tabular-nums',
                          short
                            ? 'font-semibold text-destructive'
                            : 'text-muted-foreground',
                        )}
                      >
                        {count}/{required[shift]}
                      </td>
                    )
                  })}
                  <td className="border-s" />
                </tr>
              ))}
            </tfoot>
          </table>
        </div>
      </Card>
      <ul
        className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
        aria-label={t('legend')}
      >
        {shifts.map((shift) => (
          <li key={shift} className="flex items-center gap-1.5">
            <span
              className={cn(
                'grid h-5 min-w-6 place-items-center rounded px-1 text-[0.625rem] font-semibold',
                style[shift].cell,
                shift === 'off' && 'border border-dashed',
              )}
            >
              {t(style[shift].short)}
            </span>
            {t(style[shift].label)}
          </li>
        ))}
      </ul>
    </div>
  )
}
