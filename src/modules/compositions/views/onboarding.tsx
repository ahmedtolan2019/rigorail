import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Building2,
  Check,
  ChevronDown,
  FileUp,
  GitBranch,
  Landmark,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { ns } from '../messages'

interface Step {
  key: string
  icon: LucideIcon
  minutes: number
  /** Steps marked optional never block completion. */
  optional?: boolean
}
const steps: Step[] = [
  { key: 'setupCompany', icon: Building2, minutes: 2 },
  { key: 'setupTeam', icon: UsersRound, minutes: 3 },
  { key: 'setupApprovals', icon: GitBranch, minutes: 5 },
  { key: 'setupSuppliers', icon: FileUp, minutes: 4, optional: true },
  { key: 'setupBank', icon: Landmark, minutes: 3, optional: true },
]

export default function Onboarding() {
  const { t } = useTranslation(ns)
  const [done, setDone] = useState<Set<string>>(() => new Set(['setupCompany']))
  const [open, setOpen] = useState('setupTeam')
  const required = steps.filter((step) => !step.optional)
  const progress = done.size / steps.length
  const left = steps
    .filter((step) => !done.has(step.key))
    .reduce((sum, step) => sum + step.minutes, 0)
  const ready = required.every((step) => done.has(step.key))
  const complete = (key: string) => {
    setDone((set) => new Set(set).add(key))
    const next = steps.find((step) => step.key !== key && !done.has(step.key))
    if (next) setOpen(next.key)
    toast.success(t('stepDone', { step: t(key) }))
  }
  // Ring progress: circumference of r=20 is about 125.66.
  const circumference = 2 * Math.PI * 20
  return (
    <Card className="max-w-3xl gap-0 overflow-hidden py-0">
      <div className="flex items-center gap-4 border-b px-5 py-4">
        <svg
          viewBox="0 0 48 48"
          className="size-12 shrink-0 -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            strokeWidth="4"
            className="stroke-muted"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            className="stroke-primary transition-[stroke-dashoffset] duration-500"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </svg>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">
            {ready ? t('setupReady') : t('setupTitle')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('setupProgress', { done: done.size, total: steps.length })}
            {left > 0 && <> · {t('minutesLeft', { count: left })}</>}
          </p>
        </div>
      </div>
      <ol className="divide-y">
        {steps.map((step, index) => {
          const finished = done.has(step.key)
          const expanded = open === step.key && !finished
          return (
            <li key={step.key}>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={`setup-${step.key}`}
                onClick={() => setOpen(expanded ? '' : step.key)}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-start transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
              >
                <span
                  className={cn(
                    'grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold tabular-nums transition-colors',
                    finished
                      ? 'border-success bg-success text-white'
                      : expanded
                        ? 'border-primary text-primary'
                        : 'text-muted-foreground',
                  )}
                >
                  {finished ? <Check className="size-3.5" /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block text-sm font-medium',
                      finished &&
                        'text-muted-foreground line-through decoration-muted-foreground/40',
                    )}
                  >
                    {t(step.key)}
                  </span>
                  {!expanded && (
                    <span className="block text-xs text-muted-foreground">
                      {step.optional
                        ? t('optional')
                        : t('minutesCount', { count: step.minutes })}
                    </span>
                  )}
                </span>
                {!finished && (
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      'size-4 text-muted-foreground transition-transform',
                      expanded && 'rotate-180',
                    )}
                  />
                )}
              </button>
              {expanded && (
                <div
                  id={`setup-${step.key}`}
                  className="flex animate-in gap-4 px-5 pb-4 duration-200 fade-in-0 slide-in-from-top-1 sm:ps-15"
                >
                  <span
                    aria-hidden="true"
                    className="hidden size-14 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground sm:grid"
                  >
                    <step.icon className="size-6" />
                  </span>
                  <div className="grid gap-3">
                    <p className="text-sm text-muted-foreground">
                      {t(`${step.key}Hint`)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => complete(step.key)}>
                        {t(`${step.key}Action`)}
                      </Button>
                      {step.optional && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => complete(step.key)}
                        >
                          {t('skipForNow')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>
      {done.size > 1 && (
        <div className="flex items-center justify-end border-t bg-muted/30 px-5 py-2.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDone(new Set(['setupCompany']))}
          >
            {t('resetDemo')}
          </Button>
        </div>
      )}
    </Card>
  )
}
