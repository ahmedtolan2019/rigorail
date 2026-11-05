import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CalendarClock,
  ChevronRight,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  type LucideIcon,
} from 'lucide-react'
import { compactMoney, date, money } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { ns } from '../messages'
import { registerCopy } from '../example-utils'
import { Metric, RecordHeader, Sparkline } from '../sections/record'

registerCopy({
  profileDraft: ['Message draft', 'مسودة رسالة'],
  profileDraftHint: [
    'Prepare a local draft for this contact. Nothing is sent.',
    'جهز مسودة محلية لهذا الشخص. لن يُرسل شيء.',
  ],
  profileSave: ['Save message draft', 'حفظ مسودة الرسالة'],
  profileSaved: ['Local message draft saved.', 'تم حفظ مسودة الرسالة محليًا.'],
  pfOpenApprovals: ['Awaiting decision', 'بانتظار القرار'],
  pfAway: ['Away', 'غير متاح'],
  pfOpenTrend: [
    'Approvals waiting, last 8 weeks',
    'الاعتمادات المنتظرة آخر 8 أسابيع',
  ],
  pfOldest: ['Oldest waits 2 days', 'أقدمها ينتظر يومين'],
  pfCycle: ['Average decision time', 'متوسط وقت القرار'],
  pfCycleValue: ['{{value}} days', '{{value}} أيام'],
  pfCycleHint: ['0.6 days faster than team', 'أسرع من الفريق بـ 0.6 يوم'],
  pfManaged: ['Spend managed this year', 'الإنفاق المُدار هذا العام'],
  pfManagedTrend: ['Spend managed by month', 'الإنفاق المُدار شهريًا'],
  pfOnTime: ['Decided within SLA', 'قرارات ضمن المهلة'],
  pfOnTimeHint: ['Target 90%', 'المستهدف 90%'],
  pfWorkingHours: ['Working hours', 'ساعات العمل'],
  pfWorkingNow: ['Working now · {{time}}', 'في الدوام الآن · {{time}}'],
  pfOffNow: ['Outside working hours · {{time}}', 'خارج ساعات العمل · {{time}}'],
  pfReportsTo: ['Reporting line', 'خط التبعية'],
  pfWorkload: ['Approval workload', 'حجم الاعتمادات'],
  pfWorkloadHint: [
    'Decisions per day this week against usual capacity',
    'القرارات اليومية هذا الأسبوع مقابل طاقتها المعتادة',
  ],
  pfCapacity: ['Usual capacity', 'الطاقة المعتادة'],
  pfStage: [
    'Stage {{current}} of {{total}}',
    'المرحلة {{current}} من {{total}}',
  ],
})

const day = 86_400_000
const person = {
  name: 'Lina Farouk',
  title: 'Procurement lead',
  department: 'Operations',
  location: 'Jeddah, Saudi Arabia',
  timeZone: 'Asia/Riyadh',
  email: 'lina.farouk@example.com',
  phone: '+966 12 555 0187',
  joined: new Date(Date.now() - 1_180 * day).toISOString(),
  skills: [
    'Strategic sourcing',
    'Contract negotiation',
    'Supplier risk',
    'SAP Ariba',
    'Arabic',
    'English',
  ],
  hours: [8, 16] as const,
}
const chain = ['Alex Morgan', 'Omar Haddad', 'Lina Farouk']
const owned = [
  {
    ref: 'REQ-1187',
    title: 'Warehouse scanners',
    amount: 920_000,
    state: 'approved',
    stage: 3,
  },
  {
    ref: 'REQ-1230',
    title: 'Printer supplies',
    amount: 200_050,
    state: 'submitted',
    stage: 2,
  },
  {
    ref: 'REQ-1244',
    title: 'Forklift maintenance',
    amount: 185_000,
    state: 'draft',
    stage: 0,
  },
] as const
const STAGES = 3
const stateTone = {
  approved: 'bg-success/12 text-success',
  submitted: 'bg-info/12 text-info',
  draft: 'bg-muted text-muted-foreground',
}
const stateLabel = {
  approved: 'approvedStatus',
  submitted: 'submittedStatus',
  draft: 'draftStatus',
} as const
const workload = [6, 9, 4, 11, 7]
const CAPACITY = 8
const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')

