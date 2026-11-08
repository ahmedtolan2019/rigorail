import { Fragment, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ArrowRight,
  ChevronRight,
  Download,
  Search,
  ShieldAlert,
} from 'lucide-react'
import { exportCsv } from '@/shared/export/csv'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Illustration } from '@/shared/ui/illustration'
import { Input } from '@/shared/ui/input'
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
  alSearch: ['Search object or reference', 'ابحث في العنصر أو المرجع'],
  alActor: ['Actor', 'المنفّذ'],
  alAction: ['Action', 'الإجراء'],
  alObject: ['Object', 'العنصر'],
  alWhen: ['When', 'الوقت'],
  alAnyActor: ['Anyone', 'أي شخص'],
  alAnyAction: ['Any action', 'أي إجراء'],
  alPeriod: ['Period', 'الفترة'],
  al24h: ['24 hours', '24 ساعة'],
  al7d: ['7 days', '7 أيام'],
  al30d: ['30 days', '30 يومًا'],
  alCreated: ['Created', 'أنشأ'],
  alUpdated: ['Updated', 'حدّث'],
  alApproved: ['Approved', 'اعتمد'],
  alDeleted: ['Deleted', 'حذف'],
  alPermission: ['Changed access', 'غيّر الصلاحيات'],
  alSignIn: ['Signed in', 'سجّل الدخول'],
  alField: ['Field', 'الحقل'],
  alBefore: ['Before', 'قبل'],
  alAfter: ['After', 'بعد'],
  alEmpty: ['(empty)', '(فارغ)'],
  alNoChanges: [
    'No field changes recorded for this event.',
    'لا توجد تغييرات حقول مسجلة لهذا الحدث.',
  ],
  alShowChanges: ['Show changes for {{ref}}', 'عرض تغييرات {{ref}}'],
  alEvents_one: ['{{count}} event', 'حدث واحد'],
  alEvents: ['{{count}} events', '{{count}} أحداث'],
  alExport: ['Export CSV', 'تصدير CSV'],
  alExported_one: ['{{count}} event exported.', 'تم تصدير حدث واحد.'],
  alExported: ['{{count}} events exported.', 'تم تصدير {{count}} أحداث.'],
  alNone: ['No events match these filters', 'لا أحداث تطابق هذه المرشحات'],
  alNoneHint: [
    'Widen the period or clear a filter.',
    'وسّع الفترة أو امسح أحد المرشحات.',
  ],
  alClear: ['Clear filters', 'مسح المرشحات'],
  alSensitive: ['Sensitive', 'حساس'],
  alFrom: ['From {{place}}', 'من {{place}}'],
  alImmutable: [
    'Entries are append-only and kept for 7 years.',
    'السجلات للإضافة فقط وتُحفظ 7 سنوات.',
  ],
})

type Action =
  'created' | 'updated' | 'approved' | 'deleted' | 'permission' | 'signIn'
interface Change {
  field: string
  before?: string
  after?: string
}
interface Event {
  ref: string
  hours: number
  actor: string
  action: Action
  object: string
  objectRef: string
  place: string
  changes: Change[]
}
const actionMeta: Record<Action, { key: string; tone: string }> = {
  created: { key: 'alCreated', tone: 'bg-info/12 text-info' },
  updated: { key: 'alUpdated', tone: 'bg-muted text-foreground' },
  approved: { key: 'alApproved', tone: 'bg-success/12 text-success' },
  deleted: { key: 'alDeleted', tone: 'bg-destructive/10 text-destructive' },
  permission: { key: 'alPermission', tone: 'bg-warning/12 text-warning' },
  signIn: { key: 'alSignIn', tone: 'bg-muted text-muted-foreground' },
}
const sensitive = new Set<Action>(['permission', 'deleted'])
const events: Event[] = [
  {
    ref: 'EV-90241',
    hours: 0.4,
    actor: 'Sam Taylor',
    action: 'approved',
    object: 'Purchase order',
    objectRef: 'PO-2041',
    place: 'Riyadh · Web',
    changes: [
      { field: 'Status', before: 'Awaiting approval', after: 'Approved' },
    ],
  },
  {
    ref: 'EV-90238',
    hours: 2,
    actor: 'Lina Farouk',
    action: 'updated',
    object: 'Purchase order',
    objectRef: 'PO-2041',
    place: 'Jeddah · Web',
    changes: [
      { field: 'Quantity: Barcode scanner', before: '10', after: '12' },
      {
        field: 'Delivery address',
        before: 'Riyadh HQ',
        after: 'Jeddah Distribution Centre',
      },
    ],
  },
  {
    ref: 'EV-90230',
    hours: 5,
    actor: 'Omar Haddad',
    action: 'permission',
    object: 'Role',
    objectRef: 'Approver',
    place: 'Riyadh · Web',
    changes: [
      {
        field: 'Suppliers: Block supplier',
        before: 'Denied',
        after: 'Allowed',
      },
    ],
  },
  {
    ref: 'EV-90217',
    hours: 9,
    actor: 'Chen Wei',
    action: 'created',
    object: 'Supplier',
    objectRef: 'SUP-0318',
    place: 'Dubai · Web',
    changes: [
      { field: 'Name', after: 'Northwind Traders' },
      { field: 'Payment terms', after: 'Net 45' },
    ],
  },
  {
    ref: 'EV-90199',
    hours: 20,
    actor: 'Nadia Karim',
    action: 'deleted',
    object: 'Attachment',
    objectRef: 'Draft-terms.pdf',
    place: 'Jeddah · Mobile',
    changes: [{ field: 'File', before: 'Draft-terms.pdf' }],
  },
  {
    ref: 'EV-90188',
    hours: 30,
    actor: 'Sam Taylor',
    action: 'signIn',
    object: 'Session',
    objectRef: 'Two-step verification',
    place: 'Riyadh · Web',
    changes: [],
  },
  {
    ref: 'EV-90140',
    hours: 74,
    actor: 'Lina Farouk',
    action: 'updated',
    object: 'Supplier',
    objectRef: 'SUP-0142',
    place: 'Jeddah · Web',
    changes: [
      {
        field: 'Bank account (IBAN)',
        before: 'SA03 •••• 7519',
        after: 'SA44 •••• 0021',
      },
    ],
  },
  {
    ref: 'EV-89977',
    hours: 300,
    actor: 'Omar Haddad',
    action: 'approved',
    object: 'Request',
    objectRef: 'REQ-1187',
    place: 'Riyadh · Web',
    changes: [{ field: 'Status', before: 'Submitted', after: 'Approved' }],
  },
]
const periods = { '24h': 24, '7d': 168, '30d': 720 } as const
const actors = [...new Set(events.map((event) => event.actor))]

