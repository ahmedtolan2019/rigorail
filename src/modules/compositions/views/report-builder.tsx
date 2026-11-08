import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BarChart3,
  Info,
  LineChart as LineIcon,
  PieChart as PieIcon,
  Save,
  Table2,
  Trash2,
} from 'lucide-react'
import { usePersistentState } from '@/shared/hooks/use-persistent-state'
import { compactMoney, money } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart'
import { Checkbox } from '@/shared/ui/checkbox'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { ns } from '../messages'
import { registerCopy } from '../example-utils'

registerCopy({
  rbSource: [
    'Source: purchase requests, this year',
    'المصدر: طلبات الشراء، هذا العام',
  ],
  rbGroupBy: ['Group by', 'التجميع حسب'],
  rbMeasure: ['Measure', 'المقياس'],
  rbSum: ['Total amount', 'إجمالي المبلغ'],
  rbCount: ['Number of requests', 'عدد الطلبات'],
  rbAverage: ['Average amount', 'متوسط المبلغ'],
  rbChart: ['Chart', 'الرسم'],
  rbBar: ['Bar chart', 'أعمدة'],
  rbLine: ['Line chart', 'خطي'],
  rbPie: ['Pie chart', 'دائري'],
  rbTable: ['Table only', 'جدول فقط'],
  rbStatuses: ['Include statuses', 'الحالات المشمولة'],
  rbColumns: ['Table columns', 'أعمدة الجدول'],
  rbCategory: ['Category', 'الفئة'],
  rbDepartment: ['Department', 'الإدارة'],
  rbStatus: ['Status', 'الحالة'],
  rbMonth: ['Month', 'الشهر'],
  rbShare: ['Share', 'النسبة'],
  rbRequests: ['Requests', 'الطلبات'],
  rbDraft: ['Draft', 'مسودة'],
  rbSubmitted: ['Submitted', 'مُرسل'],
  rbApproved: ['Approved', 'معتمد'],
  rbRejected: ['Returned', 'مُعاد'],
  rbName: ['Report name', 'اسم التقرير'],
  rbNameError: ['Name the report to save it.', 'سمِّ التقرير لحفظه.'],
  rbSave: ['Save report', 'حفظ التقرير'],
  rbSaved: ['"{{name}}" saved.', 'تم حفظ "{{name}}".'],
  rbUpdated: ['"{{name}}" updated.', 'تم تحديث "{{name}}".'],
  rbSavedReports: ['Saved reports', 'التقارير المحفوظة'],
  rbNoSaved: [
    'Saved reports appear here, on this device.',
    'تظهر التقارير المحفوظة هنا على هذا الجهاز.',
  ],
  rbDeleteSaved: ['Delete {{name}}', 'حذف {{name}}'],
  rbLineHint: [
    'Line charts read best over time. Group by month to show a trend.',
    'الرسم الخطي أوضح عبر الزمن. جمّع حسب الشهر لإظهار الاتجاه.',
  ],
  rbPieHint: [
    'Pie charts compare a few parts of a whole. Use bars for more than 5 groups.',
    'الرسم الدائري لمقارنة أجزاء قليلة من كل. استخدم الأعمدة لأكثر من 5 مجموعات.',
  ],
  rbNoData: [
    'No requests match. Include at least one status.',
    'لا طلبات مطابقة. اشمل حالة واحدة على الأقل.',
  ],
  rbTotal: ['Total', 'الإجمالي'],
  rbPreview: ['Live preview', 'معاينة مباشرة'],
})

