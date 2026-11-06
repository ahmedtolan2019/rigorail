import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  CheckCheck,
  ClipboardList,
  Download,
  FileText,
  MessageSquare,
  MoreHorizontal,
  PackageCheck,
  Pencil,
  Printer,
  ReceiptText,
  Send,
  Stamp,
  Truck,
  type LucideIcon,
} from 'lucide-react'
import { compactMoney, date, money, relativeDate } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
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
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Textarea } from '@/shared/ui/textarea'
import { ns } from '../messages'
import { downloadText, registerCopy } from '../example-utils'
import {
  BudgetBar,
  FilePreview,
  Metric,
  RecordHeader,
  RelatedRecord,
  Sparkline,
  Stepper,
  type Step,
} from '../sections/record'

registerCopy({
  rtExport: ['Export order CSV', 'تصدير الطلب CSV'],
  rtSampleFile: ['Local sample file', 'ملف تجريبي محلي'],
  rtLifecycle: ['Order lifecycle', 'مراحل الطلب'],
  rtDraft: ['Draft', 'مسودة'],
  rtSubmitted: ['Submitted', 'مُرسل'],
  rtApproval: ['Approval', 'الاعتماد'],
  rtOrdered: ['Sent to supplier', 'أُرسل للمورد'],
  rtReceived: ['Received', 'الاستلام'],
  rtInvoiced: ['Invoiced', 'الفوترة'],
  rtWaitingFinance: ['Finance · 5 h left', 'المالية · متبقٍ 5 س'],
  rtInclVat: ['Including 15% VAT', 'شامل ضريبة 15%'],
  rtBudgetLeft: ['Operations Q4 left', 'المتبقي لعمليات الربع الرابع'],
  rtLeftAfter: ['{{value}} after this order', '{{value}} بعد هذا الطلب'],
  rtDelivery: ['Expected delivery', 'التسليم المتوقع'],
  rtInDays: ['In {{count}} days', 'خلال {{count}} أيام'],
  rtOnTime: ['Supplier on time', 'التزام المورد بالمواعيد'],
  rtOnTimeTrend: [
    'On-time delivery, last 8 months',
    'التسليم في الموعد آخر 8 أشهر',
  ],
  rtOnTimeUp: ['Up 6 points this year', 'ارتفع 6 نقاط هذا العام'],
  rtBudgetImpact: ['Budget impact', 'الأثر على الميزانية'],
  rtBudgetImpactHint: [
    'Operations, fourth quarter. This order is shown hatched until approved.',
    'العمليات، الربع الرابع. يظهر هذا الطلب مخططًا حتى يُعتمد.',
  ],
  rtSpent: ['Spent', 'المصروف'],
  rtCommitted: ['Committed', 'الملتزم به'],
  rtThisOrder: ['This order', 'هذا الطلب'],
  rtRemaining: ['Remaining', 'المتبقي'],
  rtBudgetSummary: [
    '{{left}} remains after approval, {{percent}} of the quarter budget.',
    'يتبقى {{left}} بعد الاعتماد، أي {{percent}} من ميزانية الربع.',
  ],
  rtWhereMoney: ['Where the money goes', 'توزيع المبلغ'],
  rtSupplier: ['Supplier', 'المورد'],
  rtSupplierSince: [
    'Supplier since 2019 · Net 45',
    'مورد منذ 2019 · خلال 45 يومًا',
  ],
  rtOpenOrders: ['Open orders', 'طلبات مفتوحة'],
  rtSpendYear: ['Spend this year', 'الإنفاق هذا العام'],
  rtRelated: ['Related records', 'سجلات مرتبطة'],
  rtRequest: ['Purchase request', 'طلب الشراء'],
  rtReceipt: ['Goods receipt', 'إيصال الاستلام'],
  rtInvoice: ['Supplier invoice', 'فاتورة المورد'],
  rtStatusApproved: ['Approved', 'معتمد'],
  rtStatusPending: ['Pending', 'قيد الانتظار'],
  rtStatusNotYet: ['Not received', 'لم تصل'],
  rtDeliveryWindow: ['Sun-Thu, 8:00-16:00', 'الأحد-الخميس، 8:00-16:00'],
  rtShare: ['Share', 'النسبة'],
  rtReceive: ['Record receipt', 'تسجيل الاستلام'],
  rtReceivedToast: [
    'Receipt GRN-0881 recorded for {{ref}}.',
    'تم تسجيل الاستلام GRN-0881 للطلب {{ref}}.',
  ],
  rtCommentAdded: ['Comment added.', 'تمت إضافة التعليق.'],
  rtUploaded: ['{{who}} · {{size}}', '{{who}} · {{size}}'],
})

