import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Banknote,
  Download,
  Eye,
  Mail,
  Printer,
  type LucideIcon,
} from 'lucide-react'
import { date, money } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { ConfirmAction } from '@/shared/ui/confirm-action'
import { ns } from '../messages'

const day = 86_400_000
const issued = Date.now() - 12 * day
const lines = [
  {
    item: 'Barcode scanner',
    detail: 'Model BS-200, 2-year warranty',
    quantity: 12,
    price: 18_900,
  },
  {
    item: 'Thermal label printer',
    detail: '203 dpi, USB and Ethernet',
    quantity: 4,
    price: 32_500,
  },
  {
    item: 'Label rolls (box)',
    detail: '1,000 labels per roll, 12 rolls',
    quantity: 30,
    price: 1_250,
  },
  {
    item: 'Installation and training',
    detail: 'On site, one day',
    quantity: 1,
    price: 60_000,
  },
]
const subtotal = lines.reduce(
  (sum, line) => sum + line.quantity * line.price,
  0,
)
const tax = Math.round(subtotal * 0.15)
const total = subtotal + tax
const events: { icon: LucideIcon; key: string; days: number }[] = [
  { icon: Eye, key: 'docViewed', days: 9 },
  { icon: Mail, key: 'docSent', days: 12 },
]

