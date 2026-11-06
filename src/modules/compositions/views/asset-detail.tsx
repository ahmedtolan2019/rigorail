import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowLeftRight,
  CalendarPlus,
  Forklift,
  Trash2,
  Wrench,
} from 'lucide-react'
import { compactMoney, date, money } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart'
import { ConfirmAction } from '@/shared/ui/confirm-action'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { ns } from '../messages'
import { registerCopy } from '../example-utils'
import { Metric, RecordHeader, Stepper } from '../sections/record'

registerCopy({
  adName: ['Forklift FL-35 Electric', 'رافعة شوكية FL-35 كهربائية'],
  adMeta: [
    'Asset AST-0412 · Jeddah depot · Serial XF-88213',
    'الأصل AST-0412 · مستودع جدة · الرقم التسلسلي XF-88213',
  ],
  adInService: ['In service', 'في الخدمة'],
  adDisposal: ['Disposal planned', 'الاستبعاد مخطط'],
  adLifecycle: ['Asset lifecycle', 'دورة حياة الأصل'],
  adAcquired: ['Acquired', 'الاقتناء'],
  adCommissioned: ['Commissioned', 'التشغيل'],
  adService: ['In service', 'في الخدمة'],
  adMidLife: ['Mid-life overhaul', 'إصلاح منتصف العمر'],
  adRetire: ['Retirement', 'الإحلال'],
  adBookValue: ['Book value', 'القيمة الدفترية'],
  adBookHint: [
    '{{percent}} of cost after {{years}} years',
    '{{percent}} من التكلفة بعد {{years}} سنوات',
  ],
  adNextService: ['Next service', 'الصيانة التالية'],
  adInDays: ['In {{count}} days', 'خلال {{count}} أيام'],
  adUptime: ['Uptime, 12 weeks', 'زمن التشغيل، 12 أسبوعًا'],
  adCostToDate: ['Maintenance cost to date', 'تكلفة الصيانة حتى الآن'],
  adCostHint: ['{{percent}} of purchase price', '{{percent}} من سعر الشراء'],
  adDepreciation: ['Depreciation', 'الإهلاك'],
  adDepreciationHint: [
    'Straight line over 8 years to a residual value of 10%',
    'قسط ثابت على 8 سنوات حتى قيمة متبقية 10%',
  ],
  adToday: ['Today', 'اليوم'],
  adUtilisation: ['Utilisation', 'الاستخدام'],
  adUtilisationHint: [
    'Hours used per week. Darker is busier.',
    'ساعات الاستخدام أسبوعيًا. الأغمق أكثر استخدامًا.',
  ],
  adHoursWeek: ['{{value}} h', '{{value}} س'],
  adMaintenance: ['Maintenance', 'الصيانة'],
  adPlanned: ['Planned', 'مخطط'],
  adDone: ['Completed', 'منجز'],
  adSchedule: ['Schedule service', 'جدولة صيانة'],
  adScheduled: [
    'Service booked for {{date}}.',
    'تم حجز الصيانة بتاريخ {{date}}.',
  ],
  adTransfer: ['Transfer', 'نقل'],
  adTransferTo: ['Transfer to', 'نقل إلى'],
  adTransferred: [
    'Transfer to {{place}} requested.',
    'تم طلب النقل إلى {{place}}.',
  ],
  adDispose: ['Plan disposal', 'تخطيط الاستبعاد'],
  adDisposeTitle: ['Plan disposal of AST-0412?', 'تخطيط استبعاد AST-0412؟'],
  adDisposeHint: [
    'Finance is asked to approve a write-off of the remaining book value. The asset stays in service until approved.',
    'يُطلب من المالية اعتماد شطب القيمة الدفترية المتبقية. يبقى الأصل في الخدمة حتى الاعتماد.',
  ],
  adDisposePlanned: [
    'Disposal sent to Finance for approval.',
    'أُرسل الاستبعاد للمالية للاعتماد.',
  ],
  adSpecs: ['Specification', 'المواصفات'],
  adOfCost: ['{{percent}} of cost', '{{percent}} من التكلفة'],
  adCapacity: ['Capacity', 'الحمولة'],
  adBattery: ['Battery health', 'صحة البطارية'],
  adOperator: ['Assigned operator', 'المشغل المسؤول'],
  adWarranty: ['Warranty', 'الضمان'],
  adWarrantyLeft: ['Until {{date}}', 'حتى {{date}}'],
})