const REF = 'PO-2041'
const day = 86_400_000
const lines = [
  { item: 'Barcode scanner', quantity: 12, price: 18_900 },
  { item: 'Thermal label printer', quantity: 4, price: 32_500 },
  { item: 'Label rolls (box)', quantity: 30, price: 1_250 },
  { item: 'Installation and training', quantity: 1, price: 60_000 },
]
const files = [
  {
    name: 'Quotation-Northwind.txt',
    kind: 'pdf' as const,
    size: '2 KB',
    content:
      'Sample quotation for PO-2041\nNorthwind Traders\nScanner, printer, label rolls and installation.\n',
    who: 'Lina Farouk',
  },
  {
    name: 'Price-comparison.csv',
    kind: 'sheet' as const,
    size: '1 KB',
    content:
      'Supplier,Item,Unit price\nNorthwind,Scanner,189\nContoso,Scanner,205\n',
    who: 'Lina Farouk',
  },
  {
    name: 'Delivery-terms.txt',
    kind: 'pdf' as const,
    size: '1 KB',
    content:
      'Sample delivery terms for PO-2041\nDelivery to Riyadh HQ. Inspect items on arrival.\n',
    who: 'Omar Haddad',
  },
]
interface Entry {
  icon: LucideIcon
  who: string
  key?: string
  text?: string
  hours: number
}
const history: Entry[] = [
  { icon: Send, who: 'Lina Farouk', key: 'historySubmitted', hours: 5 },
  { icon: Pencil, who: 'Lina Farouk', key: 'historyLines', hours: 26 },
  { icon: FileText, who: 'Lina Farouk', key: 'historyCreated', hours: 50 },
]
const subtotal = lines.reduce(
  (sum, line) => sum + line.quantity * line.price,
  0,
)
const tax = Math.round(subtotal * 0.15)
const total = subtotal + tax
// Operations Q4 budget in minor units.
const budget = { limit: 4_000_000, spent: 2_150_000, committed: 640_000 }
const onTime = [86, 88, 85, 90, 91, 89, 93, 94]

