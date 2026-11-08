import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { BellRing, Lock, Mail, Newspaper, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import { ConfirmAction } from '@/shared/ui/confirm-action'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'
import { ns } from '../messages'
import { registerCopy } from '../example-utils'

registerCopy({
  ncTitle: ['Delivery preferences', 'تفضيلات الإشعارات'],
  ncHint: [
    'Choose where each kind of update reaches you. The digest bundles everything once a day.',
    'اختر أين تصلك كل نوعية من التحديثات. يجمع الملخص كل شيء مرة يوميًا.',
  ],
  ncEvent: ['Event', 'الحدث'],
  ncInApp: ['In app', 'داخل التطبيق'],
  ncEmail: ['Email', 'البريد'],
  ncDigest: ['Daily digest', 'الملخص اليومي'],
  ncApprovals: ['Approvals', 'الاعتمادات'],
  ncComments: ['Comments', 'التعليقات'],
  ncFinance: ['Finance', 'المالية'],
  ncAssigned: ['A request needs my approval', 'طلب يحتاج اعتمادي'],
  ncDecided: [
    'My request was approved or returned',
    'تم اعتماد طلبي أو إرجاعه',
  ],
  ncEscalated: ['An approval I own is escalated', 'تم تصعيد اعتماد أملكه'],
  ncMention: ['Someone mentions me', 'إشارة أحدهم إليّ'],
  ncReply: ['Reply in a thread I follow', 'رد في نقاش أتابعه'],
  ncBudget: ['Budget passes 80%', 'تجاوز الميزانية 80%'],
  ncOverdue: ['Invoice becomes overdue', 'تأخر فاتورة'],
  ncLocked: [
    'Required: escalations always appear in the app.',
    'إلزامي: تظهر التصعيدات دائمًا داخل التطبيق.',
  ],
  ncToggleColumn: ['All events by {{channel}}', 'كل الأحداث عبر {{channel}}'],
  ncQuiet: ['Quiet hours', 'ساعات الهدوء'],
  ncQuietHint: [
    'Hold email outside working hours. Urgent escalations still arrive.',
    'إيقاف البريد خارج ساعات العمل. تصل التصعيدات العاجلة مع ذلك.',
  ],
  ncFrom: ['From', 'من'],
  ncTo: ['To', 'إلى'],
  ncDigestTime: ['Digest time', 'وقت الملخص'],
  ncPreview: ['What to expect', 'ما المتوقع'],
  ncEmailsWeek_one: [
    'About {{count}} email a week',
    'نحو رسالة بريد واحدة أسبوعيًا',
  ],
  ncEmailsWeek: [
    'About {{count}} emails a week',
    'نحو {{count}} رسائل بريد أسبوعيًا',
  ],
  ncAppWeek: [
    'About {{count}} in-app notifications a week',
    'نحو {{count}} إشعارات داخل التطبيق أسبوعيًا',
  ],
  ncDigestOn: [
    'One digest at {{time}} with {{count}} kinds of update',
    'ملخص واحد الساعة {{time}} يضم {{count}} أنواع من التحديثات',
  ],
  ncDigestOff: ['No daily digest', 'لا يوجد ملخص يومي'],
  ncMuted: [
    '{{count}} events reach you nowhere',
    '{{count}} أحداث لن تصلك بأي طريقة',
  ],
  ncUnsaved_one: ['{{count}} unsaved change', 'تغيير واحد غير محفوظ'],
  ncUnsaved: ['{{count}} unsaved changes', '{{count}} تغييرات غير محفوظة'],
  ncSaved: ['Notification preferences saved.', 'تم حفظ تفضيلات الإشعارات.'],
  ncDefaults: ['Restore defaults', 'استعادة الافتراضي'],
  ncDefaultsTitle: [
    'Restore default preferences?',
    'استعادة التفضيلات الافتراضية؟',
  ],
  ncDefaultsHint: [
    'Every channel and quiet hour setting returns to the workspace default.',
    'تعود كل القنوات وساعات الهدوء إلى إعدادات مساحة العمل الافتراضية.',
  ],
})

const channels = ['inApp', 'email', 'digest'] as const
type Channel = (typeof channels)[number]
const channelMeta: Record<Channel, { key: string; icon: LucideIcon }> = {
  inApp: { key: 'ncInApp', icon: BellRing },
  email: { key: 'ncEmail', icon: Mail },
  digest: { key: 'ncDigest', icon: Newspaper },
}
const groups = [
  { key: 'ncApprovals', events: ['ncAssigned', 'ncDecided', 'ncEscalated'] },
  { key: 'ncComments', events: ['ncMention', 'ncReply'] },
  { key: 'ncFinance', events: ['ncBudget', 'ncOverdue'] },
]
const events = groups.flatMap((group) => group.events)
/** Typical weekly volume per event, used to preview the effect of a change. */
const weekly: Record<string, number> = {
  ncAssigned: 9,
  ncDecided: 4,
  ncEscalated: 1,
  ncMention: 6,
  ncReply: 14,
  ncBudget: 1,
  ncOverdue: 2,
}
const locked = new Set(['ncEscalated:inApp'])
type Matrix = Record<string, Record<Channel, boolean>>
const defaults: Matrix = {
  ncAssigned: { inApp: true, email: true, digest: false },
  ncDecided: { inApp: true, email: true, digest: false },
  ncEscalated: { inApp: true, email: true, digest: false },
  ncMention: { inApp: true, email: true, digest: false },
  ncReply: { inApp: true, email: false, digest: true },
  ncBudget: { inApp: true, email: false, digest: true },
  ncOverdue: { inApp: false, email: false, digest: true },
}
const hours = ['06:00', '07:00', '08:00', '17:00', '18:00', '19:00', '20:00']
interface Settings {
  matrix: Matrix
  quiet: boolean
  from: string
  to: string
  digestAt: string
}
const initial: Settings = {
  matrix: defaults,
  quiet: true,
  from: '19:00',
  to: '07:00',
  digestAt: '08:00',
}

export default function NotificationsCenter() {
  const { t } = useTranslation(ns)
  const [saved, setSaved] = useState(initial)
  const [draft, setDraft] = useState(initial)
  const changes =
    events.reduce(
      (sum, event) =>
        sum +
        channels.filter(
          (channel) =>
            draft.matrix[event]![channel] !== saved.matrix[event]![channel],
        ).length,
      0,
    ) +
    (['quiet', 'from', 'to', 'digestAt'] as const).filter(
      (key) => draft[key] !== saved[key],
    ).length
  const set = (event: string, channel: Channel, on: boolean) =>
    setDraft((current) => ({
      ...current,
      matrix: {
        ...current.matrix,
        [event]: { ...current.matrix[event]!, [channel]: on },
      },
    }))
  const column = (channel: Channel) => {
    const editable = events.filter(
      (event) => !locked.has(`${event}:${channel}`),
    )
    const count = editable.filter(
      (event) => draft.matrix[event]![channel],
    ).length
    return count === editable.length
      ? true
      : count === 0
        ? false
        : ('indeterminate' as const)
  }
  const emails = events
    .filter((event) => draft.matrix[event]!.email)
    .reduce((sum, event) => sum + weekly[event]!, 0)
  const inApp = events
    .filter((event) => draft.matrix[event]!.inApp)
    .reduce((sum, event) => sum + weekly[event]!, 0)
  const digestKinds = events.filter(
    (event) => draft.matrix[event]!.digest,
  ).length
  const muted = events.filter((event) =>
    channels.every((channel) => !draft.matrix[event]![channel]),
  ).length

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:gap-4 2xl:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 lg:gap-4">
        <Card className="min-w-0 gap-0 overflow-hidden py-0">
          <div className="border-b px-5 py-3.5">
            <h3 className="text-sm font-semibold">{t('ncTitle')}</h3>
            <p className="text-xs text-muted-foreground">{t('ncHint')}</p>
          </div>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[30rem] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th scope="col" className="px-5 py-2 text-start font-medium">
                    {t('ncEvent')}
                  </th>
                  {channels.map((channel) => {
                    const Icon = channelMeta[channel].icon
                    return (
                      <th
                        key={channel}
                        scope="col"
                        className="w-24 px-2 py-2 text-center font-medium"
                      >
                        <span className="flex flex-col items-center gap-1.5">
                          <span className="flex items-center gap-1">
                            <Icon aria-hidden="true" className="size-3.5" />
                            {t(channelMeta[channel].key)}
                          </span>
                          <Checkbox
                            checked={column(channel)}
                            aria-label={t('ncToggleColumn', {
                              channel: t(channelMeta[channel].key),
                            })}
                            onCheckedChange={(on) =>
                              events.forEach(
                                (event) =>
                                  !locked.has(`${event}:${channel}`) &&
                                  set(event, channel, on === true),
                              )
                            }
                          />
                        </span>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <Fragment key={group.key}>
                    <tr>
                      <th
                        colSpan={4}
                        scope="rowgroup"
                        className="border-b bg-muted/20 px-5 pt-3 pb-1.5 text-start text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                      >
                        {t(group.key)}
                      </th>
                    </tr>
                    {group.events.map((event) => (
                      <tr
                        key={event}
                        className="border-b last:border-b-0 hover:bg-muted/30"
                      >
                        <th
                          scope="row"
                          className="px-5 py-2.5 text-start font-normal"
                        >
                          {t(event)}
                        </th>
                        {channels.map((channel) => {
                          const isLocked = locked.has(`${event}:${channel}`)
                          const changed =
                            draft.matrix[event]![channel] !==
                            saved.matrix[event]![channel]
                          return (
                            <td
                              key={channel}
                              className={cn(
                                'px-2 py-2.5 text-center',
                                changed && 'bg-warning/10',
                              )}
                            >
                              <span
                                className="inline-flex items-center gap-1"
                                title={isLocked ? t('ncLocked') : undefined}
                              >
                                <Checkbox
                                  checked={draft.matrix[event]![channel]}
                                  disabled={isLocked}
                                  onCheckedChange={(on) =>
                                    set(event, channel, on === true)
                                  }
                                  aria-label={`${t(event)}: ${t(channelMeta[channel].key)}`}
                                  aria-describedby={
                                    isLocked ? 'nc-locked' : undefined
                                  }
                                />
                                {isLocked && (
                                  <Lock
                                    aria-hidden="true"
                                    className="size-3 text-muted-foreground"
                                  />
                                )}
                              </span>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <p
            id="nc-locked"
            className="flex items-center gap-1.5 border-t px-5 py-2 text-xs text-muted-foreground"
          >
            <Lock aria-hidden="true" className="size-3" />
            {t('ncLocked')}
          </p>
        </Card>
        <Card className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 sm:col-span-2">
            <Switch
              id="nc-quiet"
              checked={draft.quiet}
              onCheckedChange={(quiet) =>
                setDraft((current) => ({ ...current, quiet }))
              }
            />
            <Label htmlFor="nc-quiet" className="grid gap-0.5 font-normal">
              <span className="font-medium">{t('ncQuiet')}</span>
              <span className="text-xs text-muted-foreground">
                {t('ncQuietHint')}
              </span>
            </Label>
          </div>
          {(
            [
              ['from', 'ncFrom'],
              ['to', 'ncTo'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="grid gap-1.5">
              <Label id={`nc-${key}`} className="text-xs text-muted-foreground">
                {t(label)}
              </Label>
              <Select
                value={draft[key]}
                disabled={!draft.quiet}
                onValueChange={(value) =>
                  setDraft((current) => ({ ...current, [key]: value }))
                }
              >
                <SelectTrigger aria-labelledby={`nc-${key}`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      <span dir="ltr">{hour}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          <div className="grid gap-1.5 sm:col-span-2">
            <Label id="nc-digest" className="text-xs text-muted-foreground">
              {t('ncDigestTime')}
            </Label>
            <Select
              value={draft.digestAt}
              onValueChange={(digestAt) =>
                setDraft((current) => ({ ...current, digestAt }))
              }
            >
              <SelectTrigger
                aria-labelledby="nc-digest"
                className="w-full sm:w-48"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hours.slice(0, 3).map((hour) => (
                  <SelectItem key={hour} value={hour}>
                    <span dir="ltr">{hour}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>
      <Card className="gap-4 px-5 py-4 2xl:sticky 2xl:top-20 2xl:self-start">
        <h3 className="text-sm font-semibold">{t('ncPreview')}</h3>
        {/* Volume is estimated from typical weekly events so the effect of a change is visible before saving. */}
        <ul className="grid gap-3 text-sm" aria-live="polite">
          <li className="flex items-start gap-2.5">
            <Mail
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            {t('ncEmailsWeek', { count: emails })}
          </li>
          <li className="flex items-start gap-2.5">
            <BellRing
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            {t('ncAppWeek', { count: inApp })}
          </li>
          <li className="flex items-start gap-2.5">
            <Newspaper
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            {digestKinds
              ? t('ncDigestOn', { time: draft.digestAt, count: digestKinds })
              : t('ncDigestOff')}
          </li>
          {muted > 0 && (
            <li className="rounded-md bg-warning/10 px-2.5 py-1.5 text-xs font-medium text-warning">
              {t('ncMuted', { count: muted })}
            </li>
          )}
        </ul>
        <div className="grid gap-2 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            {changes ? t('ncUnsaved', { count: changes }) : t('noChanges')}
          </p>
          <Button
            disabled={!changes}
            onClick={() => {
              setSaved(draft)
              toast.success(t('ncSaved'))
            }}
          >
            {t('save')}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              disabled={!changes}
              onClick={() => setDraft(saved)}
            >
              {t('discard')}
            </Button>
            <ConfirmAction
              tone="warning"
              title={t('ncDefaultsTitle')}
              description={t('ncDefaultsHint')}
              confirmLabel={t('ncDefaults')}
              onConfirm={() => setDraft(initial)}
            >
              <Button variant="ghost" size="sm" className="flex-1">
                {t('ncDefaults')}
              </Button>
            </ConfirmAction>
          </div>
        </div>
      </Card>
    </div>
  )
}
