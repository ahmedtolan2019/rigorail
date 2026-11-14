import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Check, Clock, Download, Minus, X, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

/*
 * Record-page building blocks shared by the detail compositions. They take
 * translated labels and plain values, hold no business rules and fetch nothing.
 * Copy the ones a feature needs into its module; promote one to shared/ only when
 * several real modules use it.
 */

type Tone = 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'muted'
const toneVar: Record<Tone, string> = {
  primary: 'var(--primary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  destructive: 'var(--destructive)',
  info: 'var(--info)',
  muted: 'var(--muted-foreground)',
}
const toneText: Record<Tone, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  info: 'text-info',
  muted: 'text-muted-foreground',
}

/**
 * Header that sticks under the app bar and compacts once the page scrolls, so the
 * record's identity, status and primary actions stay reachable on long pages.
 */
export function RecordHeader({
  leading,
  title,
  badges,
  meta,
  actions,
  children,
}: {
  leading: ReactNode
  title: ReactNode
  badges?: ReactNode
  meta?: ReactNode
  actions?: ReactNode
  /** Extra rows (for example a stepper) that hide while compact. */
  children?: ReactNode
}) {
  const sentinel = useRef<HTMLDivElement>(null)
  const header = useRef<HTMLElement>(null)
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const node = sentinel.current
    const box = header.current
    if (!node || !box) return
    // Compacting shortens the page. Near the bottom the browser then clamps the scroll
    // position, which would un-compact the header and lengthen the page again: a
    // flicker loop. Hysteresis fixes it: compact once the sentinel passes under the
    // 56px app bar, expand only after scrolling back by more than the height saved.
    let expanded = box.offsetHeight
    let current = false
    const measure = () => {
      const top = node.getBoundingClientRect().top
      // Height compacting would remove: everything below the header's first row.
      const removable = box.offsetHeight - ((box.firstElementChild as HTMLElement | null)?.offsetHeight ?? 0)
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      // A page that cannot scroll past that height would snap back and loop; it stays full.
      if (!current && top < 57 && scrollable > removable + 8) {
        expanded = box.offsetHeight
        current = true
        setStuck(true)
      } else if (current) {
        const saved = Math.max(0, expanded - box.offsetHeight)
        // At the very top nothing can clamp, so expanding there is always stable.
        if (top >= 57 + saved || window.scrollY <= 0) {
          current = false
          setStuck(false)
        }
      }
    }
    // One rect read per scroll event; state only changes when the mode flips.
    measure()
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [])
  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="h-px" />
      <header
        ref={header}
        data-stuck={stuck || undefined}
        className="group/header sticky top-14 z-10 -mt-px min-w-0 rounded-xl border bg-card transition-shadow data-stuck:rounded-t-none data-stuck:shadow-md"
      >
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5 group-data-stuck/header:py-2">
          <div className="shrink-0 transition-transform group-data-stuck/header:scale-90">
            {leading}
          </div>
          {/* Never narrower than a short title: crowded actions wrap below it instead. */}
          <div className="min-w-[min(100%,14rem)] flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-lg font-semibold tracking-tight whitespace-nowrap group-data-stuck/header:text-base">
                {title}
              </h3>
              {badges}
            </div>
            {meta && (
              <div className="truncate text-sm text-muted-foreground group-data-stuck/header:hidden">
                {meta}
              </div>
            )}
          </div>
          {actions && (
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              {actions}
            </div>
          )}
        </div>
        {children && (
          <div className="border-t px-4 py-3 sm:px-5 group-data-stuck/header:hidden">
            {children}
          </div>
        )}
      </header>
    </>
  )
}

