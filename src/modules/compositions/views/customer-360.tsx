import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Building2,
  CalendarCheck,
  CircleAlert,
  FileText,
  Lock,
  LockOpen,
  Mail,
  Phone,
  Plus,
  ReceiptText,
  StickyNote,
  type LucideIcon,
} from 'lucide-react'
import { compactMoney, money, relativeDate } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { ConfirmAction } from '@/shared/ui/confirm-action'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { ns } from '../messages'
import { registerCopy } from '../example-utils'
import {
  BudgetBar,
  Metric,
  RecordHeader,
  RelatedRecord,
  Sparkline,
} from '../sections/record'

registerCopy({
  cxMeta: [
    'Customer CUS-0088 · Enterprise · Riyadh · Account owner Sam Taylor',
    'العميل CUS-0088 · مؤسسات · الرياض · مسؤول الحساب Sam Taylor',
  ],
  cxActive: ['Active', 'نشط'],
  cxOnHold: ['Credit hold', 'إيقاف ائتماني'],
  cxLog: ['Log activity', 'تسجيل نشاط'],
  cxCall: ['Call', 'مكالمة'],
  cxMeeting: ['Meeting', 'اجتماع'],
  cxNote: ['Note', 'ملاحظة'],
  cxLogged: [
    '{{kind}} logged on the account.',
    'تم تسجيل {{kind}} على الحساب.',
  ],
  cxHold: ['Place credit hold', 'إيقاف الائتمان'],
  cxRelease: ['Release credit hold', 'رفع إيقاف الائتمان'],
  cxHoldTitle: [
    'Place Adatum Software on credit hold?',
    'إيقاف ائتمان Adatum Software؟',
  ],
  cxHoldHint: [
    'New orders are blocked until Finance releases the hold. Open orders continue.',
    'تُمنع الطلبات الجديدة حتى ترفع المالية الإيقاف. تستمر الطلبات المفتوحة.',
  ],
  cxHeld: ['Credit hold placed.', 'تم إيقاف الائتمان.'],
  cxReleased: ['Credit hold released.', 'تم رفع إيقاف الائتمان.'],
  cxHealth: ['Account health', 'صحة الحساب'],
  cxHealthGood: ['Healthy, watch payments', 'جيدة، مع متابعة السداد'],
  cxRevenue: ['Revenue, 12 months', 'الإيراد، 12 شهرًا'],
  cxRevenueUp: ['Up 14% on last year', 'ارتفاع 14% عن العام الماضي'],
  cxRevenueTrend: [
    'Monthly revenue, last 12 months',
    'الإيراد الشهري آخر 12 شهرًا',
  ],
  cxOutstanding: ['Outstanding', 'المستحق'],
  cxOverdueShare: ['{{value}} overdue', '{{value}} متأخر'],
  cxCredit: ['Credit used', 'الائتمان المستخدم'],
  cxCreditHint: ['of {{limit}} limit', 'من حد {{limit}}'],
  cxFactors: ['What drives the score', 'ما يحدد الدرجة'],
  cxFactorUsage: ['Product usage', 'استخدام المنتج'],
  cxFactorPayments: ['Payment behaviour', 'سلوك السداد'],
  cxFactorSupport: ['Support tickets', 'تذاكر الدعم'],
  cxFactorGrowth: ['Order growth', 'نمو الطلبات'],
  cxAging: ['Receivables aging', 'أعمار الذمم'],
  cxAgingHint: [
    'Unpaid invoices by days past due',
    'الفواتير غير المسددة حسب أيام التأخير',
  ],
  cxCurrent: ['Not due', 'غير مستحق'],
  cxDays30: ['1-30 days', '1-30 يومًا'],
  cxDays60: ['31-60 days', '31-60 يومًا'],
  cxDays90: ['Over 60 days', 'أكثر من 60 يومًا'],
  cxOpenItems: ['Open items', 'البنود المفتوحة'],
  cxQuote: ['Renewal quote', 'عرض التجديد'],
  cxOrder: ['Sales order', 'أمر البيع'],
  cxInvoice: ['Overdue invoice', 'فاتورة متأخرة'],
  cxSent: ['Sent', 'مُرسل'],
  cxShipping: ['Shipping', 'قيد الشحن'],
  cxOverdueDays: ['45 days late', 'متأخرة 45 يومًا'],
  cxContacts: ['Contacts', 'جهات الاتصال'],
  cxDecision: ['Decision maker', 'صاحب القرار'],
  cxBilling: ['Billing', 'الفوترة'],
  cxChampion: ['Champion', 'داعم داخلي'],
  cxTimeline: ['Recent interactions', 'آخر التفاعلات'],
  cxRiskTitle: [
    'One invoice is 45 days overdue',
    'فاتورة واحدة متأخرة 45 يومًا',
  ],
  cxRiskHint: [
    'INV-3188 for $8,400.00. Agree a payment date before approving new orders.',
    'INV-3188 بمبلغ 8,400.00$. اتفق على موعد سداد قبل اعتماد طلبات جديدة.',
  ],
})