const statuses = ['draft', 'submitted', 'approved', 'rejected'] as const
type Status = (typeof statuses)[number]
type Dimension = 'category' | 'department' | 'status' | 'month'
type Measure = 'sum' | 'count' | 'average'
type ChartKind = 'bar' | 'line' | 'pie' | 'table'
interface Row {
  category: string
  department: string
  status: Status
  month: number
  amount: number
}
const categories = ['Hardware', 'Software', 'Services', 'Travel', 'Facilities']
const departments = ['Operations', 'Finance', 'Engineering', 'Sales']
const data: Row[] = (() => {
  let seed = 3
  const random = () => (seed = (seed * 16_807) % 2_147_483_647) / 2_147_483_647
  return Array.from({ length: 160 }, () => ({
    category: categories[Math.floor(random() * categories.length)]!,
    department: departments[Math.floor(random() * departments.length)]!,
    status: statuses[Math.min(3, Math.floor(random() * 4.4))]!,
    month: Math.floor(random() * 10),
    amount: Math.round((200 + random() * 9_800) * 100),
  }))
})()
const statusKey = {
  draft: 'rbDraft',
  submitted: 'rbSubmitted',
  approved: 'rbApproved',
  rejected: 'rbRejected',
} as const
const dimensionKey = {
  category: 'rbCategory',
  department: 'rbDepartment',
  status: 'rbStatus',
  month: 'rbMonth',
} as const
interface Config {
  name: string
  groupBy: Dimension
  measure: Measure
  chart: ChartKind
  statuses: Status[]
  columns: ('count' | 'measure' | 'share')[]
}
const initial: Config = {
  name: '',
  groupBy: 'category',
  measure: 'sum',
  chart: 'bar',
  statuses: ['submitted', 'approved'],
  columns: ['count', 'measure', 'share'],
}
const palette = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export default function ReportBuilder() {
  const { t, i18n } = useTranslation(ns)
  const [config, setConfig] = useState(initial)
  const [error, setError] = useState(false)
  const [saved, setSaved] = usePersistentState<Config[]>(
    'compositions:saved-reports',
    [],
  )
  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    setConfig((current) => ({ ...current, [key]: value }))
  const monthName = (month: number) =>
    new Intl.DateTimeFormat(i18n.language, { month: 'short' }).format(
      new Date(new Date().getFullYear(), month, 1),
    )
  const label = (dimension: Dimension, value: string | number) =>
    dimension === 'month'
      ? monthName(Number(value))
      : dimension === 'status'
        ? t(statusKey[value as Status])
        : String(value)

  const groups = useMemo(() => {
    const rows = data.filter((row) => config.statuses.includes(row.status))
    const map = new Map<string | number, Row[]>()
    for (const row of rows)
      map.set(row[config.groupBy], [
        ...(map.get(row[config.groupBy]) ?? []),
        row,
      ])
    const result = [...map.entries()].map(([key, list]) => {
      const sum = list.reduce((total, row) => total + row.amount, 0)
      const value =
        config.measure === 'sum'
          ? sum
          : config.measure === 'count'
            ? list.length
            : Math.round(sum / list.length)
      return { key, count: list.length, value }
    })
    // Months keep calendar order; other dimensions rank by the measure.
    return config.groupBy === 'month'
      ? result.sort((a, b) => Number(a.key) - Number(b.key))
      : result.sort((a, b) => b.value - a.value)
  }, [config.statuses, config.groupBy, config.measure])
  const total = groups.reduce((sum, group) => sum + group.value, 0)
  const format = (value: number) =>
    config.measure === 'count'
      ? new Intl.NumberFormat(i18n.language).format(value)
      : money(value)
  const short = (value: number) =>
    config.measure === 'count' ? String(value) : compactMoney(value)
  const chartData = groups.map((group) => ({
    name: label(config.groupBy, group.key),
    value: group.value,
  }))
  const measureLabel = t(
    config.measure === 'sum'
      ? 'rbSum'
      : config.measure === 'count'
        ? 'rbCount'
        : 'rbAverage',
  )
  const chartConfig = {
    value: { label: measureLabel, color: 'var(--chart-1)' },
  } satisfies ChartConfig
  const advice =
    config.chart === 'line' && config.groupBy !== 'month'
      ? t('rbLineHint')
      : config.chart === 'pie' && groups.length > 5
        ? t('rbPieHint')
        : null

  const save = () => {
    const name = config.name.trim()
    if (!name) {
      setError(true)
      return
    }
    const exists = saved.some((report) => report.name === name)
    setSaved((list) => [
      { ...config, name },
      ...list.filter((report) => report.name !== name),
    ])
    toast.success(t(exists ? 'rbUpdated' : 'rbSaved', { name }))
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-4">
      <Card className="gap-5 px-4 py-4 lg:self-start">
        <p className="text-xs text-muted-foreground">{t('rbSource')}</p>
        <div className="grid gap-1.5">
          <Label id="rb-group">{t('rbGroupBy')}</Label>
          <Select
            value={config.groupBy}
            onValueChange={(value) => set('groupBy', value as Dimension)}
          >
            <SelectTrigger aria-labelledby="rb-group" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(dimensionKey) as Dimension[]).map((dimension) => (
                <SelectItem key={dimension} value={dimension}>
                  {t(dimensionKey[dimension])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label id="rb-measure">{t('rbMeasure')}</Label>
          <Select
            value={config.measure}
            onValueChange={(value) => set('measure', value as Measure)}
          >
            <SelectTrigger aria-labelledby="rb-measure" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sum">{t('rbSum')}</SelectItem>
              <SelectItem value="count">{t('rbCount')}</SelectItem>
              <SelectItem value="average">{t('rbAverage')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label id="rb-chart">{t('rbChart')}</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={config.chart}
            onValueChange={(value) => value && set('chart', value as ChartKind)}
            aria-labelledby="rb-chart"
            className="w-full"
          >
            {(
              [
                ['bar', BarChart3, 'rbBar'],
                ['line', LineIcon, 'rbLine'],
                ['pie', PieIcon, 'rbPie'],
                ['table', Table2, 'rbTable'],
              ] as const
            ).map(([value, Icon, key]) => (
              <ToggleGroupItem
                key={value}
                value={value}
                aria-label={t(key)}
                title={t(key)}
                className="flex-1"
              >
                <Icon />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">
            {t('rbStatuses')}
          </legend>
          {statuses.map((status) => (
            <Label key={status} className="flex items-center gap-2 font-normal">
              <Checkbox
                checked={config.statuses.includes(status)}
                onCheckedChange={(on) =>
                  set(
                    'statuses',
                    on
                      ? [...config.statuses, status]
                      : config.statuses.filter((item) => item !== status),
                  )
                }
              />
              {t(statusKey[status])}
            </Label>
          ))}
        </fieldset>
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">{t('rbColumns')}</legend>
          {(
            [
              ['count', 'rbRequests'],
              ['measure', 'rbMeasure'],
              ['share', 'rbShare'],
            ] as const
          ).map(([column, key]) => (
            <Label key={column} className="flex items-center gap-2 font-normal">
              <Checkbox
                checked={config.columns.includes(column)}
                onCheckedChange={(on) =>
                  set(
                    'columns',
                    on
                      ? [...config.columns, column]
                      : config.columns.filter((item) => item !== column),
                  )
                }
              />
              {t(key)}
            </Label>
          ))}
        </fieldset>
      </Card>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 lg:gap-4">
        <Card className="gap-3 px-4 py-3">
          <div className="flex flex-wrap items-start gap-2">
            <div className="grid min-w-48 flex-1 gap-1">
              <Input
                value={config.name}
                aria-label={t('rbName')}
                placeholder={t('rbName')}
                aria-invalid={error || undefined}
                aria-describedby={error ? 'rb-name-error' : undefined}
                onChange={(event) => {
                  set('name', event.target.value)
                  if (event.target.value.trim()) setError(false)
                }}
              />
              {error && (
                <p
                  id="rb-name-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {t('rbNameError')}
                </p>
              )}
            </div>
            <Button onClick={save}>
              <Save data-icon="inline-start" />
              {t('rbSave')}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="me-1 text-xs text-muted-foreground">
              {t('rbSavedReports')}:
            </span>
            {saved.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                {t('rbNoSaved')}
              </span>
            ) : (
              saved.map((report) => (
                <span
                  key={report.name}
                  className={cn(
                    'flex items-center rounded-full border text-xs',
                    report.name === config.name &&
                      'border-primary bg-primary/5',
                  )}
                >
                  <button
                    type="button"
                    className="py-1 ps-2.5 pe-1.5 font-medium"
                    onClick={() => setConfig(report)}
                  >
                    {report.name}
                  </button>
                  <button
                    type="button"
                    aria-label={t('rbDeleteSaved', { name: report.name })}
                    className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() =>
                      setSaved((list) =>
                        list.filter((item) => item.name !== report.name),
                      )
                    }
                  >
                    <Trash2 className="size-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </Card>

        <Card className="min-w-0 gap-3 px-4 py-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold">
              {measureLabel} · {t(dimensionKey[config.groupBy])}
            </h3>
            <span className="text-xs text-muted-foreground">
              {t('rbPreview')}
            </span>
          </div>
          {advice && (
            <p
              role="status"
              className="flex items-start gap-2 rounded-md bg-info/10 px-3 py-2 text-xs text-info"
            >
              <Info aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              {advice}
            </p>
          )}
          {groups.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              {t('rbNoData')}
            </p>
          ) : (
            <>
              {config.chart !== 'table' && (
                <ChartContainer
                  config={chartConfig}
                  className="aspect-auto h-64 w-full"
                >
                  {config.chart === 'pie' ? (
                    <PieChart>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            hideLabel
                            formatter={(value, name) =>
                              `${name}: ${format(Number(value))}`
                            }
                          />
                        }
                      />
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="55%"
                        outerRadius="85%"
                        paddingAngle={2}
                        isAnimationActive={false}
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={palette[index % palette.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  ) : config.chart === 'line' ? (
                    <LineChart
                      data={chartData}
                      margin={{ left: 4, right: 16, top: 8 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        interval={0}
                      />
                      <YAxis
                        width={56}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={short}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) => format(Number(value))}
                          />
                        }
                      />
                      <Line
                        dataKey="value"
                        stroke="var(--color-value)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  ) : (
                    <BarChart
                      data={chartData}
                      margin={{ left: 4, right: 16, top: 8 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        interval={0}
                      />
                      <YAxis
                        width={56}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={short}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) => format(Number(value))}
                          />
                        }
                      />
                      <Bar
                        dataKey="value"
                        fill="var(--color-value)"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  )}
                </ChartContainer>
              )}
              {/* Focusable so keyboard users can scroll it on narrow screens. */}
              <div className="relative overflow-x-auto rounded-lg border" role="region" tabIndex={0} aria-label={t('rbPreview')}>
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium">
                        {t(dimensionKey[config.groupBy])}
                      </th>
                      {config.columns.includes('count') && (
                        <th className="px-3 py-2 text-end font-medium">
                          {t('rbRequests')}
                        </th>
                      )}
                      {config.columns.includes('measure') && (
                        <th className="px-3 py-2 text-end font-medium">
                          {measureLabel}
                        </th>
                      )}
                      {config.columns.includes('share') &&
                        config.measure !== 'average' && (
                          <th className="w-40 px-3 py-2 text-start font-medium">
                            {t('rbShare')}
                          </th>
                        )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {groups.map((group, index) => (
                      <tr key={group.key}>
                        <td className="px-3 py-2">
                          <span className="flex items-center gap-2">
                            {config.chart === 'pie' && (
                              <span
                                className="size-2.5 rounded-sm"
                                style={{
                                  background: palette[index % palette.length],
                                }}
                              />
                            )}
                            {label(config.groupBy, group.key)}
                          </span>
                        </td>
                        {config.columns.includes('count') && (
                          <td className="px-3 py-2 text-end tabular-nums">
                            {group.count}
                          </td>
                        )}
                        {config.columns.includes('measure') && (
                          <td className="px-3 py-2 text-end font-medium tabular-nums">
                            <bdi>{format(group.value)}</bdi>
                          </td>
                        )}
                        {config.columns.includes('share') &&
                          config.measure !== 'average' && (
                            <td className="px-3 py-2">
                              <span className="flex items-center gap-2">
                                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                  <span
                                    className="block h-full rounded-full bg-primary/70"
                                    style={{
                                      width: `${(group.value / total) * 100}%`,
                                    }}
                                  />
                                </span>
                                <span className="w-10 text-end text-xs tabular-nums">
                                  {Math.round((group.value / total) * 100)}%
                                </span>
                              </span>
                            </td>
                          )}
                      </tr>
                    ))}
                  </tbody>
                  {config.measure !== 'average' && (
                    <tfoot className="border-t-2 bg-muted/30 font-semibold">
                      <tr>
                        <td className="px-3 py-2">{t('rbTotal')}</td>
                        {config.columns.includes('count') && (
                          <td className="px-3 py-2 text-end tabular-nums">
                            {groups.reduce(
                              (sum, group) => sum + group.count,
                              0,
                            )}
                          </td>
                        )}
                        {config.columns.includes('measure') && (
                          <td className="px-3 py-2 text-end tabular-nums">
                            <bdi>{format(total)}</bdi>
                          </td>
                        )}
                        {config.columns.includes('share') && <td />}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
