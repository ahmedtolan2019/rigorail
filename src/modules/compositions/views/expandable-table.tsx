import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { date, money } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Progress } from '@/shared/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { ns } from '../messages'

interface Line {
  item: string
  quantity: number
  price: number
  received: number
}
interface Order {
  ref: string
  supplier: string
  /** Days ago. */
  ordered: number
  lines: Line[]
}
const day = 86_400_000
const orders: Order[] = [
  {
    ref: 'PO-2041',
    supplier: 'Northwind Traders',
    ordered: 2,
    lines: [
      { item: 'Barcode scanner', quantity: 12, price: 18_900, received: 0 },
      {
        item: 'Thermal label printer',
        quantity: 4,
        price: 32_500,
        received: 0,
      },
      { item: 'Label rolls (box)', quantity: 30, price: 1_250, received: 0 },
    ],
  },
  {
    ref: 'PO-2038',
    supplier: 'Contoso Office',
    ordered: 6,
    lines: [
      { item: 'Ergonomic chair', quantity: 10, price: 42_000, received: 10 },
      { item: 'Standing desk', quantity: 6, price: 61_500, received: 2 },
    ],
  },
  {
    ref: 'PO-2033',
    supplier: 'Fabrikam Industrial',
    ordered: 13,
    lines: [
      { item: 'Safety helmet', quantity: 50, price: 2_400, received: 50 },
      {
        item: 'High-visibility vest',
        quantity: 50,
        price: 1_100,
        received: 50,
      },
      {
        item: 'Safety gloves (pair)',
        quantity: 120,
        price: 450,
        received: 120,
      },
      { item: 'First aid kit', quantity: 8, price: 6_900, received: 8 },
    ],
  },
  {
    ref: 'PO-2029',
    supplier: 'Adatum Software',
    ordered: 21,
    lines: [
      {
        item: 'Analytics add-on (annual)',
        quantity: 1,
        price: 450_000,
        received: 1,
      },
    ],
  },
]
const total = (order: Order) =>
  order.lines.reduce((sum, line) => sum + line.quantity * line.price, 0)
function status(order: Order) {
  const done = order.lines.filter(
    (line) => line.received >= line.quantity,
  ).length
  return done === order.lines.length
    ? 'received'
    : order.lines.some((line) => line.received > 0)
      ? 'partial'
      : 'open'
}
const statusTone = {
  open: 'bg-info/12 text-info',
  partial: 'bg-warning/12 text-warning',
  received: 'bg-success/12 text-success',
}
const statusLabel = {
  open: 'statusOpen',
  partial: 'statusPartial',
  received: 'statusReceived',
} as const

export default function ExpandableTable() {
  const { t } = useTranslation(ns)
  const [open, setOpen] = useState<Set<string>>(() => new Set(['PO-2038']))
  const allOpen = open.size === orders.length
  const toggle = (ref: string) =>
    setOpen((current) => {
      const next = new Set(current)
      if (next.has(ref)) next.delete(ref)
      else next.add(ref)
      return next
    })
  return (
    <div className="grid gap-3">
      <div className="flex items-center">
        <p className="text-sm text-muted-foreground">
          {t('ordersCount', { count: orders.length })}
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="ms-auto"
          onClick={() =>
            setOpen(
              allOpen ? new Set() : new Set(orders.map((order) => order.ref)),
            )
          }
        >
          {allOpen ? (
            <ChevronsDownUp data-icon="inline-start" />
          ) : (
            <ChevronsUpDown data-icon="inline-start" />
          )}
          {allOpen ? t('collapseAll') : t('expandAll')}
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table className="min-w-[40rem]">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10">
                <span className="sr-only">{t('expandAll')}</span>
              </TableHead>
              <TableHead>{t('order')}</TableHead>
              <TableHead>{t('supplier')}</TableHead>
              <TableHead>{t('orderDate')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead className="text-end">{t('lineTotal')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const expanded = open.has(order.ref)
              const state = status(order)
              const received = order.lines.filter(
                (line) => line.received >= line.quantity,
              ).length
              return (
                <Fragment key={order.ref}>
                  <TableRow
                    data-state={expanded ? 'selected' : undefined}
                    className="cursor-pointer"
                    onClick={() => toggle(order.ref)}
                  >
                    <TableCell className="py-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        aria-expanded={expanded}
                        aria-controls={`lines-${order.ref}`}
                        aria-label={t('showLines', { ref: order.ref })}
                        onClick={(event) => {
                          event.stopPropagation()
                          toggle(order.ref)
                        }}
                      >
                        <ChevronRight
                          className={cn(
                            'transition-transform duration-200 rtl:-scale-x-100',
                            expanded && 'rotate-90 rtl:-rotate-90',
                          )}
                        />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      <span dir="ltr">{order.ref}</span>
                    </TableCell>
                    <TableCell>{order.supplier}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {date(
                        new Date(
                          Date.now() - order.ordered * day,
                        ).toISOString(),
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'rounded-full border-0',
                          statusTone[state],
                        )}
                      >
                        {t(statusLabel[state])}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end font-medium tabular-nums">
                      <bdi>{money(total(order))}</bdi>
                    </TableCell>
                  </TableRow>
                  {expanded && (
                    <TableRow
                      id={`lines-${order.ref}`}
                      className="bg-muted/30 hover:bg-muted/30"
                    >
                      <TableCell colSpan={6} className="p-0">
                        <div className="animate-in px-4 py-3 duration-200 fade-in-0 slide-in-from-top-1 sm:ps-14">
                          <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
                            <span>
                              {t('receivedOf', {
                                done: received,
                                total: order.lines.length,
                              })}
                            </span>
                            <Progress
                              value={(received / order.lines.length) * 100}
                              className="h-1.5 max-w-40"
                            />
                          </div>
                          <table className="w-full text-sm">
                            <caption className="sr-only">
                              {t('linesOf', { ref: order.ref })}
                            </caption>
                            <thead className="text-xs text-muted-foreground">
                              <tr>
                                <th className="py-1 text-start font-medium">
                                  {t('item')}
                                </th>
                                <th className="py-1 text-end font-medium">
                                  {t('quantity')}
                                </th>
                                <th className="py-1 text-end font-medium">
                                  {t('receivedLabel')}
                                </th>
                                <th className="py-1 text-end font-medium">
                                  {t('unitPrice')}
                                </th>
                                <th className="py-1 text-end font-medium">
                                  {t('lineTotal')}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                              {order.lines.map((line) => (
                                <tr key={line.item}>
                                  <td className="py-1.5">{line.item}</td>
                                  <td className="py-1.5 text-end tabular-nums">
                                    {line.quantity}
                                  </td>
                                  <td
                                    className={cn(
                                      'py-1.5 text-end tabular-nums',
                                      line.received >= line.quantity
                                        ? 'text-success'
                                        : 'text-muted-foreground',
                                    )}
                                  >
                                    {line.received}
                                  </td>
                                  <td className="py-1.5 text-end tabular-nums">
                                    <bdi>{money(line.price)}</bdi>
                                  </td>
                                  <td className="py-1.5 text-end font-medium tabular-nums">
                                    <bdi>
                                      {money(line.price * line.quantity)}
                                    </bdi>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