export default function AuditLog() {
  const { t, i18n } = useTranslation(ns)
  const [query, setQuery] = useState('')
  const [actor, setActor] = useState('all')
  const [action, setAction] = useState('all')
  const [period, setPeriod] = useState<keyof typeof periods>('7d')
  const [open, setOpen] = useState<Set<string>>(() => new Set(['EV-90238']))
  const when = (hours: number) =>
    new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(Date.now() - hours * 3_600_000))
  const rows = useMemo(() => {
    const term = query.trim().toLowerCase()
    return events.filter(
      (event) =>
        event.hours <= periods[period] &&
        (actor === 'all' || event.actor === actor) &&
        (action === 'all' || event.action === action) &&
        (!term ||
          `${event.object} ${event.objectRef} ${event.ref}`
            .toLowerCase()
            .includes(term)),
    )
  }, [query, actor, action, period])
  const filtered =
    query !== '' || actor !== 'all' || action !== 'all' || period !== '7d'
  const toggle = (ref: string) =>
    setOpen((current) => {
      const next = new Set(current)
      if (next.has(ref)) next.delete(ref)
      else next.add(ref)
      return next
    })
  const download = () => {
    // One row per field change, so the export can be filtered in a spreadsheet.
    const flat = rows.flatMap((event) =>
      (event.changes.length ? event.changes : [{ field: '' }]).map(
        (change) => ({ event, change }),
      ),
    )
    exportCsv(
      { fileName: 'audit-log', title: 'Audit log', currency: 'USD' },
      {
        name: 'Audit log',
        rows: flat,
        columns: [
          { header: 'Event', value: (row) => row.event.ref },
          {
            header: 'Time',
            value: (row) => new Date(Date.now() - row.event.hours * 3_600_000),
          },
          { header: 'Actor', value: (row) => row.event.actor },
          {
            header: 'Action',
            value: (row) => t(actionMeta[row.event.action].key),
          },
          {
            header: 'Object',
            value: (row) => `${row.event.object} ${row.event.objectRef}`,
          },
          { header: 'Field', value: (row) => row.change.field },
          { header: 'Before', value: (row) => row.change.before },
          { header: 'After', value: (row) => row.change.after },
        ],
      },
    )
    toast.success(t('alExported', { count: rows.length }))
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-60">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('alSearch')}
            aria-label={t('alSearch')}
            className="ps-8"
          />
        </div>
        <Select value={actor} onValueChange={setActor}>
          <SelectTrigger className="w-auto" aria-label={t('alActor')}>
            <span className="text-muted-foreground">{t('alActor')}:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('alAnyActor')}</SelectItem>
            {actors.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-auto" aria-label={t('alAction')}>
            <span className="text-muted-foreground">{t('alAction')}:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('alAnyAction')}</SelectItem>
            {(Object.keys(actionMeta) as Action[]).map((key) => (
              <SelectItem key={key} value={key}>
                {t(actionMeta[key].key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={period}
          onValueChange={(value) =>
            value && setPeriod(value as keyof typeof periods)
          }
          aria-label={t('alPeriod')}
        >
          <ToggleGroupItem value="24h" className="px-2.5">
            {t('al24h')}
          </ToggleGroupItem>
          <ToggleGroupItem value="7d" className="px-2.5">
            {t('al7d')}
          </ToggleGroupItem>
          <ToggleGroupItem value="30d" className="px-2.5">
            {t('al30d')}
          </ToggleGroupItem>
        </ToggleGroup>
        <Button
          variant="outline"
          size="sm"
          className="ms-auto"
          disabled={!rows.length}
          onClick={download}
        >
          <Download data-icon="inline-start" />
          {t('alExport')}
        </Button>
      </div>
      <Card className="min-w-0 gap-0 overflow-hidden py-0">
        <div className="flex items-center gap-2 border-b px-4 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {t('alEvents', { count: rows.length })}
          </span>
          <span className="ms-auto">{t('alImmutable')}</span>
        </div>
        {rows.length === 0 ? (
          <div className="grid place-items-center gap-1 px-6 py-10 text-center">
            <Illustration name="no-results" className="size-28 sm:size-28" />
            <p className="font-medium">{t('alNone')}</p>
            <p className="text-sm text-muted-foreground">{t('alNoneHint')}</p>
            {filtered && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => {
                  setQuery('')
                  setActor('all')
                  setAction('all')
                  setPeriod('30d')
                }}
              >
                {t('alClear')}
              </Button>
            )}
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="w-10" />
                  <th className="px-3 py-2 text-start font-medium">
                    {t('alWhen')}
                  </th>
                  <th className="px-3 py-2 text-start font-medium">
                    {t('alActor')}
                  </th>
                  <th className="px-3 py-2 text-start font-medium">
                    {t('alAction')}
                  </th>
                  <th className="px-3 py-2 text-start font-medium">
                    {t('alObject')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((event) => {
                  const expanded = open.has(event.ref)
                  return (
                    <Fragment key={event.ref}>
                      <tr
                        className={cn(
                          'cursor-pointer hover:bg-muted/30',
                          expanded && 'bg-muted/30',
                        )}
                        onClick={() => toggle(event.ref)}
                      >
                        <td className="ps-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            aria-expanded={expanded}
                            aria-label={t('alShowChanges', { ref: event.ref })}
                            onClick={(click) => {
                              click.stopPropagation()
                              toggle(event.ref)
                            }}
                          >
                            <ChevronRight
                              className={cn(
                                'transition-transform rtl:-scale-x-100',
                                expanded && 'rotate-90 rtl:-rotate-90',
                              )}
                            />
                          </Button>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="block">{when(event.hours)}</span>
                          <span
                            dir="ltr"
                            className="block text-start text-xs text-muted-foreground tabular-nums"
                          >
                            {event.ref}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="flex items-center gap-2">
                            <Avatar className="size-6">
                              <AvatarFallback className="text-[0.625rem] font-semibold">
                                {event.actor
                                  .split(' ')
                                  .map((part) => part[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="whitespace-nowrap">
                              {event.actor}
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="flex items-center gap-1.5">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'rounded-full border-0',
                                actionMeta[event.action].tone,
                              )}
                            >
                              {t(actionMeta[event.action].key)}
                            </Badge>
                            {sensitive.has(event.action) && (
                              <ShieldAlert
                                aria-label={t('alSensitive')}
                                className="size-3.5 text-warning"
                              />
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="block">{event.object}</span>
                          <span
                            dir="ltr"
                            className="block text-start text-xs text-muted-foreground"
                          >
                            {event.objectRef}
                          </span>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-muted/20">
                          <td />
                          <td colSpan={4} className="px-3 pt-1 pb-3">
                            <p className="mb-2 text-xs text-muted-foreground">
                              {t('alFrom', { place: event.place })}
                            </p>
                            {event.changes.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                {t('alNoChanges')}
                              </p>
                            ) : (
                              <ul className="grid gap-1.5">
                                {event.changes.map((change) => (
                                  <li
                                    key={change.field}
                                    className="grid gap-1 rounded-md border bg-card px-3 py-2 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center"
                                  >
                                    <span className="text-xs font-medium text-muted-foreground">
                                      {change.field}
                                    </span>
                                    <span className="flex flex-wrap items-center gap-2 text-sm">
                                      <span
                                        className={cn(
                                          'rounded px-1.5',
                                          change.before
                                            ? 'bg-destructive/8 text-destructive line-through decoration-destructive/40'
                                            : 'text-muted-foreground italic',
                                        )}
                                      >
                                        <span className="sr-only">
                                          {t('alBefore')}:{' '}
                                        </span>
                                        <bdi>
                                          {change.before ?? t('alEmpty')}
                                        </bdi>
                                      </span>
                                      <ArrowRight
                                        aria-hidden="true"
                                        className="size-3.5 text-muted-foreground rtl:-scale-x-100"
                                      />
                                      <span
                                        className={cn(
                                          'rounded px-1.5',
                                          change.after
                                            ? 'bg-success/10 font-medium text-success'
                                            : 'text-muted-foreground italic',
                                        )}
                                      >
                                        <span className="sr-only">
                                          {t('alAfter')}:{' '}
                                        </span>
                                        <bdi>
                                          {change.after ?? t('alEmpty')}
                                        </bdi>
                                      </span>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
