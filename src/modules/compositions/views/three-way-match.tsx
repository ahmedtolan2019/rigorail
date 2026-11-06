import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  CircleCheck,
  CircleX,
  FileWarning,
  PackageCheck,
  ReceiptText,
  ShoppingCart,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { money } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { ConfirmAction } from '@/shared/ui/confirm-action'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { ns } from '../messages'
import { registerCopy } from '../example-utils'
import { RecordHeader } from '../sections/record'

registerCopy({
  twTitle: ['Match exception', 'استثناء المطابقة'],
  twMeta: [
    'Invoice INV-7720 from Contoso Office · held from payment',
    'الفاتورة INV-7720 من Contoso Office · موقوفة عن الدفع',
  ],
  twHeld: ['Payment held', 'الدفع موقوف'],
  twReleased: ['Released for payment', 'مُفرج للدفع'],
  twRejected: ['Returned to supplier', 'أُعيدت للمورد'],
  twOrdered: ['Ordered', 'المطلوب'],
  twReceived: ['Received', 'المستلم'],
  twInvoiced: ['Invoiced', 'المفوتر'],
  twCheck: ['Check', 'الفحص'],
  twTolerance: [
    'Price tolerance ±2%, quantity must not exceed receipt',
    'تفاوت السعر ±2%، ولا تتجاوز الكمية المستلمة',
  ],
  twQtyOver: [
    'Billed {{count}} more than received',
    'فوتر {{count}} أكثر من المستلم',
  ],
  twPriceOver: [
    'Price {{percent}} above order',
    'السعر أعلى من الطلب بـ {{percent}}',
  ],
  twOk: ['Within tolerance', 'ضمن التفاوت'],
  twAtRisk: ['At risk', 'المبلغ المعرض'],
  twAtRiskHint: [
    'Amount billed beyond what was ordered and received',
    'المبلغ المفوتر بما يتجاوز المطلوب والمستلم',
  ],
  twLinesOk: [
    '{{ok}} of {{total}} lines match',
    'تتطابق {{ok}} من {{total}} بنود',
  ],
  twResolution: ['Resolution', 'المعالجة'],
  twResolutionHint: [
    'Choose how each mismatched line is settled.',
    'اختر طريقة معالجة كل بند غير مطابق.',
  ],
  twPayReceived: ['Pay for received quantity', 'الدفع مقابل الكمية المستلمة'],
  twPayOrderPrice: ['Pay at order price', 'الدفع بسعر الطلب'],
  twAcceptVariance: ['Accept the difference', 'قبول الفرق'],
  twRequestCredit: ['Request a credit note', 'طلب إشعار دائن'],
  twPayable: ['Payable after resolution', 'المستحق بعد المعالجة'],
  twRelease: ['Release {{amount}}', 'الإفراج عن {{amount}}'],
  twReleaseTitle: [
    'Release INV-7720 for payment?',
    'الإفراج عن INV-7720 للدفع؟',
  ],
  twReleaseHint: [
    'The payable amount joins the next payment run. Differences are recorded on the invoice.',
    'ينضم المبلغ المستحق إلى دفعة السداد التالية، وتُسجل الفروق على الفاتورة.',
  ],
  twReturn: ['Return to supplier', 'إعادة للمورد'],
  twReturnTitle: [
    'Return INV-7720 to Contoso Office?',
    'إعادة INV-7720 إلى Contoso Office؟',
  ],
  twReturnHint: [
    'The supplier is asked for a corrected invoice. Nothing is paid.',
    'يُطلب من المورد فاتورة مصححة. لن يُدفع شيء.',
  ],
  twReleasedToast: [
    'INV-7720 released for {{amount}}.',
    'تم الإفراج عن INV-7720 بمبلغ {{amount}}.',
  ],
  twReturnedToast: [
    'INV-7720 returned to the supplier.',
    'أُعيدت INV-7720 إلى المورد.',
  ],
  twDocs: ['Documents', 'المستندات'],
  twChoose: ['Choose a resolution', 'اختر المعالجة'],
})

interface Line {
  item: string
  ordered: number
  received: number
  invoiced: number
  orderPrice: number
  invoicePrice: number
}
const lines: Line[] = [
  {
    item: 'Ergonomic chair',
    ordered: 10,
    received: 10,
    invoiced: 10,
    orderPrice: 42_000,
    invoicePrice: 42_000,
  },
  {
    item: 'Standing desk',
    ordered: 6,
    received: 4,
    invoiced: 6,
    orderPrice: 61_500,
    invoicePrice: 61_500,
  },
  {
    item: 'Monitor arm',
    ordered: 12,
    received: 12,
    invoiced: 12,
    orderPrice: 8_900,
    invoicePrice: 9_450,
  },
  {
    item: 'Cable tray',
    ordered: 20,
    received: 20,
    invoiced: 20,
    orderPrice: 1_200,
    invoicePrice: 1_210,
  },
]
const TOLERANCE = 0.02
type Fix = 'payReceived' | 'requestCredit' | 'payOrderPrice' | 'acceptVariance'
const issues = (line: Line) => ({
  quantity: line.invoiced - line.received,
  price: line.invoicePrice / line.orderPrice - 1,
})
const docs: { icon: LucideIcon; ref: string; key: string }[] = [
  { icon: ShoppingCart, ref: 'PO-2038', key: 'twOrdered' },
  { icon: PackageCheck, ref: 'GRN-0874', key: 'twReceived' },
  { icon: ReceiptText, ref: 'INV-7720', key: 'twInvoiced' },
]

