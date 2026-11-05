import { useTranslation } from 'react-i18next'
import { Diamond } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'
import { ns } from '../messages'

type Health = 'complete' | 'onTrack' | 'atRisk'
interface Phase {
  name: string
  owner: string
  /** Start and length in weeks from the first visible week. */
  start: number
  weeks: number
  progress: number
  health: Health
}
const WEEKS = 12
// "Today" sits partway through week 4 of the window.
const TODAY = 3.4
const phases: Phase[] = [
  {
    name: 'Discovery',
    owner: 'Priya Nair',
    start: 0,
    weeks: 2,
    progress: 1,
    health: 'complete',
  },
  {
    name: 'Supplier shortlist',
    owner: 'Lina Farouk',
    start: 1.5,
    weeks: 2.5,
    progress: 0.9,
    health: 'onTrack',
  },
  {
    name: 'Tender and evaluation',
    owner: 'Lina Farouk',
    start: 3,
    weeks: 3,
    progress: 0.25,
    health: 'atRisk',
  },
  {
    name: 'Contract negotiation',
    owner: 'Omar Haddad',
    start: 6,
    weeks: 2,
    progress: 0,
    health: 'onTrack',
  },
  {
    name: 'Pilot rollout',
    owner: 'Alex Morgan',
    start: 7.5,
    weeks: 2.5,
    progress: 0,
    health: 'onTrack',
  },
  {
    name: 'Full deployment',
    owner: 'Alex Morgan',
    start: 9.5,
    weeks: 2.5,
    progress: 0,
    health: 'onTrack',
  },
]
const milestones = [
  { name: 'Shortlist approved', at: 4 },
  { name: 'Contract signed', at: 8 },
  { name: 'Go-live', at: 11.5 },
]
const tone: Record<Health, { bar: string; fill: string }> = {
  complete: { bar: 'bg-success/20', fill: 'bg-success' },
  onTrack: { bar: 'bg-primary/20', fill: 'bg-primary' },
  atRisk: { bar: 'bg-warning/20', fill: 'bg-warning' },
}
const healthLabel = {
  complete: 'complete',
  onTrack: 'onTrack',
  atRisk: 'atRisk',
} as const
const percent = (weeks: number) => `${(weeks / WEEKS) * 100}%`

export default function Timeline() {
  const { t, i18n } = useTranslation(ns)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - Math.floor(TODAY * 7))
  const label = (week: number) => {
    const day = new Date(weekStart)
    day.setDate(day.getDate() + week * 7)
    return new Intl.DateTimeFormat(i18n.language, {
      day: 'numeric',
      month: 'short',
    }).format(day)
  }
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-4 py-2.5 text-xs text-muted-foreground">
        {(Object.keys(tone) as Health[]).map((health) => (
          <span key={health} className="flex items-center gap-1.5">
            <span className={cn('h-2 w-4 rounded-full', tone[health].fill)} />
            {t(healthLabel[health])}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <Diamond className="size-3 fill-foreground text-foreground" />
          {t('milestone')}
        </span>
      </div>
      {/* Bars use inline-start offsets so the chart mirrors in right-to-left layouts. */}
      <div className="overflow-x-auto">
        <div className="grid min-w-[44rem] grid-cols-[11rem_minmax(0,1fr)]">
          <div className="sticky start-0 z-20 border-e border-b bg-card px-4 py-2 text-xs font-medium text-muted-foreground">
            {t('phase')}
          </div>
          <div
            className="relative grid border-b"
            style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: WEEKS }, (_, week) => (
              <div
                key={week}
                className="border-e px-1.5 py-2 text-[0.6875rem] text-muted-foreground last:border-e-0"
              >
                {label(week)}
              </div>
            ))}
          </div>
          {phases.map((phase) => (
            <div key={phase.name} className="contents">
              <div className="sticky start-0 z-20 border-e border-b bg-card px-4 py-2.5">
                <p className="truncate text-sm font-medium">{phase.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {phase.owner}
                </p>
              </div>
              <div className="relative border-b">
                <Grid />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      tabIndex={0}
                      aria-label={`${phase.name}: ${t(healthLabel[phase.health])}, ${Math.round(phase.progress * 100)}%`}
                      className={cn(
                        'absolute top-1/2 h-6 -translate-y-1/2 overflow-hidden rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        tone[phase.health].bar,
                      )}
                      style={{
                        insetInlineStart: percent(phase.start),
                        width: percent(phase.weeks),
                      }}
                    >
                      <div
                        className={cn(
                          'h-full rounded-md',
                          tone[phase.health].fill,
                        )}
                        style={{ width: `${phase.progress * 100}%` }}
                      />
                      <span className="absolute inset-0 flex items-center px-2 text-[0.6875rem] font-medium text-foreground tabular-nums">
                        {Math.round(phase.progress * 100)}%
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {phase.name} · {t(healthLabel[phase.health])}
                  </TooltipContent>
                </Tooltip>
                <Today />
              </div>
            </div>
          ))}
          <div className="sticky start-0 z-20 border-e bg-card px-4 py-2.5 text-sm font-medium">
            {t('milestones')}
          </div>
          <div className="relative h-12">
            <Grid />
            {milestones.map((milestone) => {
              const nearEnd = milestone.at > WEEKS - 2
              return (
                // A zero-width anchor at the date; the label hangs on the side with room.
                <div
                  key={milestone.name}
                  className="absolute top-1/2 w-0"
                  style={{ insetInlineStart: percent(milestone.at) }}
                >
                  <Diamond
                    aria-hidden="true"
                    className="absolute top-1/2 size-3.5 -translate-y-1/2 fill-foreground text-foreground ltr:-translate-x-1/2 rtl:translate-x-1/2"
                  />
                  <span
                    className={cn(
                      'absolute top-1/2 -translate-y-1/2 text-[0.6875rem] font-medium whitespace-nowrap',
                      nearEnd ? 'end-2.5' : 'start-2.5',
                    )}
                  >
                    {milestone.name}
                  </span>
                </div>
              )
            })}
            <Today label={t('todayLabel')} />
          </div>
        </div>
      </div>
    </Card>
  )
}

function Grid() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 grid"
      style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: WEEKS }, (_, week) => (
        <div key={week} className="border-e border-border/50 last:border-e-0" />
      ))}
    </div>
  )
}

function Today({ label }: { label?: string }) {
  return (
    <div
      aria-hidden={!label}
      className="pointer-events-none absolute inset-y-0 z-10 w-px bg-destructive"
      style={{ insetInlineStart: percent(TODAY) }}
    >
      {label && (
        <span className="absolute bottom-1 start-1 rounded bg-destructive px-1 text-[0.625rem] font-medium whitespace-nowrap text-white">
          {label}
        </span>
      )}
    </div>
  )
}