const day = 86_400_000
const COST = 7_800_000
const RESIDUAL = 0.1
const LIFE = 8
const AGE = 3.4
const startYear = new Date().getFullYear() - 3
const curve = Array.from({ length: LIFE + 1 }, (_, year) => ({
  year: String(startYear + year),
  value: Math.round(COST - ((COST * (1 - RESIDUAL)) / LIFE) * year),
}))
const book = Math.round(COST - ((COST * (1 - RESIDUAL)) / LIFE) * AGE)
const hours = [31, 34, 38, 22, 0, 12, 36, 39, 41, 37, 40, 35]
const services = [
  {
    title: 'Battery and charger inspection',
    days: 18,
    done: false,
    cost: 45_000,
  },
  { title: 'Hydraulic hose replacement', days: -64, done: true, cost: 138_000 },
  {
    title: 'Annual safety certification',
    days: -170,
    done: true,
    cost: 62_000,
  },
  { title: 'Mast chain lubrication', days: -260, done: true, cost: 18_500 },
]
const places = ['Riyadh HQ', 'Dammam yard', 'Dubai office']

export default function AssetDetail() {
  const { t, i18n } = useTranslation(ns)
  const [disposal, setDisposal] = useState(false)
  const [next, setNext] = useState(services[0]!.days)
  const percent = (value: number) =>
    new Intl.NumberFormat(i18n.language, { style: 'percent' }).format(value)
  const spent = services
    .filter((entry) => entry.done)
    .reduce((sum, entry) => sum + entry.cost, 0)
  const config = {
    value: { label: t('adBookValue'), color: 'var(--chart-1)' },
  } satisfies ChartConfig
  const uptime = hours.filter((value) => value > 0).length / hours.length

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:gap-4">
      <RecordHeader
        leading={
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"
          >
            <Forklift className="size-5" />
          </span>
        }
        title={t('adName')}
        badges={
          <Badge
            variant="secondary"
            className={cn(
              'rounded-full border-0',
              disposal
                ? 'bg-warning/12 text-warning'
                : 'bg-success/12 text-success',
            )}
          >
            {disposal ? t('adDisposal') : t('adInService')}
          </Badge>
        }
        meta={t('adMeta')}
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-none">
                  <ArrowLeftRight data-icon="inline-start" />
                  {t('adTransfer')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('adTransferTo')}</DropdownMenuLabel>
                {places.map((place) => (
                  <DropdownMenuItem
                    key={place}
                    onClick={() => toast.success(t('adTransferred', { place }))}
                  >
                    {place}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {!disposal && (
              <ConfirmAction
                tone="destructive"
                icon={Trash2}
                title={t('adDisposeTitle')}
                description={t('adDisposeHint')}
                details={[
                  [t('adBookValue'), <bdi key="book">{money(book)}</bdi>],
                ]}
                confirmLabel={t('adDispose')}
                onConfirm={() => {
                  setDisposal(true)
                  toast(t('adDisposePlanned'))
                }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 text-muted-foreground"
                  aria-label={t('adDispose')}
                >
                  <Trash2 />
                </Button>
              </ConfirmAction>
            )}
          </>
        }
      >
        <Stepper
          label={t('adLifecycle')}
          steps={[
            { label: t('adAcquired'), meta: String(startYear), state: 'done' },
            {
              label: t('adCommissioned'),
              meta: String(startYear),
              state: 'done',
            },
            {
              label: t('adService'),
              meta: t('adBookHint', {
                percent: percent(book / COST),
                years: AGE,
              }),
              state: 'current',
            },
            {
              label: t('adMidLife'),
              meta: String(startYear + 4),
              state: 'upcoming',
            },
            {
              label: t('adRetire'),
              meta: String(startYear + LIFE),
              state: disposal ? 'current' : 'upcoming',
            },
          ]}
        />
      </RecordHeader>

      <Card className="grid grid-cols-2 gap-x-6 gap-y-5 px-5 py-4 lg:grid-cols-4">
        <Metric
          label={t('adBookValue')}
          value={<bdi>{money(book)}</bdi>}
          hint={t('adOfCost', { percent: percent(book / COST) })}
        />
        <Metric
          label={t('adNextService')}
          value={t('adInDays', { count: next })}
          hint={date(new Date(Date.now() + next * day).toISOString())}
          hintTone={next <= 21 ? 'warning' : 'muted'}
        />
        <Metric label={t('adUptime')} value={percent(uptime)}>
          <div className="flex h-6 items-end gap-0.5" aria-hidden="true">
            {hours.map((value, index) => (
              <span
                key={index}
                className={cn(
                  'flex-1 rounded-sm',
                  value ? 'bg-success/70' : 'bg-destructive/60',
                )}
                style={{ height: `${Math.max(value / 41, 0.15) * 100}%` }}
              />
            ))}
          </div>
        </Metric>
        <Metric
          label={t('adCostToDate')}
          value={<bdi>{compactMoney(spent)}</bdi>}
          hint={t('adCostHint', { percent: percent(spent / COST) })}
        />
      </Card>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-3 lg:gap-4">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 lg:col-span-2 lg:gap-4">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>{t('adDepreciation')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('adDepreciationHint')}
              </p>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={config}
                className="aspect-auto h-48 w-full"
              >
                <AreaChart data={curve} margin={{ left: 4, right: 16, top: 8 }}>
                  <defs>
                    <linearGradient id="asset-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="var(--color-value)"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-value)"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="year"
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
                  <ReferenceLine
                    x={String(startYear + 3)}
                    stroke="var(--destructive)"
                    strokeDasharray="3 3"
                    label={{
                      value: t('adToday'),
                      position: 'insideTopRight',
                      fill: 'var(--destructive)',
                      fontSize: 11,
                    }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => (
                          <bdi className="font-medium tabular-nums">
                            {money(Number(value))}
                          </bdi>
                        )}
                      />
                    }
                  />
                  <Area
                    dataKey="value"
                    type="linear"
                    stroke="var(--color-value)"
                    fill="url(#asset-fill)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('adUtilisation')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('adUtilisationHint')}
              </p>
            </CardHeader>
            <CardContent>
              {/* Max intensity per mode keeps the cell text at 4.5:1 or better. */}
              <ul
                className="grid grid-cols-12 gap-1 [--heat:65%] dark:[--heat:35%]"
                style={{ direction: 'ltr' }}
              >
                {hours.map((value, index) => (
                  <li
                    key={index}
                    title={t('adHoursWeek', { value })}
                    aria-label={t('adHoursWeek', { value })}
                    className="grid h-10 place-items-center rounded-md text-[0.625rem] font-medium tabular-nums"
                    style={{
                      background: value
                        ? `color-mix(in oklch, var(--primary) calc(var(--heat) * ${(value / 41).toFixed(3)} + 10%), transparent)`
                        : 'repeating-linear-gradient(135deg, transparent 0 4px, var(--border) 4px 5px)',
                    }}
                  >
                    {value}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                {t('adSpecs')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {(
                  [
                    [t('adCapacity'), '3,500 kg', ''],
                    [t('adBattery'), '78%', 'text-warning'],
                    [t('adOperator'), 'Yusuf Rahman', ''],
                    [
                      t('adWarranty'),
                      t('adWarrantyLeft', {
                        date: date(
                          new Date(Date.now() + 210 * day).toISOString(),
                        ),
                      }),
                      '',
                    ],
                  ] as const
                ).map(([label, value, tone]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className={cn('font-medium break-words', tone)}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 lg:gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('adMaintenance')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <ol className="relative grid gap-4 before:absolute before:inset-y-1 before:start-[0.4375rem] before:w-px before:bg-border">
                {services.map((entry, index) => {
                  const days = index === 0 ? next : entry.days
                  return (
                    <li key={entry.title} className="relative flex gap-3">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'relative mt-1 size-3.5 shrink-0 rounded-full border-2 bg-card',
                          entry.done
                            ? 'border-success bg-success'
                            : 'border-warning',
                        )}
                      />
                      <div className="min-w-0 text-sm">
                        <p className="font-medium">{entry.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.done ? t('adDone') : t('adPlanned')} ·{' '}
                          {date(
                            new Date(Date.now() + days * day).toISOString(),
                          )}{' '}
                          · <bdi>{money(entry.cost)}</bdi>
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNext(7)
                  toast.success(
                    t('adScheduled', {
                      date: date(new Date(Date.now() + 7 * day).toISOString()),
                    }),
                  )
                }}
              >
                <CalendarPlus data-icon="inline-start" />
                {t('adSchedule')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