export default function Profile() {
  const { t, i18n } = useTranslation(ns)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [saved, setSaved] = useState('')
  const now = new Date()
  const localTime = new Intl.DateTimeFormat(i18n.language, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: person.timeZone,
  }).format(now)
  const hourThere =
    Number(
      new Intl.DateTimeFormat('en-GB', {
        hour: 'numeric',
        hour12: false,
        timeZone: person.timeZone,
      }).format(now),
    ) +
    now.getMinutes() / 60
  const working = hourThere >= person.hours[0] && hourThere < person.hours[1]
  const away = {
    from: date(new Date(Date.now() + 2 * day).toISOString()),
    to: date(new Date(Date.now() + 4 * day).toISOString()),
  }
  const weekdays = Array.from({ length: 5 }, (_, index) =>
    new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(
      new Date(2026, 10, 1 + index),
    ),
  )
  const contact: {
    icon: LucideIcon
    label: string
    value: string
    href?: string
    ltr?: boolean
  }[] = [
    {
      icon: Mail,
      label: t('email'),
      value: person.email,
      href: `mailto:${person.email}`,
      ltr: true,
    },
    {
      icon: Phone,
      label: t('phone'),
      value: person.phone,
      href: `tel:${person.phone.replace(/\s/g, '')}`,
      ltr: true,
    },
    { icon: MapPin, label: t('location'), value: person.location },
  ]

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:gap-4">
      <RecordHeader
        leading={
          <Avatar className="size-12">
            <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
              {initials(person.name)}
            </AvatarFallback>
          </Avatar>
        }
        title={person.name}
        badges={
          <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
            <span
              className={cn(
                'size-2 rounded-full',
                working ? 'bg-success' : 'bg-muted-foreground/50',
              )}
            />
            {working ? t('available') : t('pfAway')}
          </span>
        }
        meta={`${person.title} · ${person.department}`}
        actions={
          <>
            <Button variant="outline" asChild className="flex-1 sm:flex-none">
              <a href={`mailto:${person.email}`}>
                <Mail data-icon="inline-start" />
                {t('sendEmail')}
              </a>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none">
                  <MessageSquare data-icon="inline-start" />
                  {t('message')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {t('profileDraft')} · {person.name}
                  </DialogTitle>
                  <DialogDescription>{t('profileDraftHint')}</DialogDescription>
                </DialogHeader>
                <Label htmlFor="profile-message">{t('profileDraft')}</Label>
                <Textarea
                  id="profile-message"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={4}
                />
                <Button
                  disabled={!draft.trim()}
                  onClick={() => {
                    setSaved(draft.trim())
                    setOpen(false)
                  }}
                >
                  {t('profileSave')}
                </Button>
              </DialogContent>
            </Dialog>
          </>
        }
      />
      {saved && (
        <div
          role="status"
          className="rounded-lg border border-primary/20 bg-primary/5 p-4"
        >
          <p className="text-sm font-medium">{t('profileSaved')}</p>
          <p className="mt-1 text-sm break-words whitespace-pre-wrap text-muted-foreground">
            {saved}
          </p>
        </div>
      )}
      <div
        role="status"
        className="flex items-start gap-3 rounded-lg border border-info/30 bg-info/8 px-4 py-3 text-sm"
      >
        <CalendarClock
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-info"
        />
        <p>
          <span className="font-medium">{t('outOfOffice', away)}</span>{' '}
          <span className="text-muted-foreground">
            {t('delegateTo', { name: 'Sam Taylor' })}
          </span>
        </p>
      </div>

      <Card className="grid grid-cols-2 gap-x-6 gap-y-5 px-5 py-4 lg:grid-cols-4">
        <Metric
          label={t('pfOpenApprovals')}
          value="7"
          hint={t('pfOldest')}
          hintTone="warning"
        >
          <Sparkline
            values={[3, 5, 4, 6, 9, 7, 8, 7]}
            tone="warning"
            label={t('pfOpenTrend')}
            className="h-6"
          />
        </Metric>
        <Metric
          label={t('pfCycle')}
          value={t('pfCycleValue', { value: 1.8 })}
          hint={t('pfCycleHint')}
          hintTone="success"
        />
        <Metric
          label={t('pfManaged')}
          value={<bdi>{compactMoney(48_210_000)}</bdi>}
        >
          <Sparkline
            values={[32, 41, 38, 45, 52, 49, 58, 61, 57, 64]}
            label={t('pfManagedTrend')}
            className="h-6"
          />
        </Metric>
        <Metric label={t('pfOnTime')} value="96%" hint={t('pfOnTimeHint')}>
          {/* Meter with the target marked, so 96% reads against the 90% goal. */}
          <div
            className="relative h-1.5 rounded-full bg-muted"
            role="img"
            aria-label={`96% · ${t('pfOnTimeHint')}`}
          >
            <div
              className="h-full rounded-full bg-success"
              style={{ width: '96%' }}
            />
            <span
              aria-hidden="true"
              className="absolute -inset-y-1 w-0.5 rounded-full bg-foreground"
              style={{ insetInlineStart: '90%' }}
            />
          </div>
        </Metric>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 lg:gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('about')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-3">
                {contact.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-start gap-3 text-sm"
                  >
                    <item.icon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {item.label}
                      </p>
                      {item.href ? (
                        <a
                          href={item.href}
                          dir={item.ltr ? 'ltr' : undefined}
                          className="block truncate font-medium hover:underline"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="truncate font-medium">{item.value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="grid gap-2 border-t pt-4">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock aria-hidden="true" className="size-3.5" />
                  {t('pfWorkingHours')}
                </p>
                {/* A 24-hour band: shaded working hours and a marker at her local time. */}
                <div
                  className="relative h-2 rounded-full bg-muted"
                  style={{ direction: 'ltr' }}
                  aria-hidden="true"
                >
                  <div
                    className="absolute inset-y-0 rounded-full bg-primary/30"
                    style={{
                      left: `${(person.hours[0] / 24) * 100}%`,
                      width: `${((person.hours[1] - person.hours[0]) / 24) * 100}%`,
                    }}
                  />
                  <span
                    className={cn(
                      'absolute -inset-y-1 w-1 -translate-x-1/2 rounded-full',
                      working ? 'bg-success' : 'bg-foreground',
                    )}
                    style={{ left: `${(hourThere / 24) * 100}%` }}
                  />
                </div>
                <p
                  className={cn(
                    'text-xs font-medium',
                    working ? 'text-success' : 'text-muted-foreground',
                  )}
                >
                  {t(working ? 'pfWorkingNow' : 'pfOffNow', {
                    time: localTime,
                  })}
                </p>
              </div>
              <div className="grid gap-2 border-t pt-4">
                <p className="text-xs text-muted-foreground">
                  {t('pfReportsTo')}
                </p>
                <ol className="flex flex-wrap items-center gap-1.5 text-sm">
                  {chain.map((name, index) => (
                    <li key={name} className="flex items-center gap-1.5">
                      <Avatar className="size-6">
                        <AvatarFallback className="bg-muted text-[0.625rem] font-semibold">
                          {initials(name)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={cn(
                          index === chain.length - 1
                            ? 'font-medium'
                            : 'text-muted-foreground',
                        )}
                      >
                        {name}
                      </span>
                      {index < chain.length - 1 && (
                        <ChevronRight
                          aria-hidden="true"
                          className="size-3.5 text-muted-foreground rtl:-scale-x-100"
                        />
                      )}
                    </li>
                  ))}
                </ol>
                <p className="text-xs text-muted-foreground">
                  {t('joined')} {date(person.joined)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 lg:col-span-2 lg:gap-4">
          <Card className="overflow-hidden pb-0">
            <CardHeader>
              <CardTitle>{t('owns')}</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <ul className="divide-y border-t">
                {owned.map((item) => (
                  <li
                    key={item.ref}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-5 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_5rem_auto_6.5rem] 2xl:px-6"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {item.title}
                      </span>
                      <span
                        dir="ltr"
                        className="block text-start text-xs text-muted-foreground tabular-nums"
                      >
                        {item.ref}
                      </span>
                    </span>
                    {/* Approval progress: one segment per stage. */}
                    <span
                      role="img"
                      aria-label={t('pfStage', {
                        current: item.stage,
                        total: STAGES,
                      })}
                      className="col-span-2 row-start-2 flex gap-1 sm:col-span-1 sm:row-start-auto"
                    >
                      {Array.from({ length: STAGES }, (_, index) => (
                        <span
                          key={index}
                          className={cn(
                            'h-1.5 flex-1 rounded-full',
                            index < item.stage ? 'bg-primary' : 'bg-muted',
                          )}
                        />
                      ))}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'justify-self-end rounded-full border-0',
                        stateTone[item.state],
                      )}
                    >
                      {t(stateLabel[item.state])}
                    </Badge>
                    <bdi className="hidden text-end tabular-nums sm:block">
                      {money(item.amount)}
                    </bdi>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('pfWorkload')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('pfWorkloadHint')}
              </p>
            </CardHeader>
            <CardContent>
              <div
                className="relative flex h-28 gap-3"
                role="img"
                aria-label={`${t('pfWorkload')}: ${workload.join(', ')}`}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 border-t border-dashed border-foreground/40"
                  // Offset by the weekday label row so the line meets the bars' scale.
                  style={{
                    bottom: `calc(1.4rem + (100% - 1.4rem) * ${CAPACITY / 12})`,
                  }}
                />
                {workload.map((value, index) => (
                  <div
                    key={index}
                    className="flex flex-1 flex-col items-center gap-1.5"
                  >
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className={cn(
                          'w-full rounded-t-md',
                          value > CAPACITY ? 'bg-warning' : 'bg-primary/60',
                        )}
                        style={{ height: `${(value / 12) * 100}%` }}
                      />
                    </div>
                    <span className="text-[0.6875rem] text-muted-foreground">
                      {weekdays[index]}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-4 border-t border-dashed border-foreground/40" />
                {t('pfCapacity')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('expertise')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-wrap gap-1.5">
                {person.skills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs font-medium"
                  >
                    {skill}
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
