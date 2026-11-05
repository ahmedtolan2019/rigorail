import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { RotateCcw, TrendingDown, TrendingUp } from 'lucide-react'
import { compactMoney } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart'
import { Slider } from '@/shared/ui/slider'
import { ns } from '../messages'

interface Assumptions {
  growth: number
  price: number
  hires: number
  churn: number
}
const defaults: Assumptions = { growth: 3, price: 0, hires: 2, churn: 1.5 }
const limits: Record<
  keyof Assumptions,
  { min: number; max: number; step: number; unit: '%' | '' }
> = {
  growth: { min: 0, max: 10, step: 0.5, unit: '%' },
  price: { min: -10, max: 15, step: 1, unit: '%' },
  hires: { min: 0, max: 10, step: 1, unit: '' },
  churn: { min: 0, max: 5, step: 0.5, unit: '%' },
}
const labels = {
  growth: 'growth',
  price: 'priceChange',
  hires: 'newHires',
  churn: 'churn',
} as const
// Starting monthly figures in minor units.
const REVENUE = 42_000_000
const COSTS = 44_500_000
const COST_PER_HIRE = 1_100_000

/** Twelve-month projection: revenue compounds net of churn; each hire adds cost and capacity. */
function project(input: Assumptions) {
  let revenue = REVENUE * (1 + input.price / 100)
  return Array.from({ length: 12 }, (_, month) => {
    revenue *= 1 + (input.growth - input.churn + input.hires * 0.15) / 100
    const costs =
      COSTS * 1.004 ** month +
      input.hires * COST_PER_HIRE * Math.min(1, (month + 1) / 3)
    return { month, revenue, costs }
  })
}

export default function Planner() {
  const { t, i18n } = useTranslation(ns)
  const [input, setInput] = useState(defaults)
  const baseline = useMemo(() => project(defaults), [])
  const scenario = useMemo(() => project(input), [input])
  const data = scenario.map((point, index) => ({
    label: new Intl.DateTimeFormat(i18n.language, { month: 'short' }).format(
      new Date(new Date().getFullYear(), new Date().getMonth() + index + 1, 1),
    ),
    baseline: Math.round(baseline[index]!.revenue),
    scenario: Math.round(point.revenue),
  }))
  const end = scenario[11]!.revenue
  const delta = end / baseline[11]!.revenue - 1
  const breakEven = scenario.findIndex((point) => point.revenue >= point.costs)
  const config = {
    baseline: { label: t('baseline'), color: 'var(--muted-foreground)' },
    scenario: { label: t('scenario'), color: 'var(--chart-1)' },
  } satisfies ChartConfig
  const changed = (Object.keys(defaults) as (keyof Assumptions)[]).some(
    (key) => input[key] !== defaults[key],
  )
  const format = (key: keyof Assumptions, value: number) =>
    limits[key].unit === '%'
      ? new Intl.NumberFormat(i18n.language, {
          style: 'percent',
          maximumFractionDigits: 1,
          signDisplay: key === 'price' ? 'exceptZero' : 'auto',
        }).format(value / 100)
      : new Intl.NumberFormat(i18n.language).format(value)

  return (
    <div className="grid gap-3 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-4">
      <Card className="lg:self-start">
        <CardHeader>
          <CardTitle>{t('assumptions')}</CardTitle>
          <CardAction>
            <Button
              size="sm"
              variant="ghost"
              disabled={!changed}
              onClick={() => setInput(defaults)}
            >
              <RotateCcw data-icon="inline-start" />
              {t('reset')}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-5">
          {(Object.keys(limits) as (keyof Assumptions)[]).map((key) => (
            <Assumption
              key={key}
              label={t(labels[key])}
              value={input[key]}
              display={format(key, input[key])}
              {...limits[key]}
              onChange={(value) =>
                setInput((current) => ({ ...current, [key]: value }))
              }
            />
          ))}
        </CardContent>
      </Card>
      <div className="grid min-w-0 content-start gap-3 lg:gap-4">
        <div className="grid grid-cols-3 gap-3 lg:gap-4">
          <Kpi label={t('yearEnd')} value={compactMoney(end)} />
          <Kpi
            label={t('vsBaseline')}
            value={new Intl.NumberFormat(i18n.language, {
              style: 'percent',
              maximumFractionDigits: 1,
              signDisplay: 'exceptZero',
            }).format(delta)}
            tone={
              Math.abs(delta) < 0.0005 ? undefined : delta > 0 ? 'up' : 'down'
            }
          />
          <Kpi
            label={t('breakEven')}
            value={breakEven < 0 ? t('notWithinYear') : data[breakEven]!.label}
          />
        </div>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>{t('forecast')}</CardTitle>
            <CardDescription>{t('forecastHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={config} className="aspect-auto h-64 w-full">
              <AreaChart data={data} margin={{ left: 4, right: 16, top: 8 }}>
                <defs>
                  <linearGradient id="planner-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-scenario)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-scenario)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  interval={0}
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  width={56}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => compactMoney(value)}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <TooltipRow
                          name={config[name as keyof typeof config]?.label}
                          value={compactMoney(Number(value))}
                        />
                      )}
                    />
                  }
                />
                <Area
                  dataKey="baseline"
                  type="monotone"
                  stroke="var(--color-baseline)"
                  strokeDasharray="4 4"
                  fill="none"
                  strokeWidth={1.5}
                  isAnimationActive={false}
                />
                <Area
                  dataKey="scenario"
                  type="monotone"
                  stroke="var(--color-scenario)"
                  fill="url(#planner-fill)"
                  strokeWidth={2}
                  animationDuration={300}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TooltipRow({ name, value }: { name?: string; value: string }) {
  return (
    <span className="flex w-full justify-between gap-4">
      <span className="text-muted-foreground">{name}</span>
      <bdi className="font-medium tabular-nums">{value}</bdi>
    </span>
  )
}

function Assumption({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  display: string
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  const id = useId()
  return (
    <div className="grid gap-2.5">
      <div className="flex items-center justify-between text-sm">
        <span id={id}>{label}</span>
        <span className="font-medium tabular-nums">{display}</span>
      </div>
      <Slider
        aria-labelledby={id}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next!)}
      />
    </div>
  )
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'up' | 'down'
}) {
  const Icon = tone === 'down' ? TrendingDown : TrendingUp
  return (
    <Card className="min-w-0 gap-1 px-4 py-3.5">
      <p className="truncate text-[0.8125rem] text-muted-foreground">{label}</p>
      <p
        className={cn(
          'flex items-center gap-1.5 truncate text-lg font-semibold tracking-tight tabular-nums sm:text-xl',
          tone === 'up' && 'text-success',
          tone === 'down' && 'text-destructive',
        )}
      >
        {tone && <Icon aria-hidden="true" className="size-4 shrink-0" />}
        <bdi className="truncate">{value}</bdi>
      </p>
    </Card>
  )
}
