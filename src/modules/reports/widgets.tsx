import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Line,
  ComposedChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { compactMoney, compactNumber, money } from '@/shared/lib/format'
import { useMediaQuery } from '@/shared/hooks/use-media-query'
import { cn } from '@/shared/lib/utils'
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
import { Progress } from '@/shared/ui/progress'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { ns } from './messages'
import type { RequestReport } from './schema'
import { change } from './range'

const percent = (value: number, digits = 0) =>
  new Intl.NumberFormat(undefined, {
    style: 'percent',
    maximumFractionDigits: digits,
  }).format(value)

function periodFormat(language: string, bucket: RequestReport['bucket']) {
  return new Intl.DateTimeFormat(language, {
    month: 'short',
    ...(bucket === 'month' ? { year: '2-digit' } : { day: 'numeric' }),
  })
}

export function Kpis({ report }: { report: RequestReport }) {
  const { t } = useTranslation(ns)
  // Sparklines only fit beside the value on wide screens; don't mount them elsewhere.
  const wide = useMediaQuery('(min-width: 64rem)')
  const { totals, previous } = report
  const items = [
    {
      label: t('totalRequests'),
      value: compactNumber(totals.count),
      delta: change(totals.count, previous?.count ?? null),
      spark: report.series.map((item) => item.created),
    },
    {
      label: t('requestedAmount'),
      value: compactMoney(totals.amountMinor),
      note: t('approvedOf', {
        amount: compactMoney(totals.approvedAmountMinor),
      }),
      delta: change(totals.amountMinor, previous?.amountMinor ?? null),
      spark: report.series.map((item) => item.amountMinor),
    },
    {
      label: t('approvalRate'),
      value:
        totals.approvalRate === null
          ? t('noValue')
          : percent(totals.approvalRate),
      delta:
        totals.approvalRate !== null && previous?.approvalRate != null
          ? totals.approvalRate - previous.approvalRate
          : null,
    },
    {
      label: t('cycleTime'),
      value:
        totals.cycleDays === null
          ? t('noValue')
          : t('cycleValue', { days: totals.cycleDays.toFixed(1) }),
      delta: change(totals.cycleDays, previous?.cycleDays ?? null),
      lowerIsBetter: true,
    },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
      {items.map((item) => {
        const good =
          item.delta !== null &&
          (item.lowerIsBetter ? item.delta <= 0 : item.delta >= 0)
        return (
          <Card key={item.label} className="min-w-0 gap-1 px-4 py-3.5">
            <p className="truncate text-[0.8125rem] text-muted-foreground">
              {item.label}
            </p>
            <div className="flex items-end justify-between gap-3">
              <p className="text-xl leading-tight font-semibold tracking-tight tabular-nums xl:text-2xl">
                <bdi>{item.value}</bdi>
              </p>
              {wide && item.spark && item.spark.length > 1 && (
                <div className="w-20">
                  <Sparkline values={item.spark} />
                </div>
              )}
            </div>
            <div className="mt-1 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {item.delta !== null && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium tabular-nums',
                    good
                      ? 'bg-success/12 text-success'
                      : 'bg-destructive/10 text-destructive',
                  )}
                  title={t('vsPrevious')}
                >
                  {item.delta >= 0 ? (
                    <TrendingUp aria-hidden="true" className="size-3" />
                  ) : (
                    <TrendingDown aria-hidden="true" className="size-3" />
                  )}
                  <bdi>
                    {new Intl.NumberFormat(undefined, {
                      style: 'percent',
                      maximumFractionDigits: 1,
                      signDisplay: 'exceptZero',
                    }).format(item.delta)}
                  </bdi>
                  <span className="sr-only">{t('vsPrevious')}</span>
                </span>
              )}
              {item.note && <span className="truncate">{item.note}</span>}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

/** Decorative trend line; the KPI value and delta carry the information. */
function Sparkline({ values }: { values: number[] }) {
  const data = useMemo(
    () => values.map((value, index) => ({ index, value })),
    [values],
  )
  return (
    <ChartContainer
      config={{ value: { color: 'var(--chart-1)' } }}
      className="aspect-auto h-9 w-full"
      aria-hidden="true"
      // Decorative: keep the chart's focusable SVG out of the tab order too.
      inert
    >
      <AreaChart data={data} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
        <Area
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={1.5}
          fill="var(--color-value)"
          fillOpacity={0.12}
          isAnimationActive={false}
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}

export function TrendChart({
  report,
  metric,
  onMetricChange,
}: {
  report: RequestReport
  metric: 'count' | 'amount'
  onMetricChange: (metric: 'count' | 'amount') => void
}) {
  const { t, i18n } = useTranslation(ns)
  const rtl = i18n.dir() === 'rtl'
  const amount = metric === 'amount'
  const config = {
    created: {
      label: t(amount ? 'requestedAmount' : 'created'),
      color: 'var(--chart-1)',
    },
    approved: {
      label: t(amount ? 'approvedAmount' : 'approved'),
      color: 'var(--chart-2)',
    },
    previous: { label: t('previous'), color: 'var(--chart-5)' },
  } satisfies ChartConfig
  const data = useMemo(
    () =>
      report.series.map((item) => ({
        period: item.period,
        created: amount ? item.amountMinor / 100 : item.created,
        approved: amount ? item.approvedAmountMinor / 100 : item.approved,
        previous:
          item.previousCreated === null
            ? null
            : amount
              ? (item.previousAmountMinor ?? 0) / 100
              : item.previousCreated,
      })),
    [report.series, amount],
  )
  const format = periodFormat(i18n.language, report.bucket)
  const value = (input: number) =>
    amount ? compactMoney(input * 100) : compactNumber(input)
  return (
    <Card className="min-w-0 md:col-span-2">
      <CardHeader>
        <CardTitle>{t('trend')}</CardTitle>
        <CardDescription>
          {t(amount ? 'trendAmountHint' : 'trendHint', {
            bucket: t(report.bucket),
          })}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={metric}
            onValueChange={(next) =>
              next && onMetricChange(next as 'count' | 'amount')
            }
            aria-label={t('metric')}
          >
            <ToggleGroupItem value="count" className="px-2.5">
              {t('metricCount')}
            </ToggleGroupItem>
            <ToggleGroupItem value="amount" className="px-2.5">
              {t('metricAmount')}
            </ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <ChartContainer
          config={config}
          className="aspect-auto h-56 w-full 2xl:h-64"
        >
          <ComposedChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
            <defs>
              {(['created', 'approved'] as const).map((key) => (
                <linearGradient
                  key={key}
                  id={`trend-${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={`var(--color-${key})`}
                    stopOpacity={0.28}
                  />
                  <stop
                    offset="95%"
                    stopColor={`var(--color-${key})`}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="period"
              reversed={rtl}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
              tickFormatter={(input: string) => format.format(new Date(input))}
            />
            <YAxis
              orientation={rtl ? 'right' : 'left'}
              tickLine={false}
              axisLine={false}
              width={amount ? 72 : 32}
              allowDecimals={false}
              tickFormatter={value}
            />
            <ChartTooltip
              cursor={{ stroke: 'var(--border)' }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(input) =>
                    format.format(new Date(String(input)))
                  }
                  formatter={(input, name) => (
                    <span className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {config[name as keyof typeof config]?.label}
                      </span>
                      <span className="font-mono font-medium tabular-nums">
                        {amount ? money(Number(input) * 100) : Number(input)}
                      </span>
                    </span>
                  )}
                />
              }
            />
            <Area
              dataKey="created"
              type="monotone"
              fill="url(#trend-created)"
              stroke="var(--color-created)"
              strokeWidth={2}
              animationDuration={500}
            />
            <Area
              dataKey="approved"
              type="monotone"
              fill="url(#trend-approved)"
              stroke="var(--color-approved)"
              strokeWidth={2}
              animationDuration={500}
            />
            {report.previous && (
              <Line
                dataKey="previous"
                type="monotone"
                stroke="var(--color-previous)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                animationDuration={500}
              />
            )}
            <ChartLegend content={<ChartLegendContent />} />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function StatusChart({ report }: { report: RequestReport }) {
  const { t } = useTranslation(ns)
  const config = {
    approved: { label: t('approved'), color: 'var(--success)' },
    pending: { label: t('pending'), color: 'var(--warning)' },
    draft: { label: t('draft'), color: 'var(--chart-5)' },
  } satisfies ChartConfig
  const data = (['approved', 'pending', 'draft'] as const).map((status) => ({
    status,
    value: report.byStatus[status],
    fill: config[status].color,
  }))
  const total = data.reduce((sum, item) => sum + item.value, 0)
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{t('byStatus')}</CardTitle>
        <CardDescription>{t('byStatusHint')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-4">
        <ChartContainer config={config} className="aspect-square h-40">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="status" />}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="status"
              innerRadius={54}
              outerRadius={76}
              strokeWidth={3}
              stroke="var(--card)"
              animationDuration={500}
            >
              {data.map((item) => (
                <Cell key={item.status} fill={item.fill} />
              ))}
              <Label
                content={({ viewBox }) =>
                  viewBox && 'cx' in viewBox ? (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-2xl font-semibold"
                      >
                        {compactNumber(total)}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 20}
                        className="fill-muted-foreground text-xs"
                      >
                        {t('requests')}
                      </tspan>
                    </text>
                  ) : null
                }
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <ul className="grid w-full gap-2 text-sm">
          {data.map((item) => (
            <li key={item.status} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full"
                style={{ background: item.fill }}
              />
              {config[item.status].label}
              <span className="ms-auto font-medium tabular-nums">
                {item.value}
              </span>
              <span className="w-10 text-end text-xs text-muted-foreground tabular-nums">
                {total ? percent(item.value / total) : '–'}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export function CategoryChart({
  report,
  onSelect,
}: {
  report: RequestReport
  onSelect: (category: string) => void
}) {
  const { t, i18n } = useTranslation(ns)
  const rtl = i18n.dir() === 'rtl'
  const data = report.breakdown.category
    .filter((item) => item.count > 0)
    .sort((a, b) => b.amountMinor - a.amountMinor)
    .map((item) => ({
      key: item.key,
      label: t(`requests:${item.key}`),
      amount: item.amountMinor / 100,
      approved: item.approvedAmountMinor / 100,
    }))
  const config = {
    amount: { label: t('requestedAmount'), color: 'var(--chart-1)' },
    approved: { label: t('approvedAmount'), color: 'var(--chart-2)' },
  } satisfies ChartConfig
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{t('byCategory')}</CardTitle>
        <CardDescription>{t('byCategoryHint')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          className="aspect-auto h-52 w-full 2xl:h-60"
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 0, right: 12 }}
            barGap={2}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="label"
              type="category"
              orientation={rtl ? 'right' : 'left'}
              tickLine={false}
              axisLine={false}
              width={88}
            />
            <XAxis
              type="number"
              reversed={rtl}
              tickLine={false}
              axisLine={false}
              tickFormatter={(input: number) => compactMoney(input * 100)}
            />
            <ChartTooltip
              cursor={{ fill: 'var(--muted)' }}
              content={
                <ChartTooltipContent
                  formatter={(input, name) => (
                    <span className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {config[name as keyof typeof config]?.label}
                      </span>
                      <span className="font-mono font-medium tabular-nums">
                        {money(Number(input) * 100)}
                      </span>
                    </span>
                  )}
                />
              }
            />
            <Bar
              dataKey="amount"
              fill="var(--color-amount)"
              radius={4}
              className="cursor-pointer"
              onClick={(_, index) => onSelect(data[index]!.key)}
              animationDuration={500}
            />
            <Bar
              dataKey="approved"
              fill="var(--color-approved)"
              radius={4}
              className="cursor-pointer"
              onClick={(_, index) => onSelect(data[index]!.key)}
              animationDuration={500}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function TopRequesters({
  report,
  onSelect,
}: {
  report: RequestReport
  onSelect: (owner: string) => void
}) {
  const { t } = useTranslation(ns)
  const rows = [...report.breakdown.owner]
    .sort((a, b) => b.amountMinor - a.amountMinor)
    .slice(0, 6)
  const max = Math.max(1, ...rows.map((row) => row.amountMinor))
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{t('topRequesters')}</CardTitle>
        <CardDescription>{t('topRequestersHint')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-1">
          {rows.map((row) => (
            <li key={row.key}>
              <button
                type="button"
                onClick={() => onSelect(row.key)}
                className="grid w-full gap-1.5 rounded-md px-2 py-1.5 text-start transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span className="flex items-baseline justify-between gap-3 text-sm">
                  <bdi className="truncate font-medium">{row.label}</bdi>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    <bdi>{compactMoney(row.amountMinor)}</bdi> · {row.count}
                  </span>
                </span>
                <Progress
                  value={(row.amountMinor / max) * 100}
                  aria-label={row.label}
                  className="h-1.5"
                />
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
