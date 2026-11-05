import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, RotateCcw, Undo2 } from 'lucide-react'
import { money, relativeDate } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Illustration } from '@/shared/ui/illustration'
import { Kbd } from '@/shared/ui/kbd'
import { Progress } from '@/shared/ui/progress'
import { ns } from '../messages'

interface Item {
  ref: string
  title: string
  who: string
  amount: number
  hours: number
  reason: string
  budgetUsed: number
}
const queue: Item[] = [
  {
    ref: 'REQ-1212',
    title: 'Analytics platform renewal',
    who: 'Priya Nair',
    amount: 1_850_000,
    hours: 3,
    reason:
      'Annual renewal; price held at last year’s rate if signed this month.',
    budgetUsed: 0.62,
  },
  {
    ref: 'REQ-1239',
    title: 'Site safety supplies',
    who: 'Alex Morgan',
    amount: 112_000,
    hours: 5,
    reason: 'Replacing expired helmets and vests ahead of the safety audit.',
    budgetUsed: 0.41,
  },
  {
    ref: 'REQ-1198',
    title: 'Leadership workshop',
    who: 'Omar Haddad',
    amount: 640_000,
    hours: 20,
    reason: 'Two-day workshop for twelve new team leads.',
    budgetUsed: 0.88,
  },
  {
    ref: 'REQ-1230',
    title: 'Printer supplies',
    who: 'Lina Farouk',
    amount: 200_050,
    hours: 26,
    reason: 'Toner and paper for the Jeddah office for Q4.',
    budgetUsed: 0.35,
  },
  {
    ref: 'REQ-1236',
    title: 'Translation services',
    who: 'Nadia Karim',
    amount: 310_000,
    hours: 49,
    reason: 'Arabic translation of the supplier handbook.',
    budgetUsed: 0.57,
  },
]
type Decision = 'approved' | 'returned'