export default function DocumentView() {
  const { t } = useTranslation(ns)
  const [paid, setPaid] = useState(false)
  const overdue = !paid
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:gap-4 2xl:grid-cols-[minmax(0,1fr)_16rem]">
      {/* Document typography on a paper surface; the same markup prints. */}
      <article
        aria-label={t('invoiceLabel', { ref: 'INV-3301' })}
        className="min-w-0 rounded-xl border bg-card px-6 py-8 shadow-sm sm:px-10 sm:py-10 print:border-0 print:shadow-none"
      >
        <header className="flex flex-wrap items-start justify-between gap-6 border-b pb-6">
          <div>
            <div className="mb-3 grid size-10 place-items-center rounded-lg bg-foreground text-sm font-bold text-background">
              F
            </div>
            <p className="font-semibold">Foundation Trading Co.</p>
            <p className="text-sm text-muted-foreground">
              King Fahd Road, Riyadh 12271
            </p>
            <p className="text-sm text-muted-foreground">
              {t('vatNumber')}: <span dir="ltr">300011122200003</span>
            </p>
          </div>
          <div className="text-end">
            <p className="text-2xl font-semibold tracking-tight">
              {t('invoice')}
            </p>
            <p
              dir="ltr"
              className="text-sm text-muted-foreground tabular-nums rtl:text-end"
            >
              INV-3301
            </p>
            <Badge
              variant="secondary"
              className={cn(
                'mt-2 rounded-full border-0',
                paid
                  ? 'bg-success/12 text-success'
                  : 'bg-destructive/10 text-destructive',
              )}
            >
              {paid ? t('paidStatus') : t('overdueDays', { count: 2 })}
            </Badge>
          </div>
        </header>
        <section className="grid gap-6 border-b py-6 sm:grid-cols-3">
          <div>
            <h3 className="mb-1 text-xs font-medium text-muted-foreground uppercase">
              {t('billTo')}
            </h3>
            <p className="text-sm font-medium">Adatum Software</p>
            <p className="text-sm text-muted-foreground">
              Olaya Street, Riyadh 12214
            </p>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm sm:col-span-2 sm:justify-self-end">
            <dt className="text-muted-foreground">{t('issued')}</dt>
            <dd className="text-end">{date(new Date(issued).toISOString())}</dd>
            <dt className="text-muted-foreground">{t('dueDate')}</dt>
            <dd
              className={cn(
                'text-end',
                overdue && 'font-medium text-destructive',
              )}
            >
              {date(new Date(issued + 10 * day).toISOString())}
            </dd>
            <dt className="text-muted-foreground">{t('poReference')}</dt>
            <dd dir="ltr" className="text-end rtl:text-start">
              PO-2041
            </dd>
          </dl>
        </section>
        <div
          className="overflow-x-auto rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          tabIndex={0}
          role="region"
          aria-label={t('document')}
        >
          <table className="w-full min-w-[30rem] text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="py-3 text-start font-medium">
                  {t('description')}
                </th>
                <th className="py-3 text-end font-medium">{t('quantity')}</th>
                <th className="py-3 text-end font-medium">{t('unitPrice')}</th>
                <th className="py-3 text-end font-medium">{t('lineTotal')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lines.map((line) => (
                <tr key={line.item}>
                  <td className="py-3">
                    <p className="font-medium">{line.item}</p>
                    <p className="text-xs text-muted-foreground">
                      {line.detail}
                    </p>
                  </td>
                  <td className="py-3 text-end align-top tabular-nums">
                    {line.quantity}
                  </td>
                  <td className="py-3 text-end align-top tabular-nums">
                    <bdi>{money(line.price)}</bdi>
                  </td>
                  <td className="py-3 text-end align-top font-medium tabular-nums">
                    <bdi>{money(line.price * line.quantity)}</bdi>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="ms-auto mt-4 grid max-w-72 grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 border-t pt-4 text-sm">
          <dt className="text-muted-foreground">{t('subtotal')}</dt>
          <dd className="text-end tabular-nums">
            <bdi>{money(subtotal)}</bdi>
          </dd>
          <dt className="text-muted-foreground">{t('tax')}</dt>
          <dd className="text-end tabular-nums">
            <bdi>{money(tax)}</bdi>
          </dd>
          <dt className="border-t pt-2 font-semibold">{t('amountDue')}</dt>
          <dd className="border-t pt-2 text-end text-lg font-semibold tabular-nums">
            <bdi>{money(paid ? 0 : total)}</bdi>
          </dd>
        </dl>
        <footer className="mt-8 grid gap-1 border-t pt-4 text-xs text-muted-foreground">
          <p>{t('paymentInstructions')}</p>
          <p dir="ltr" className="text-start tabular-nums">
            IBAN SA03 8000 0000 6080 1016 7519
          </p>
        </footer>
      </article>
      <div className="order-first grid content-start gap-3 sm:grid-cols-2 2xl:sticky 2xl:top-20 2xl:order-none 2xl:grid-cols-1 2xl:self-start">
        <Card className="gap-2 px-4 py-4">
          {!paid && (
            <ConfirmAction
              tone="default"
              icon={Banknote}
              title={t('recordPaymentTitle', { ref: 'INV-3301' })}
              description={t('recordPaymentHint')}
              details={[
                [t('amount'), <bdi key="amount">{money(total)}</bdi>],
                [t('paymentMethod'), t('bankTransfer')],
              ]}
              confirmLabel={t('recordPayment')}
              onConfirm={() => {
                setPaid(true)
                toast.success(t('paymentRecorded'))
              }}
            >
              <Button className="w-full">
                <Banknote data-icon="inline-start" />
                {t('recordPayment')}
              </Button>
            </ConfirmAction>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => toast.success(t('reminderEmailed'))}
            disabled={paid}
          >
            <Mail data-icon="inline-start" />
            {t('sendReminder')}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" size="sm" onClick={() => window.print()}>
              <Printer data-icon="inline-start" />
              {t('print')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast(t('downloadStarted'))}
            >
              <Download data-icon="inline-start" />
              PDF
            </Button>
          </div>
        </Card>
        <Card className="gap-3 px-4 py-4">
          <h3 className="text-sm font-semibold">{t('history')}</h3>
          <ol className="grid gap-3 text-sm">
            {(paid
              ? [{ icon: Banknote, key: 'docPaid', days: 0 }, ...events]
              : events
            ).map((event) => (
              <li key={event.key} className="flex items-center gap-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                  <event.icon className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block">{t(event.key)}</span>
                  <span className="block text-xs text-muted-foreground">
                    {date(
                      new Date(Date.now() - event.days * day).toISOString(),
                    )}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  )
}
