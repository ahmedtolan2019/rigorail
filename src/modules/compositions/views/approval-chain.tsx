import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  BellRing,
  Check,
  CircleDashed,
  Clock,
  Minus,
  UserRoundCog,
} from 'lucide-react'
import { compactNumber, money } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { ns } from '../messages'

interface Stage {
  key: string
  /** Minimum amount (minor units) that requires this stage; 0 means always. */
  threshold: number
  people: string[]
  /** How many of `people` must approve. */
  rule: 'any' | 'all'
}
const stages: Stage[] = [
  { key: 'stageManager', threshold: 0, people: ['Omar Haddad'], rule: 'any' },
  {
    key: 'stageBudgetOwner',
    threshold: 1_000_000,
    people: ['Priya Nair'],
    rule: 'any',
  },
  {
    key: 'stageFinance',
    threshold: 2_500_000,
    people: ['Sam Taylor', 'Chen Wei'],
    rule: 'any',
  },
  {
    key: 'stageLegal',
    threshold: 5_000_000,
    people: ['Nadia Karim'],
    rule: 'any',
  },
  {
    key: 'stageCfo',
    threshold: 10_000_000,
    people: ['Alex Morgan'],
    rule: 'all',
  },
]
const amounts = [450_000, 1_850_000, 6_200_000, 12_000_000]
const delegates = ['Lina Farouk', 'Chen Wei', 'Sam Taylor']
const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')

export default function ApprovalChain() {
  const { t } = useTranslation(ns)
  const [amount, setAmount] = useState(amounts[2]!)
  const [assignee, setAssignee] = useState<string | null>(null)
  const route = stages.filter((stage) => amount >= stage.threshold)
  // Sample progress: the first required stage is approved, the second is waiting.
  const statusOf = (stage: Stage) => {
    const index = route.indexOf(stage)
    if (index < 0) return 'skipped'
    if (index === 0) return 'approved'
    return index === 1 ? 'pending' : 'waiting'
  }
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-4">
      <Card className="min-w-0 gap-0 py-0">
        <div className="flex flex-wrap items-center gap-3 border-b px-5 py-3">
          <div className="min-w-0 basis-full">
            <h3 className="text-sm font-semibold">
              <span dir="ltr">REQ-1212</span> · {t('approvalRoute')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('approvalRouteHint')}
            </p>
          </div>
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={String(amount)}
            onValueChange={(value) => {
              if (!value) return
              setAmount(Number(value))
              setAssignee(null)
            }}
            aria-label={t('tryAmount')}
            className="w-full sm:w-auto"
          >
            {amounts.map((value) => (
              <ToggleGroupItem
                key={value}
                value={String(value)}
                aria-label={money(value)}
                className="min-w-0 flex-1 px-2 tabular-nums"
              >
                <bdi>{compactNumber(value / 100)}</bdi>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <ol className="grid gap-0 px-5 py-4">
          <Step status="approved" last={false}>
            <p className="text-sm font-medium">{t('stageSubmitted')}</p>
            <p className="text-xs text-muted-foreground">
              Lina Farouk · {t('hoursAgo', { count: 26 })}
            </p>
          </Step>
          {stages.map((stage, index) => {
            const status = statusOf(stage)
            const people =
              status === 'pending' && assignee ? [assignee] : stage.people
            return (
              <Step
                key={stage.key}
                status={status}
                last={index === stages.length - 1}
              >
                <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        status === 'skipped' && 'text-muted-foreground',
                      )}
                    >
                      {t(stage.key)}
                      {stage.people.length > 1 && status !== 'skipped' && (
                        <span className="ms-2 text-xs font-normal text-muted-foreground">
                          {t(stage.rule === 'any' ? 'anyOne' : 'everyone')}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {status === 'skipped' ? (
                        <>
                          {t('skippedBelow')}{' '}
                          <bdi>{money(stage.threshold)}</bdi>
                        </>
                      ) : status === 'approved' ? (
                        t('approvedBy', { name: people[0], count: 3 })
                      ) : status === 'pending' ? (
                        <span className="flex items-center gap-1 text-warning">
                          <Clock className="size-3" />
                          {t('slaLeft', { count: 5 })}
                        </span>
                      ) : (
                        t('waitingPrevious')
                      )}
                    </p>
                  </div>
                  {status !== 'skipped' && (
                    <div className="flex -space-x-1.5 rtl:space-x-reverse">
                      {people.map((person) => (
                        <Avatar
                          key={person}
                          className="size-7 border-2 border-card"
                          title={person}
                        >
                          <AvatarFallback className="bg-primary/10 text-[0.625rem] font-semibold text-primary">
                            {initials(person)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  )}
                  {status === 'pending' && (
                    <div className="flex w-full gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          toast.success(
                            t('reminderSent', { name: people.join(', ') }),
                          )
                        }
                      >
                        <BellRing data-icon="inline-start" />
                        {t('remind')}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <UserRoundCog data-icon="inline-start" />
                            {t('reassign')}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>
                            {t('reassignTo')}
                          </DropdownMenuLabel>
                          {delegates.map((person) => (
                            <DropdownMenuItem
                              key={person}
                              onClick={() => {
                                setAssignee(person)
                                toast.success(t('reassigned', { name: person }))
                              }}
                            >
                              {person}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </Step>
            )
          })}
        </ol>
      </Card>
      <Card className="gap-3 px-5 py-4 lg:self-start">
        <h3 className="text-sm font-semibold">{t('whyRoute')}</h3>
        <p className="text-xs text-muted-foreground">
          {t('whyRouteHint')}{' '}
          <bdi className="font-medium text-foreground">{money(amount)}</bdi>
        </p>
        <ul className="grid gap-2">
          {stages.map((stage) => {
            const applies = amount >= stage.threshold
            return (
              <li key={stage.key} className="flex items-start gap-2 text-sm">
                <span
                  className={cn(
                    'mt-0.5 grid size-4 shrink-0 place-items-center rounded-full',
                    applies
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {applies ? (
                    <Check className="size-3" />
                  ) : (
                    <Minus className="size-3" />
                  )}
                </span>
                <span className={cn(!applies && 'text-muted-foreground')}>
                  {stage.threshold === 0 ? (
                    t('ruleAlways', { stage: t(stage.key) })
                  ) : (
                    <>
                      {t('ruleOver', { stage: t(stage.key) })}{' '}
                      <bdi>{money(stage.threshold)}</bdi>
                    </>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}

function Step({
  status,
  last,
  children,
}: {
  status: 'approved' | 'pending' | 'waiting' | 'skipped'
  last: boolean
  children: React.ReactNode
}) {
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!last && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute start-3 top-7 bottom-0 w-px -translate-x-1/2 rtl:translate-x-1/2',
            status === 'approved' ? 'bg-primary' : 'bg-border',
            status === 'skipped' && 'border-s border-dashed bg-transparent',
          )}
        />
      )}
      <span
        className={cn(
          'relative z-10 grid size-6 shrink-0 place-items-center rounded-full border bg-card',
          status === 'approved' &&
            'border-primary bg-primary text-primary-foreground',
          status === 'pending' &&
            'border-warning text-warning ring-4 ring-warning/15',
          status === 'waiting' && 'text-muted-foreground',
          status === 'skipped' && 'border-dashed text-muted-foreground/60',
        )}
      >
        {status === 'approved' ? (
          <Check className="size-3.5" />
        ) : status === 'pending' ? (
          <Clock className="size-3.5" />
        ) : status === 'skipped' ? (
          <Minus className="size-3" />
        ) : (
          <CircleDashed className="size-3.5" />
        )}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">{children}</div>
    </li>
  )
}