const revenue = [118, 124, 131, 122, 140, 152, 149, 158, 166, 171, 169, 182]
const aging = { current: 2_640_000, d30: 1_120_000, d60: 0, d90: 840_000 }
const LIMIT = 6_000_000
const factors = [
  { key: 'cxFactorUsage', score: 0.86 },
  { key: 'cxFactorPayments', score: 0.52 },
  { key: 'cxFactorSupport', score: 0.74 },
  { key: 'cxFactorGrowth', score: 0.91 },
]
const contacts = [
  {
    name: 'Huda Saleh',
    role: 'cxDecision',
    email: 'huda.saleh@adatum.example',
  },
  { name: 'Karim Aziz', role: 'cxBilling', email: 'ar@adatum.example' },
  {
    name: 'Mona Fahad',
    role: 'cxChampion',
    email: 'mona.fahad@adatum.example',
  },
]
interface Interaction {
  icon: LucideIcon
  kind: string
  text: string
  who: string
  hours: number
}
const seed: Interaction[] = [
  {
    icon: Mail,
    kind: 'email',
    text: 'Sent renewal quote QUO-5521 for 2027.',
    who: 'Sam Taylor',
    hours: 20,
  },
  {
    icon: Phone,
    kind: 'call',
    text: 'Karim confirmed INV-3188 is waiting on their internal approval.',
    who: 'Chen Wei',
    hours: 52,
  },
  {
    icon: CalendarCheck,
    kind: 'meeting',
    text: 'Quarterly review with Huda. Expanding to the Dammam site.',
    who: 'Sam Taylor',
    hours: 170,
  },
]
const kinds: { key: string; icon: LucideIcon }[] = [
  { key: 'cxCall', icon: Phone },
  { key: 'cxMeeting', icon: CalendarCheck },
  { key: 'cxNote', icon: StickyNote },
]