export default function Triage() {
  const { t } = useTranslation(ns)
  const [decided, setDecided] = useState<Record<string, Decision>>({})
  const [active, setActive] = useState(0)
  const pending = queue.filter((item) => !decided[item.ref])
  const current = pending[Math.min(active, pending.length - 1)]
  const done = queue.length - pending.length
  const listRef = useRef<HTMLUListElement>(null)

  const decide = (decision: Decision) => {
    if (!current) return
    const ref = current.ref
    setDecided((value) => ({ ...value, [ref]: decision }))
    toast(
      t(decision === 'approved' ? 'approvedItem' : 'returnedItem', { ref }),
      {
        action: {
          label: t('undo'),
          onClick: () =>
            setDecided((value) => {
              const next = { ...value }
              delete next[ref]
              return next
            }),
        },
      },
    )
  }
  // Keep a ref to the latest handler so the listener is attached once.
  const handler = useRef<(event: KeyboardEvent) => void>(() => {})
  handler.current = (event) => {
    const target = event.target as HTMLElement
    if (event.metaKey || event.ctrlKey || event.altKey) return
    // Shortcuts never fire while typing or inside menus and dialogs.
    if (
      target.closest(
        'input, textarea, select, [contenteditable], [role=dialog], [role=menu]',
      )
    )
      return
    const key = event.key.toLowerCase()
    if (key === 'j')
      setActive((index) => Math.min(index + 1, pending.length - 1))
    else if (key === 'k') setActive((index) => Math.max(index - 1, 0))
    else if (key === 'a') decide('approved')
    else if (key === 'r') decide('returned')
    else return
    event.preventDefault()
  }
  useEffect(() => {
    const listener = (event: KeyboardEvent) => handler.current(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])
  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-current=true]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [current?.ref])

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-48 flex-1 items-center gap-3">
          <Progress
            value={(done / queue.length) * 100}
            className="h-1.5 max-w-64"
            aria-label={t('cleared', { done, total: queue.length })}
          />
          <span className="text-sm text-muted-foreground tabular-nums">
            {t('cleared', { done, total: queue.length })}
          </span>
        </div>
        <p className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
          <Kbd>J</Kbd>
          <Kbd>K</Kbd>
          {t('shortcutMove')}
          <Kbd className="ms-2">A</Kbd>
          {t('approve')}
          <Kbd className="ms-2">R</Kbd>
          {t('returnLabel')}
        </p>
      </div>
      {!current ? (
        <Card className="grid place-items-center gap-1 px-6 py-12 text-center">
          <Illustration name="empty" />
          <p className="font-medium">{t('queueEmpty')}</p>
          <p className="text-sm text-muted-foreground">{t('queueEmptyHint')}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setDecided({})}
          >
            <RotateCcw data-icon="inline-start" />
            {t('resetQueue')}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-[16rem_minmax(0,1fr)] lg:gap-4">
          <Card className="gap-0 overflow-hidden py-0">
            <h3 className="border-b px-4 py-2 text-xs font-medium text-muted-foreground">
              {t('queue')} · {pending.length}
            </h3>
            <ul
              ref={listRef}
              className="max-h-48 overflow-y-auto md:max-h-[26rem]"
            >
              {pending.map((item, index) => {
                const selected = item.ref === current.ref
                return (
                  <li key={item.ref}>
                    <button
                      type="button"
                      aria-current={selected}
                      onClick={() => setActive(index)}
                      className={cn(
                        'grid w-full gap-0.5 border-s-2 border-s-transparent px-4 py-2.5 text-start transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none',
                        selected &&
                          'border-s-primary bg-primary/5 hover:bg-primary/5',
                      )}
                    >
                      <span className="truncate text-sm font-medium">
                        {item.title}
                      </span>
                      <span className="flex justify-between gap-2 text-xs text-muted-foreground">
                        <span dir="ltr">{item.ref}</span>
                        <bdi className="tabular-nums">{money(item.amount)}</bdi>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>
          <Card
            key={current.ref}
            className="animate-in gap-5 px-5 py-5 duration-200 fade-in-0 slide-in-from-bottom-1 2xl:px-6"
          >
            <div className="flex items-start gap-3">
              <Avatar className="size-10">
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                  {current.who
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold">{current.title}</h3>
                <p className="text-sm text-muted-foreground">
                  <span dir="ltr">{current.ref}</span> · {current.who} ·{' '}
                  {relativeDate(
                    new Date(
                      Date.now() - current.hours * 3_600_000,
                    ).toISOString(),
                  )}
                </p>
              </div>
              <p className="text-xl font-semibold tracking-tight tabular-nums">
                <bdi>{money(current.amount)}</bdi>
              </p>
            </div>
            <div className="grid gap-1.5">
              <h4 className="text-xs font-medium text-muted-foreground">
                {t('reason')}
              </h4>
              <p className="text-sm leading-relaxed">{current.reason}</p>
            </div>
            <div className="grid gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-muted-foreground">
                  {t('budgetAfter')}
                </span>
                <span
                  className={cn(
                    'tabular-nums',
                    current.budgetUsed > 0.8
                      ? 'font-medium text-warning'
                      : 'text-muted-foreground',
                  )}
                >
                  {new Intl.NumberFormat(undefined, {
                    style: 'percent',
                  }).format(current.budgetUsed)}
                </span>
              </div>
              <Progress
                value={current.budgetUsed * 100}
                className={cn(
                  'h-1.5',
                  current.budgetUsed > 0.8 && '[&>*]:bg-warning',
                )}
              />
            </div>
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button onClick={() => decide('approved')}>
                <Check data-icon="inline-start" />
                {t('approve')}
                <Kbd className="ms-1 bg-primary-foreground/15 text-primary-foreground">
                  A
                </Kbd>
              </Button>
              <Button variant="outline" onClick={() => decide('returned')}>
                <Undo2 data-icon="inline-start" />
                {t('returnLabel')}
                <Kbd className="ms-1">R</Kbd>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
