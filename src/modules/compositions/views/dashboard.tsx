import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowUpRight,
  CheckCheck,
  CircleDollarSign,
  Clock,
  FileText,
  Send,
  type LucideIcon,
} from 'lucide-react'
import { compactMoney, money, relativeDate } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { ns } from '../messages'

const hour = 3_600_000
const tasks = [
  {
    ref: 'REQ-1239',
    title: 'Site safety supplies',
    who: 'Alex Morgan',
    amount: 112_000,
    due: 2,
  },
  {
    ref: 'REQ-1212',
    title: 'Analytics platform renewal',
    who: 'Priya Nair',
    amount: 1_850_000,
    due: 0,
  },
  {
    ref: 'REQ-1198',
    title: 'Leadership workshop',
    who: 'Omar Haddad',
    amount: 640_000,
    due: -1,
  },
  {
    ref: 'REQ-1187',
    title: 'Warehouse scanners',
    who: 'Lina Farouk',
    amount: 920_000,
    due: 5,
  },
  {
    ref: 'REQ-1176',
    title: 'Fleet tyre replacement',
    who: 'Chen Wei',
    amount: 384_000,
    due: 8,
  },
]
const week = [32, 48, 41, 66, 58, 21, 12]
const events: {
  icon: LucideIcon
  who: string
  action: string
  ref: string
  at: number
}[] = [
  {
    icon: CheckCheck,
    who: 'Alex Morgan',
    action: 'eventApproved',
    ref: 'REQ-1220',
    at: 1,
  },
  {
    icon: Send,
    who: 'Priya Nair',
    action: 'eventSubmitted',
    ref: 'REQ-1212',
    at: 3,
  },
  {
    icon: FileText,
    who: 'Sam Taylor',
    action: 'eventCreated',
    ref: 'REQ-1240',
    at: 5,
  },
  {
    icon: CircleDollarSign,
    who: 'Finance',
    action: 'eventBudget',
    ref: 'Q4',
    at: 26,
  },
]

export default function Dashboard() {
  const { t, i18n } = useTranslation(ns)
  const days = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' }).format(
      new Date(Date.now() - (6 - index) * 24 * hour),
    ),
  )
  const max = Math.max(...week)
  const stats = [
    {
      label: t('statPending'),
      value: '12',
      note: t('statPendingNote', { count: 3 }),
    },
    {
      label: t('statSpend'),
      value: compactMoney(4_821_000),
      note: t('statSpendNote'),
    },
    {
      label: t('statCycle'),
      value: t('days', { count: 4.2 }),
      note: t('statCycleNote'),
    },
    { label: t('statBudget'), value: '68%', note: t('statBudgetNote') },
  ]
  return (
    <div className="grid gap-3 lg:gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="min-w-0 gap-1 px-4 py-3.5">
            <p className="truncate text-[0.8125rem] text-muted-foreground">
              {stat.label}
            </p>
            <p className="text-xl font-semibold tracking-tight tabular-nums">
              <bdi>{stat.value}</bdi>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {stat.note}
            </p>
          </Card>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-5 lg:gap-4">
        <Card className="min-w-0 overflow-hidden pb-0 md:col-span-3">
          <CardHeader>
            <CardTitle>{t('waiting')}</CardTitle>
            <CardDescription>{t('waitingHint')}</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                {/* In a product this opens the module's filtered queue. */}
                <Link to="/compositions" search={{ view: 'triage' }}>
                  {t('viewAll')}
                  <ArrowUpRight className="rtl:-scale-x-100" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            <ul className="divide-y border-t">
              {tasks.map((task) => (
                <li
                  key={task.ref}
                  className="flex items-center gap-3 px-5 py-3 2xl:px-6"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {task.who
                        .split(' ')
                        .map((part) => part[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      <span dir="ltr">{task.ref}</span> · {task.who} ·{' '}
                      <bdi>{money(task.amount)}</bdi>
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'shrink-0 gap-1 rounded-full border-0',
                      task.due < 0 && 'bg-destructive/10 text-destructive',
                      task.due === 0 && 'bg-warning/12 text-warning',
                    )}
                  >
                    <Clock className="size-3" />
                    {task.due < 0
                      ? t('overdue')
                      : task.due === 0
                        ? t('dueToday')
                        : t('dueIn', { count: task.due })}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="hidden sm:inline-flex md:hidden 2xl:inline-flex"
                    asChild
                  >
                    <Link to="/compositions" search={{ view: 'record-tabs' }}>
                      {t('review')}
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <div className="grid min-w-0 gap-3 md:col-span-2 lg:gap-4">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>{t('thisWeek')}</CardTitle>
              <CardDescription>{t('thisWeekHint')}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* CSS bars: enough for a glanceable trend without a chart library. */}
              <div
                className="flex h-32 gap-2"
                role="img"
                aria-label={t('thisWeekHint')}
              >
                {week.map((value, index) => (
                  <div
                    key={index}
                    className="flex flex-1 flex-col items-center gap-1.5"
                  >
                    {/* The track has a definite height so percentage bars resolve. */}
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className={cn(
                          'w-full rounded-t-md bg-primary/25 transition-[height] duration-500',
                          index === week.length - 1 && 'bg-primary',
                        )}
                        style={{ height: `${(value / max) * 100}%` }}
                      />
                    </div>
                    <span className="text-[0.6875rem] text-muted-foreground">
                      {days[index]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>{t('recent')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-3">
                {events.map((event) => (
                  <li
                    key={event.ref}
                    className="flex items-start gap-3 text-sm"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                      <event.icon className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate">
                        <span className="font-medium">{event.who}</span>{' '}
                        <span className="text-muted-foreground">
                          {t(event.action)}
                        </span>{' '}
                        <span dir="ltr">{event.ref}</span>
                      </p>
                      <time className="text-xs text-muted-foreground">
                        {relativeDate(
                          new Date(Date.now() - event.at * hour).toISOString(),
                        )}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