export default function Customer360() {
  const { t, i18n } = useTranslation(ns)
  const [hold, setHold] = useState(false)
  const [timeline, setTimeline] = useState(seed)
  const percent = (value: number) =>
    new Intl.NumberFormat(i18n.language, { style: 'percent' }).format(value)
  const outstanding = aging.current + aging.d30 + aging.d60 + aging.d90
  const overdue = outstanding - aging.current
  const score = Math.round(
    (factors.reduce((sum, factor) => sum + factor.score, 0) / factors.length) *
      100,
  )
  const circumference = 2 * Math.PI * 26

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:gap-4">
      <RecordHeader
        leading={
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-lg bg-foreground text-sm font-bold text-background"
          >
            AS
          </span>
        }
        title="Adatum Software"
        badges={
          <Badge
            variant="secondary"
            className={cn(
              'gap-1 rounded-full border-0',
              hold
                ? 'bg-destructive/10 text-destructive'
                : 'bg-success/12 text-success',
            )}
          >
            {hold && <Lock className="size-3" />}
            {hold ? t('cxOnHold') : t('cxActive')}
          </Badge>
        }
        meta={t('cxMeta')}
        actions={
          <>
            <ConfirmAction
              tone={hold ? 'default' : 'destructive'}
              icon={hold ? LockOpen : Lock}
              title={hold ? t('cxRelease') : t('cxHoldTitle')}
              description={hold ? t('cxReleased') : t('cxHoldHint')}
              details={
                hold
                  ? undefined
                  : [
                      [
                        t('cxOutstanding'),
                        <bdi key="out">{money(outstanding)}</bdi>,
                      ],
                    ]
              }
              confirmLabel={hold ? t('cxRelease') : t('cxHold')}
              onConfirm={() => {
                setHold((value) => !value)
                toast(hold ? t('cxReleased') : t('cxHeld'))
              }}
            >
              <Button variant="outline" className="flex-1 sm:flex-none">
                {hold ? (
                  <LockOpen data-icon="inline-start" />
                ) : (
                  <Lock data-icon="inline-start" />
                )}
                {hold ? t('cxRelease') : t('cxHold')}
              </Button>
            </ConfirmAction>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex-1 sm:flex-none">
                  <Plus data-icon="inline-start" />
                  {t('cxLog')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {kinds.map((kind) => (
                  <DropdownMenuItem
                    key={kind.key}
                    onClick={() => {
                      setTimeline((list) => [
                        {
                          icon: kind.icon,
                          kind: kind.key,
                          text: t(kind.key),
                          who: t('you'),
                          hours: 0,
                        },
                        ...list,
                      ])
                      toast.success(t('cxLogged', { kind: t(kind.key) }))
                    }}
                  >
                    <kind.icon />
                    {t(kind.key)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <div
        role="alert"
        className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/8 px-4 py-3 text-sm"
      >
        <CircleAlert
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-warning"
        />
        <p>
          <span className="font-medium">{t('cxRiskTitle')}</span>{' '}
          <span className="text-muted-foreground">{t('cxRiskHint')}</span>
        </p>
      </div>

      <Card className="grid grid-cols-2 gap-x-6 gap-y-5 px-5 py-4 lg:grid-cols-4">
        <div className="col-span-2 flex items-center gap-4 lg:col-span-1">
          {/* Health score ring; factors below explain the number. */}
          <div className="relative size-16 shrink-0">
            <svg
              viewBox="0 0 64 64"
              className="size-16 -rotate-90"
              aria-hidden="true"
            >
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                strokeWidth="6"
                className="stroke-muted"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                className={score >= 70 ? 'stroke-success' : 'stroke-warning'}
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - score / 100)}
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center text-lg font-semibold tabular-nums">
              {score}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t('cxHealth')}</p>
            <p className="text-sm font-medium">{t('cxHealthGood')}</p>
          </div>
        </div>
        <Metric
          label={t('cxRevenue')}
          value={
            <bdi>
              {compactMoney(
                revenue.reduce((sum, value) => sum + value, 0) * 10_000,
              )}
            </bdi>
          }
          hint={t('cxRevenueUp')}
          hintTone="success"
        >
          <Sparkline
            values={revenue}
            label={t('cxRevenueTrend')}
            className="h-6"
          />
        </Metric>
        <Metric
          label={t('cxOutstanding')}
          value={<bdi>{compactMoney(outstanding)}</bdi>}
          hint={t('cxOverdueShare', { value: compactMoney(overdue) })}
          hintTone="warning"
        />
        <Metric
          label={t('cxCredit')}
          value={percent(outstanding / LIMIT)}
          hint={t('cxCreditHint', { limit: compactMoney(LIMIT) })}
        >
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full',
                outstanding / LIMIT > 0.8 ? 'bg-warning' : 'bg-primary',
              )}
              style={{ width: `${(outstanding / LIMIT) * 100}%` }}
            />
          </div>
        </Metric>
      </Card>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-3 lg:gap-4">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 lg:col-span-2 lg:gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('cxAging')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('cxAgingHint')}
              </p>
            </CardHeader>
            <CardContent>
              <BudgetBar
                label={t('cxAging')}
                limit={outstanding}
                format={compactMoney}
                segments={[
                  {
                    label: t('cxCurrent'),
                    value: aging.current,
                    tone: 'success',
                  },
                  { label: t('cxDays30'), value: aging.d30, tone: 'warning' },
                  { label: t('cxDays60'), value: aging.d60, tone: 'info' },
                  {
                    label: t('cxDays90'),
                    value: aging.d90,
                    tone: 'destructive',
                  },
                ]}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('cxFactors')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {factors.map((factor) => (
                <div key={factor.key} className="grid gap-1.5">
                  <div className="flex justify-between text-sm">
                    <span>{t(factor.key)}</span>
                    <span
                      className={cn(
                        'font-medium tabular-nums',
                        factor.score < 0.6 && 'text-warning',
                      )}
                    >
                      {Math.round(factor.score * 100)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        factor.score < 0.6 ? 'bg-warning' : 'bg-success',
                      )}
                      style={{ width: `${factor.score * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('cxTimeline')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative grid gap-4 before:absolute before:inset-y-2 before:start-3.5 before:w-px before:bg-border">
                {timeline.map((entry, index) => (
                  <li
                    key={index}
                    className="relative flex animate-in gap-3 duration-200 fade-in-0"
                  >
                    <span className="relative grid size-7 shrink-0 place-items-center rounded-full border bg-card text-muted-foreground">
                      <entry.icon className="size-3.5" />
                    </span>
                    <div className="min-w-0 pt-0.5 text-sm">
                      <p dir="auto" className="text-start">
                        {entry.text}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.who} ·{' '}
                        {relativeDate(
                          new Date(
                            Date.now() - entry.hours * 3_600_000,
                          ).toISOString(),
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 lg:gap-4">
          <Card className="gap-2">
            <CardHeader>
              <CardTitle>{t('cxOpenItems')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-[minmax(0,1fr)] gap-0.5 px-3 2xl:px-4">
              <RelatedRecord
                icon={FileText}
                reference="QUO-5521"
                title={t('cxQuote')}
                status={t('cxSent')}
                tone="info"
              />
              <RelatedRecord
                icon={Building2}
                reference="SO-9034"
                title={t('cxOrder')}
                status={t('cxShipping')}
                tone="primary"
              />
              <RelatedRecord
                icon={ReceiptText}
                reference="INV-3188"
                title={t('cxInvoice')}
                status={t('cxOverdueDays')}
                tone="destructive"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('cxContacts')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-3">
                {contacts.map((contact) => (
                  <li key={contact.name} className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {contact.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate font-medium">{contact.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t(contact.role)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      asChild
                    >
                      <a
                        href={`mailto:${contact.email}`}
                        aria-label={`${t('email')}: ${contact.email}`}
                      >
                        <Mail />
                      </a>
                    </Button>
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