export interface Step {
  label: string
  meta?: string
  state: 'done' | 'current' | 'upcoming' | 'blocked' | 'skipped'
}
/** Lifecycle stepper: horizontal from `sm`, vertical on phones. */
export function Stepper({ steps, label }: { steps: Step[]; label: string }) {
  const icons: Record<Step['state'], LucideIcon | null> = {
    done: Check,
    current: Clock,
    upcoming: null,
    blocked: X,
    skipped: Minus,
  }
  return (
    <ol aria-label={label} className="grid gap-3 sm:flex sm:gap-0">
      {steps.map((step, index) => {
        const Icon = icons[step.state]
        return (
          <li
            key={step.label}
            aria-current={step.state === 'current' ? 'step' : undefined}
            className="relative flex items-start gap-2.5 sm:flex-1 sm:flex-col sm:items-stretch sm:gap-2"
          >
            <div className="flex items-center">
              <span
                className={cn(
                  'relative z-10 grid size-6 shrink-0 place-items-center rounded-full border bg-card text-[0.6875rem] font-semibold tabular-nums',
                  step.state === 'done' &&
                    'border-primary bg-primary text-primary-foreground',
                  step.state === 'current' &&
                    'border-warning text-warning ring-4 ring-warning/15',
                  step.state === 'blocked' &&
                    'border-destructive bg-destructive text-white',
                  (step.state === 'upcoming' || step.state === 'skipped') &&
                    'text-muted-foreground',
                  step.state === 'skipped' && 'border-dashed',
                )}
              >
                {Icon ? <Icon className="size-3.5" /> : index + 1}
              </span>
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'mx-2 hidden h-0.5 flex-1 rounded-full sm:block',
                    step.state === 'done' ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </div>
            <div className="min-w-0 sm:pe-3">
              <p
                className={cn(
                  'truncate text-sm',
                  step.state === 'current' ? 'font-semibold' : 'font-medium',
                  (step.state === 'upcoming' || step.state === 'skipped') &&
                    'text-muted-foreground',
                )}
              >
                {step.label}
              </p>
              {step.meta && (
                <p className="truncate text-xs text-muted-foreground">
                  {/* Each part isolated, so a Latin name and an Arabic date ("Samy Serag · ١٢/١١") keep their own order. */}
                  {step.meta.split(' · ').map((part, index) => (
                    <Fragment key={index}>
                      {index > 0 && ' · '}
                      <bdi>{part}</bdi>
                    </Fragment>
                  ))}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Minimal trend line. Time runs left to right in every language. */
export function Sparkline({
  values,
  tone = 'primary',
  label,
  className,
}: {
  values: number[]
  tone?: Tone
  label: string
  className?: string
}) {
  const id = useId()
  // A trend needs two points; a new record has none yet.
  if (values.length < 2) return null
  const width = 100
  const height = 32
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values.map((value, index) => [
    (index / (values.length - 1)) * width,
    height - 3 - ((value - min) / span) * (height - 6),
  ])
  const line = points.map(([x, y]) => `${x},${y}`).join(' ')
  const last = points[points.length - 1]!
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('h-8 w-full overflow-visible', className)}
      style={{ direction: 'ltr' }}
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={toneVar[tone]} stopOpacity={0.22} />
          <stop offset="100%" stopColor={toneVar[tone]} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${line} ${width},${height}`}
        fill={`url(#${id})`}
      />
      <polyline
        points={line}
        fill="none"
        stroke={toneVar[tone]}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r={2.5}
        fill={toneVar[tone]}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/** Compact metric for record strips: label, value, optional context and trend. */
export function Metric({
  label,
  value,
  hint,
  hintTone = 'muted',
  children,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  hintTone?: Tone
  /** A sparkline, meter or bar under the value. */
  children?: ReactNode
}) {
  return (
    <div className="grid min-w-0 content-start gap-1">
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-lg font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {hint && (
        <p className={cn('truncate text-xs', toneText[hintTone])}>{hint}</p>
      )}
      {children && <div className="mt-1">{children}</div>}
    </div>
  )
}

export interface Segment {
  label: string
  value: number
  tone: Tone
  /** Hatched segments show amounts not yet final, such as this record's commitment. */
  pending?: boolean
}
/**
 * Stacked consumption bar (spent, committed, this record) against a limit.
 * Overflow beyond the limit is drawn in destructive colour past a marker.
 */
export function BudgetBar({
  segments,
  limit,
  format,
  label,
  legend = true,
}: {
  segments: Segment[]
  limit: number
  format: (value: number) => string
  label: string
  legend?: boolean
}) {
  const used = segments.reduce((sum, segment) => sum + segment.value, 0)
  const scale = Math.max(limit, used)
  return (
    <div className="grid gap-2">
      <div
        role="img"
        aria-label={`${label}: ${segments.map((segment) => `${segment.label} ${format(segment.value)}`).join(', ')}`}
        className="relative flex h-2.5 overflow-hidden rounded-full bg-muted"
      >
        {segments.map((segment) => (
          <span
            key={segment.label}
            className="h-full first:rounded-s-full"
            style={{
              width: `${(segment.value / scale) * 100}%`,
              background: segment.pending
                ? `repeating-linear-gradient(135deg, ${toneVar[segment.tone]} 0 4px, color-mix(in oklch, ${toneVar[segment.tone]} 45%, transparent) 4px 8px)`
                : toneVar[segment.tone],
            }}
          />
        ))}
        {used > limit && (
          <span
            aria-hidden="true"
            className="absolute inset-y-0 w-0.5 bg-foreground"
            style={{ insetInlineStart: `${(limit / scale) * 100}%` }}
          />
        )}
      </div>
      {legend && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {segments.map((segment) => (
            <li key={segment.label} className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ background: toneVar[segment.tone] }}
              />
              {segment.label}
              <bdi className="font-medium text-foreground tabular-nums">
                {format(segment.value)}
              </bdi>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Thumbnail card for an attachment, drawn from its type rather than a stock icon. */
export function FilePreview({
  name,
  kind,
  meta,
  downloadLabel,
  onDownload,
}: {
  name: string
  kind: 'pdf' | 'sheet' | 'image'
  meta: string
  downloadLabel: string
  onDownload: () => void
}) {
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
      <div
        aria-hidden="true"
        className="relative grid h-28 place-items-center overflow-hidden bg-muted/60 px-6 pt-4"
      >
        {kind === 'sheet' ? (
          <div className="grid h-full w-full grid-cols-4 grid-rows-5 gap-px self-end rounded-t-md border border-b-0 bg-border shadow-sm">
            {Array.from({ length: 20 }, (_, index) => (
              <span
                key={index}
                className={cn(
                  'bg-card',
                  index < 4 && 'bg-success/15',
                  index % 4 === 3 && index > 3 && 'bg-muted',
                )}
              />
            ))}
          </div>
        ) : kind === 'image' ? (
          <div className="relative h-full w-full self-end overflow-hidden rounded-t-md border border-b-0 bg-gradient-to-b from-info/20 to-info/5 shadow-sm">
            <span className="absolute start-4 top-3 size-4 rounded-full bg-warning/50" />
            <span className="absolute -bottom-3 start-2 h-10 w-16 rotate-12 rounded-md bg-success/25" />
            <span className="absolute -bottom-4 end-2 h-12 w-20 -rotate-6 rounded-md bg-info/30" />
          </div>
        ) : (
          <div className="grid h-full w-full content-start gap-1.5 self-end rounded-t-md border border-b-0 bg-card p-3 shadow-sm">
            <span className="h-1.5 w-1/2 rounded-full bg-foreground/25" />
            <span className="h-1 w-full rounded-full bg-muted-foreground/20" />
            <span className="h-1 w-5/6 rounded-full bg-muted-foreground/20" />
            <span className="h-1 w-full rounded-full bg-muted-foreground/20" />
            <span className="h-1 w-2/3 rounded-full bg-muted-foreground/20" />
          </div>
        )}
        <span className="absolute end-2 top-2 rounded bg-background/90 px-1.5 text-[0.625rem] font-semibold text-muted-foreground uppercase">
          {kind === 'sheet' ? 'csv' : kind === 'image' ? 'jpg' : 'txt'}
        </span>
      </div>
      <div className="flex items-center gap-2 border-t px-3 py-2">
        <div className="min-w-0 flex-1">
          <p dir="ltr" className="truncate text-start text-sm font-medium">
            {name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{meta}</p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 shrink-0"
          aria-label={downloadLabel}
          onClick={onDownload}
        >
          <Download />
        </Button>
      </div>
    </div>
  )
}

/** Small linked record: reference, title and status, for "related" panels. */
export function RelatedRecord({
  icon: Icon,
  reference,
  title,
  status,
  tone = 'muted',
}: {
  icon: LucideIcon
  reference: string
  title: string
  status: string
  tone?: Tone
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50">
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p dir="auto" className="truncate text-start text-sm font-medium">{title}</p>
        <p
          dir="ltr"
          className="truncate text-start text-xs text-muted-foreground tabular-nums"
        >
          {reference}
        </p>
      </div>
      <span
        className={cn(
          'flex shrink-0 items-center gap-1.5 text-xs font-medium',
          toneText[tone],
        )}
      >
        <span
          className="size-1.5 rounded-full"
          style={{ background: toneVar[tone] }}
        />
        {status}
      </span>
    </div>
  )
}