export default function ThreeWayMatch() {
  const { t, i18n } = useTranslation(ns)
  const [fixes, setFixes] = useState<Record<string, Fix>>({})
  const [state, setState] = useState<'held' | 'released' | 'returned'>('held')
  const percent = (value: number) =>
    new Intl.NumberFormat(i18n.language, {
      style: 'percent',
      maximumFractionDigits: 1,
    }).format(value)
  const flagged = lines.filter((line) => {
    const issue = issues(line)
    return issue.quantity > 0 || issue.price > TOLERANCE
  })
  const invoiceTotal = lines.reduce(
    (sum, line) => sum + line.invoiced * line.invoicePrice,
    0,
  )
  const fair = lines.reduce(
    (sum, line) =>
      sum +
      Math.min(line.invoiced, line.received) *
        Math.min(line.invoicePrice, line.orderPrice * (1 + TOLERANCE)),
    0,
  )
  const payable = lines.reduce((sum, line) => {
    const fix = fixes[line.item]
    const quantity =
      fix === 'payReceived' || fix === 'requestCredit'
        ? line.received
        : line.invoiced
    const issue = issues(line)
    const price =
      issue.price > TOLERANCE && fix !== 'acceptVariance'
        ? line.orderPrice
        : line.invoicePrice
    return sum + quantity * price
  }, 0)
  const resolved = flagged.every((line) => fixes[line.item])

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:gap-4">
      <RecordHeader
        leading={
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-lg bg-warning/12 text-warning"
          >
            <FileWarning className="size-5" />
          </span>
        }
        title={t('twTitle')}
        badges={
          <Badge
            variant="secondary"
            className={cn(
              'rounded-full border-0',
              state === 'released'
                ? 'bg-success/12 text-success'
                : state === 'returned'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-warning/12 text-warning',
            )}
          >
            {state === 'released'
              ? t('twReleased')
              : state === 'returned'
                ? t('twRejected')
                : t('twHeld')}
          </Badge>
        }
        meta={t('twMeta')}
        actions={
          state === 'held' && (
            <>
              <ConfirmAction
                tone="warning"
                title={t('twReturnTitle')}
                description={t('twReturnHint')}
                confirmLabel={t('twReturn')}
                onConfirm={() => {
                  setState('returned')
                  toast(t('twReturnedToast'))
                }}
              >
                <Button variant="outline" className="flex-1 sm:flex-none">
                  {t('twReturn')}
                </Button>
              </ConfirmAction>
              <ConfirmAction
                tone="default"
                title={t('twReleaseTitle')}
                description={t('twReleaseHint')}
                details={[
                  [
                    t('twInvoiced'),
                    <bdi key="invoice">{money(invoiceTotal)}</bdi>,
                  ],
                  [t('twPayable'), <bdi key="payable">{money(payable)}</bdi>],
                ]}
                confirmLabel={t('twRelease', { amount: money(payable) })}
                onConfirm={() => {
                  setState('released')
                  toast.success(
                    t('twReleasedToast', { amount: money(payable) }),
                  )
                }}
              >
                <Button className="flex-1 sm:flex-none" disabled={!resolved}>
                  {t('twRelease', { amount: money(payable) })}
                </Button>
              </ConfirmAction>
            </>
          )
        }
      >
        {/* The three documents as one chain, so the mismatch reads as a broken link. */}
        <ol aria-label={t('twDocs')} className="grid gap-2 sm:grid-cols-3">
          {docs.map((doc, index) => (
            <li
              key={doc.ref}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-3 py-2',
                index === 2 &&
                  state === 'held' &&
                  'border-warning/50 bg-warning/5',
              )}
            >
              <doc.icon
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
              />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t(doc.key)}</p>
                <p
                  dir="ltr"
                  className="text-start text-sm font-medium tabular-nums"
                >
                  {doc.ref}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </RecordHeader>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:gap-4 2xl:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="min-w-0 gap-0 overflow-hidden py-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b px-4 py-3">
            <h3 className="text-sm font-semibold">
              {t('twLinesOk', {
                ok: lines.length - flagged.length,
                total: lines.length,
              })}
            </h3>
            <p className="text-xs text-muted-foreground">{t('twTolerance')}</p>
          </div>
          <div
            className="overflow-x-auto rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            tabIndex={0}
            role="region"
            aria-label={t('three-way-match')}
          >
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-start font-medium">
                    {t('item')}
                  </th>
                  <th className="px-3 py-2 text-end font-medium">
                    {t('twOrdered')}
                  </th>
                  <th className="px-3 py-2 text-end font-medium">
                    {t('twReceived')}
                  </th>
                  <th className="px-3 py-2 text-end font-medium">
                    {t('twInvoiced')}
                  </th>
                  <th className="px-3 py-2 text-end font-medium">
                    {t('unitPrice')}
                  </th>
                  <th className="px-4 py-2 text-start font-medium">
                    {t('twCheck')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lines.map((line) => {
                  const issue = issues(line)
                  const qtyBad = issue.quantity > 0
                  const priceBad = issue.price > TOLERANCE
                  const bad = qtyBad || priceBad
                  return (
                    <tr key={line.item} className={cn(bad && 'bg-warning/5')}>
                      <td className="px-4 py-2.5 font-medium">{line.item}</td>
                      <td className="px-3 py-2.5 text-end tabular-nums">
                        {line.ordered}
                      </td>
                      <td className="px-3 py-2.5 text-end tabular-nums">
                        {line.received}
                      </td>
                      <td
                        className={cn(
                          'px-3 py-2.5 text-end tabular-nums',
                          qtyBad && 'font-semibold text-destructive',
                        )}
                      >
                        {line.invoiced}
                      </td>
                      <td
                        className={cn(
                          'px-3 py-2.5 text-end tabular-nums',
                          priceBad && 'font-semibold text-destructive',
                        )}
                      >
                        <bdi>{money(line.invoicePrice)}</bdi>
                        {line.invoicePrice !== line.orderPrice && (
                          <span className="block text-xs font-normal text-muted-foreground line-through">
                            <bdi>{money(line.orderPrice)}</bdi>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {bad ? (
                          <span className="flex items-start gap-1.5 text-xs font-medium text-destructive">
                            <CircleX
                              aria-hidden="true"
                              className="mt-px size-3.5 shrink-0"
                            />
                            <span>
                              {qtyBad && (
                                <span className="block">
                                  {t('twQtyOver', { count: issue.quantity })}
                                </span>
                              )}
                              {priceBad && (
                                <span className="block">
                                  {t('twPriceOver', {
                                    percent: percent(issue.price),
                                  })}
                                </span>
                              )}
                            </span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs text-success">
                            <CircleCheck
                              aria-hidden="true"
                              className="size-3.5"
                            />
                            {t('twOk')}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="gap-4 px-5 py-4 2xl:self-start">
          <div>
            <p className="text-xs text-muted-foreground">{t('twAtRisk')}</p>
            <p className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-destructive tabular-nums">
              <TriangleAlert aria-hidden="true" className="size-5" />
              <bdi>{money(invoiceTotal - fair)}</bdi>
            </p>
            <p className="text-xs text-muted-foreground">{t('twAtRiskHint')}</p>
          </div>
          <div className="grid gap-3 border-t pt-4">
            <div>
              <h3 className="text-sm font-semibold">{t('twResolution')}</h3>
              <p className="text-xs text-muted-foreground">
                {t('twResolutionHint')}
              </p>
            </div>
            {flagged.map((line, position) => {
              const issue = issues(line)
              const options: Fix[] =
                issue.quantity > 0
                  ? ['payReceived', 'requestCredit']
                  : ['payOrderPrice', 'acceptVariance']
              return (
                <div key={line.item} className="grid gap-1.5">
                  <label
                    id={`twfix-${position}`}
                    className="text-sm font-medium"
                  >
                    {line.item}
                  </label>
                  <Select
                    value={fixes[line.item]}
                    disabled={state !== 'held'}
                    onValueChange={(value) =>
                      setFixes((current) => ({
                        ...current,
                        [line.item]: value as Fix,
                      }))
                    }
                  >
                    <SelectTrigger
                      aria-labelledby={`twfix-${position}`}
                      className={cn(
                        'w-full',
                        !fixes[line.item] && 'border-warning',
                      )}
                    >
                      <SelectValue placeholder={t('twChoose')} />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(`tw${option[0]!.toUpperCase()}${option.slice(1)}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            })}
          </div>
          <dl className="grid grid-cols-[1fr_auto] gap-y-1.5 border-t pt-4 text-sm [&_dt]:pe-4">
            <dt className="text-muted-foreground">{t('twInvoiced')}</dt>
            <dd className="text-end tabular-nums">
              <bdi>{money(invoiceTotal)}</bdi>
            </dd>
            <dt className="font-medium">{t('twPayable')}</dt>
            <dd className="text-end font-semibold tabular-nums">
              <bdi>{money(payable)}</bdi>
            </dd>
          </dl>
        </Card>
      </div>
    </div>
  )
}