export default function RecordTabs() {
  const { t, i18n } = useTranslation(ns)
  const [approved, setApproved] = useState(false)
  const [received, setReceived] = useState(false)
  const [tab, setTab] = useState('overview')
  const [entries, setEntries] = useState(history)
  const [comment, setComment] = useState('')
  const left = budget.limit - budget.spent - budget.committed - total
  const percent = (value: number) =>
    new Intl.NumberFormat(i18n.language, { style: 'percent' }).format(value)

  const steps: Step[] = [
    {
      label: t('rtDraft'),
      meta: date(new Date(Date.now() - 2 * day).toISOString()),
      state: 'done',
    },
    {
      label: t('rtSubmitted'),
      meta: relativeDate(new Date(Date.now() - 5 * 3_600_000).toISOString()),
      state: 'done',
    },
    {
      label: t('rtApproval'),
      meta: approved ? t('you') : t('rtWaitingFinance'),
      state: approved ? 'done' : 'current',
    },
    {
      label: t('rtOrdered'),
      state: received ? 'done' : approved ? 'current' : 'upcoming',
    },
    { label: t('rtReceived'), state: received ? 'done' : 'upcoming' },
    { label: t('rtInvoiced'), state: received ? 'current' : 'upcoming' },
  ]
  const exportCsv = () =>
    downloadText(
      'PO-2041.csv',
      'Item,Quantity,Unit price (minor units)\n' +
        lines
          .map((line) => [line.item, line.quantity, line.price].join(','))
          .join('\n'),
      'text/csv',
    )

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:gap-4">
      <RecordHeader
        leading={
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"
          >
            <PackageCheck className="size-5" />
          </span>
        }
        title={<span dir="ltr">{REF}</span>}
        badges={
          <Badge
            variant="secondary"
            className={cn(
              'rounded-full border-0',
              received
                ? 'bg-info/12 text-info'
                : approved
                  ? 'bg-success/12 text-success'
                  : 'bg-warning/12 text-warning',
            )}
          >
            {received
              ? t('rtReceived')
              : approved
                ? t('approvedStatus')
                : t('awaitingApproval')}
          </Badge>
        }
        meta={
          <>
            Northwind Traders · {t('warehouseFitOut')} ·{' '}
            <bdi>{money(total)}</bdi>
          </>
        }
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-9"
                  aria-label={t('moreActions')}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer />
                  {t('print')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportCsv}>
                  <Download />
                  {t('rtExport')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {!approved ? (
              <ConfirmAction
                tone="default"
                icon={Stamp}
                title={t('poApproveTitle', { ref: REF })}
                description={t('poApproveHint')}
                details={[
                  [t('supplier'), 'Northwind Traders'],
                  [t('grandTotal'), <bdi key="total">{money(total)}</bdi>],
                  [t('rtBudgetLeft'), <bdi key="left">{money(left)}</bdi>],
                ]}
                confirmLabel={t('poApprove')}
                onConfirm={() => {
                  setApproved(true)
                  setEntries((list) => [
                    {
                      icon: CheckCheck,
                      who: 'You',
                      key: 'historyApproved',
                      hours: 0,
                    },
                    ...list,
                  ])
                  toast.success(t('poApproved', { ref: REF }))
                }}
              >
                <Button className="flex-1 sm:flex-none">
                  <CheckCheck data-icon="inline-start" />
                  {t('poApprove')}
                </Button>
              </ConfirmAction>
            ) : (
              !received && (
                <Button
                  className="flex-1 sm:flex-none"
                  onClick={() => {
                    setReceived(true)
                    setEntries((list) => [
                      {
                        icon: Truck,
                        who: 'You',
                        text: 'GRN-0881',
                        key: 'rtReceived',
                        hours: 0,
                      },
                      ...list,
                    ])
                    toast.success(t('rtReceivedToast', { ref: REF }))
                  }}
                >
                  <Truck data-icon="inline-start" />
                  {t('rtReceive')}
                </Button>
              )
            )}
          </>
        }
      >
        <Stepper steps={steps} label={t('rtLifecycle')} />
      </RecordHeader>

      <Card className="grid grid-cols-2 gap-x-6 gap-y-5 px-5 py-4 lg:grid-cols-4">
        <Metric
          label={t('grandTotal')}
          value={<bdi>{money(total)}</bdi>}
          hint={t('rtInclVat')}
        />
        <Metric
          label={t('rtBudgetLeft')}
          value={<bdi>{compactMoney(left)}</bdi>}
          hint={t('rtLeftAfter', { value: percent(left / budget.limit) })}
          hintTone={left / budget.limit < 0.15 ? 'warning' : 'muted'}
        >
          <BudgetBar
            legend={false}
            label={t('rtBudgetImpact')}
            limit={budget.limit}
            format={money}
            segments={[
              { label: t('rtSpent'), value: budget.spent, tone: 'primary' },
              {
                label: t('rtCommitted'),
                value: budget.committed,
                tone: 'info',
              },
              {
                label: t('rtThisOrder'),
                value: total,
                tone: 'warning',
                pending: !approved,
              },
            ]}
          />
        </Metric>
        <Metric
          label={t('rtDelivery')}
          value={received ? t('rtReceived') : t('rtInDays', { count: 9 })}
          hint={date(new Date(Date.now() + 9 * day).toISOString())}
        />
        <Metric
          label={t('rtOnTime')}
          value="94%"
          hint={t('rtOnTimeUp')}
          hintTone="success"
        >
          <Sparkline
            values={onTime}
            tone="success"
            label={t('rtOnTimeTrend')}
            className="h-6"
          />
        </Metric>
      </Card>

      <Tabs value={tab} onValueChange={setTab} className="min-w-0">
        <div className="-mx-(--page-space) overflow-x-auto px-(--page-space) lg:mx-0 lg:px-0">
          <TabsList>
            <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
            <TabsTrigger value="lines" className="gap-1.5">
              {t('linesLabel')}
              <Count value={lines.length} />
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-1.5">
              {t('files')}
              <Count value={files.length} />
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              {t('history')}
              <Count value={entries.length} />
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="overview"
          className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-3 lg:gap-4"
        >
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 lg:col-span-2 lg:gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('rtBudgetImpact')}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t('rtBudgetImpactHint')}
                </p>
              </CardHeader>
              <CardContent className="grid gap-3">
                <BudgetBar
                  label={t('rtBudgetImpact')}
                  limit={budget.limit}
                  format={compactMoney}
                  segments={[
                    {
                      label: t('rtSpent'),
                      value: budget.spent,
                      tone: 'primary',
                    },
                    {
                      label: t('rtCommitted'),
                      value: budget.committed,
                      tone: 'info',
                    },
                    {
                      label: t('rtThisOrder'),
                      value: total,
                      tone: 'warning',
                      pending: !approved,
                    },
                  ]}
                />
                <p className="text-sm">
                  {t('rtBudgetSummary', {
                    left: money(left),
                    percent: percent(left / budget.limit),
                  })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('rtWhereMoney')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3">
                  {[...lines]
                    .sort((a, b) => b.price * b.quantity - a.price * a.quantity)
                    .map((line) => {
                      const value = line.price * line.quantity
                      return (
                        <li key={line.item} className="grid gap-1.5">
                          <div className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="truncate">{line.item}</span>
                            <bdi className="shrink-0 font-medium tabular-nums">
                              {money(value)}
                            </bdi>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary/70"
                              style={{ width: `${(value / subtotal) * 100}%` }}
                            />
                          </div>
                        </li>
                      )
                    })}
                </ul>
              </CardContent>
            </Card>
          </div>
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 lg:gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('rtSupplier')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid size-10 place-items-center rounded-lg bg-foreground text-sm font-bold text-background"
                  >
                    NT
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">Northwind Traders</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t('rtSupplierSince')}
                    </p>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {t('rtOpenOrders')}
                    </dt>
                    <dd className="font-medium tabular-nums">3</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {t('rtSpendYear')}
                    </dt>
                    <dd className="font-medium tabular-nums">
                      <bdi>{compactMoney(18_420_000)}</bdi>
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            <Card className="gap-2">
              <CardHeader>
                <CardTitle>{t('rtRelated')}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-[minmax(0,1fr)] gap-0.5 px-3 2xl:px-4">
                <RelatedRecord
                  icon={ClipboardList}
                  reference="REQ-1212"
                  title={t('rtRequest')}
                  status={t('rtStatusApproved')}
                  tone="success"
                />
                <RelatedRecord
                  icon={Truck}
                  reference="GRN-0881"
                  title={t('rtReceipt')}
                  status={
                    received ? t('rtStatusApproved') : t('rtStatusPending')
                  }
                  tone={received ? 'success' : 'warning'}
                />
                <RelatedRecord
                  icon={ReceiptText}
                  reference="INV-3301"
                  title={t('rtInvoice')}
                  status={t('rtStatusNotYet')}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('deliverTo')}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <address className="leading-relaxed not-italic">
                  Jeddah Distribution Centre
                  <br />
                  Industrial City, Phase 3, Jeddah 21442
                </address>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('rtDeliveryWindow')}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lines" className="min-w-0">
          <div className="overflow-hidden rounded-lg border bg-card">
            <Table className="min-w-[36rem]">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{t('item')}</TableHead>
                  <TableHead className="text-end">{t('quantity')}</TableHead>
                  <TableHead className="text-end">{t('unitPrice')}</TableHead>
                  <TableHead className="w-32">{t('rtShare')}</TableHead>
                  <TableHead className="text-end">{t('lineTotal')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.item}>
                    <TableCell className="font-medium">{line.item}</TableCell>
                    <TableCell className="text-end tabular-nums">
                      {line.quantity}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      <bdi>{money(line.price)}</bdi>
                    </TableCell>
                    <TableCell>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/70"
                          style={{
                            width: `${((line.price * line.quantity) / subtotal) * 100}%`,
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-end font-medium tabular-nums">
                      <bdi>{money(line.price * line.quantity)}</bdi>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                {(
                  [
                    [t('subtotal'), subtotal],
                    [t('tax'), tax],
                    [t('grandTotal'), total],
                  ] as const
                ).map(([label, value], index) => (
                  <TableRow
                    key={label}
                    className={cn(index < 2 && 'text-muted-foreground')}
                  >
                    <TableCell colSpan={4} className="text-end">
                      {label}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      <bdi>{money(value)}</bdi>
                    </TableCell>
                  </TableRow>
                ))}
              </TableFooter>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="files">
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {files.map((file) => (
              <li key={file.name}>
                <FilePreview
                  name={file.name}
                  kind={file.kind}
                  meta={`${t('rtUploaded', { who: file.who, size: file.size })} · ${t('rtSampleFile')}`}
                  downloadLabel={t('downloadFile', { name: file.name })}
                  onDownload={() =>
                    downloadText(
                      file.name,
                      file.content,
                      file.name.endsWith('.csv') ? 'text/csv' : 'text/plain',
                    )
                  }
                />
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="history">
          <Card className="gap-4 px-5 py-4">
            <form
              className="grid gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                if (!comment.trim()) return
                setEntries((list) => [
                  {
                    icon: MessageSquare,
                    who: 'You',
                    text: comment.trim(),
                    hours: 0,
                  },
                  ...list,
                ])
                setComment('')
                toast.success(t('rtCommentAdded'))
              }}
            >
              <Textarea
                aria-label={t('addComment')}
                placeholder={t('commentPlaceholder')}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={2}
              />
              <Button
                type="submit"
                size="sm"
                className="justify-self-end"
                disabled={!comment.trim()}
              >
                {t('comment')}
              </Button>
            </form>
            <ol className="relative grid gap-5 before:absolute before:inset-y-2 before:start-3.5 before:w-px before:bg-border">
              {entries.map((entry, index) => (
                <li
                  key={index}
                  className="relative flex animate-in items-start gap-3 duration-200 fade-in-0"
                >
                  <span className="relative grid size-7 shrink-0 place-items-center rounded-full border bg-card text-muted-foreground">
                    <entry.icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 pt-0.5 text-sm">
                    <p>
                      <span className="font-medium">
                        {entry.who === 'You' ? t('you') : entry.who}
                      </span>{' '}
                      {entry.key && (
                        <span className="text-muted-foreground">
                          {t(entry.key)}
                        </span>
                      )}
                      {entry.key && entry.text && (
                        <>
                          {' '}
                          <span dir="ltr">{entry.text}</span>
                        </>
                      )}
                    </p>
                    {!entry.key && entry.text && (
                      <p
                        dir="auto"
                        className="mt-1 rounded-lg bg-muted/60 px-3 py-2 text-start break-words whitespace-pre-wrap"
                      >
                        {entry.text}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
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
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Count({ value }: { value: number }) {
  return (
    <span className="rounded-full bg-muted-foreground/12 px-1.5 text-[0.6875rem] leading-4 tabular-nums">
      {value}
    </span>
  )
}
