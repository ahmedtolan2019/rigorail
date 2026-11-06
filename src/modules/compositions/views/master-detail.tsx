import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Mail,
  Search,
  Star,
  MapPin,
  Wallet,
  Package,
  Truck,
} from 'lucide-react'
import { compactMoney } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Illustration } from '@/shared/ui/illustration'
import { Input } from '@/shared/ui/input'
import { Progress } from '@/shared/ui/progress'
import { ConfirmAction } from '@/shared/ui/confirm-action'
import { registerCopy } from '../example-utils'
import { ns } from '../messages'
registerCopy({
  mdSupplierCount: ['{{count}} suppliers', '{{count}} مورد'],
  mdNoSuppliers: [
    'No suppliers match your search.',
    'لا يوجد موردون يطابقون البحث.',
  ],
  mdClear: ['Clear search', 'مسح البحث'],
  mdHealth: ['Supplier performance', 'أداء المورد'],
  mdSixMonths: ['6 months', '٦ أشهر'],
  mdVolume: ['Order volume', 'حجم الطلبات'],
  mdTrendLabel: [
    'Illustrative order volume rises over six months.',
    'حجم طلبات توضيحي يرتفع خلال ستة أشهر.',
  ],
  mdOnTime: ['On-time delivery', 'التسليم في الموعد'],
  mdOrders: ['Recent purchase orders', 'أوامر الشراء الأخيرة'],
  mdAll: ['All orders', 'كل الطلبات'],
  mdInTransit: ['In progress', 'قيد التنفيذ'],
  mdDelivered: ['Delivered', 'تم التسليم'],
  mdDelivery: ['Delivery progress', 'تقدم التسليم'],
  mdShipmentHint: [
    'Shipment scheduled. Select another order to inspect its progress.',
    'تمت جدولة الشحنة. اختر طلبًا آخر لفحص تقدمه.',
  ],
  mdReceivedHint: [
    'All items received and checked.',
    'تم استلام كل العناصر وفحصها.',
  ],
  mdNoOrders: ['No open purchase orders.', 'لا توجد أوامر شراء مفتوحة.'],
  mdContact: ['Contact supplier', 'التواصل مع المورد'],
  mdHold: ['Place on hold', 'تعليق التعامل'],
  mdActivate: ['Activate supplier', 'تفعيل المورد'],
  mdStatusHint: [
    'This changes the supplier status in this local example.',
    'يغير هذا حالة المورد داخل المثال المحلي.',
  ],
})
const suppliers = [
  {
    ref: 'SUP-0142',
    name: 'Northwind Traders',
    contact: 'Maya Chen',
    email: 'maya@northwind.example',
    country: 'Netherlands',
    terms: 'net30',
    orders: 4,
    spendMinor: 18_420_000,
    rating: 4.8,
    active: true,
  },
  {
    ref: 'SUP-0118',
    name: 'Al Noor Supplies',
    contact: 'Yousef Saleh',
    email: 'yousef@alnoor.example',
    country: 'United Arab Emirates',
    terms: 'net45',
    orders: 2,
    spendMinor: 9_315_000,
    rating: 4.5,
    active: true,
  },
  {
    ref: 'SUP-0097',
    name: 'Contoso Office',
    contact: 'Ines Duarte',
    email: 'ines@contoso.example',
    country: 'Portugal',
    terms: 'net30',
    orders: 0,
    spendMinor: 2_150_000,
    rating: 3.9,
    active: false,
  },
  {
    ref: 'SUP-0201',
    name: 'Fabrikam Hardware',
    contact: 'Tom Becker',
    email: 'tom@fabrikam.example',
    country: 'Germany',
    terms: 'net60',
    orders: 7,
    spendMinor: 31_870_000,
    rating: 4.7,
    active: true,
  },
  {
    ref: 'SUP-0166',
    name: 'Delta Logistics',
    contact: 'Nadia Karim',
    email: 'nadia@delta.example',
    country: 'Egypt',
    terms: 'net30',
    orders: 3,
    spendMinor: 12_640_000,
    rating: 4.2,
    active: true,
  },
  {
    ref: 'SUP-0073',
    name: 'Litware Systems',
    contact: 'Owen Price',
    email: 'owen@litware.example',
    country: 'United Kingdom',
    terms: 'net45',
    orders: 1,
    spendMinor: 5_480_000,
    rating: 4.0,
    active: true,
  },
]
type Supplier = (typeof suppliers)[number]

export default function MasterDetail() {
  const { t } = useTranslation(ns)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(suppliers[0]!.ref)
  const [showDetail, setShowDetail] = useState(false)
  const [items, setItems] = useState(suppliers)
  const listRef = useRef<HTMLButtonElement>(null)
  const results = items.filter((item) =>
    `${item.name} ${item.ref} ${item.country}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  )
  const current = items.find((item) => item.ref === selected)!
  return (
    <Card className="grid min-h-[38rem] gap-0 overflow-hidden py-0 md:grid-cols-[14rem_minmax(0,1fr)]">
      <div
        className={cn(
          'flex min-h-0 flex-col md:border-e',
          showDetail && 'hidden md:flex',
        )}
      >
        <div className="border-b p-3">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchSuppliers')}
              aria-label={t('searchSuppliers')}
              className="h-9 ps-8"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t('mdSupplierCount', { count: results.length })}
          </p>
        </div>
        <ul
          aria-label={t('suppliers')}
          className="grid content-start gap-1 p-2"
        >
          {results.map((item) => (
            <li key={item.ref}>
              <button
                ref={item.ref === selected ? listRef : undefined}
                type="button"
                aria-current={item.ref === selected}
                onClick={() => {
                  setSelected(item.ref)
                  setShowDetail(true)
                }}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-start transition-colors hover:bg-accent aria-[current=true]:bg-accent"
              >
                <Avatar className="size-9 shrink-0 rounded-lg">
                  <AvatarFallback
                    className={cn(
                      'rounded-lg text-xs font-semibold',
                      item.active
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {item.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {item.name}
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        'size-1.5 rounded-full',
                        item.active ? 'bg-success' : 'bg-warning',
                      )}
                    />
                    {t(item.active ? 'active' : 'onHold')} ·{' '}
                    <bdi>{item.ref}</bdi>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {!results.length && (
          <div className="grid justify-items-center gap-3 p-6">
            <Illustration name="empty" className="size-20" />
            <p
              role="status"
              className="text-center text-sm text-muted-foreground"
            >
              {t('mdNoSuppliers')}
            </p>
            <Button variant="outline" size="sm" onClick={() => setQuery('')}>
              {t('mdClear')}
            </Button>
          </div>
        )}
      </div>
      <div className={cn('min-w-0', !showDetail && 'hidden md:block')}>
        <Detail
          key={current.ref}
          supplier={current}
          onBack={() => {
            setShowDetail(false)
            requestAnimationFrame(() => listRef.current?.focus())
          }}
          onToggle={() =>
            setItems(
              items.map((item) =>
                item.ref === current.ref
                  ? { ...item, active: !item.active }
                  : item,
              ),
            )
          }
        />
      </div>
    </Card>
  )
}
function Detail({
  supplier,
  onBack,
  onToggle,
}: {
  supplier: Supplier
  onBack: () => void
  onToggle: () => void
}) {
  const { t } = useTranslation(ns)
  const [filter, setFilter] = useState('open')
  const [expanded, setExpanded] = useState<string | null>(null)
  const delivery = Math.round(supplier.rating * 20)
  const orders = Array.from({ length: supplier.orders + 2 }, (_, i) => ({
    ref: `PO-${2041 + Number(supplier.ref.slice(-3)) * 10 + i}`,
    amount: Math.round(supplier.spendMinor / (supplier.orders + 4)),
    progress: i < supplier.orders ? ((i % 3) + 1) * 25 : 100,
    open: i < supplier.orders,
  }))
  return (
    <div className="@container grid gap-5 p-4 sm:p-5">
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2 w-fit md:hidden"
        onClick={onBack}
      >
        <ArrowLeft className="rtl:rotate-180" />
        {t('back')}
      </Button>
      <header className="flex flex-wrap items-start gap-3">
        <Avatar className="size-12 rounded-xl">
          <AvatarFallback className="rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
            {supplier.name
              .split(' ')
              .map((p) => p[0])
              .join('')
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg leading-tight font-semibold">
            {supplier.name}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            {supplier.country}
          </p>
        </div>
        <Badge
          variant="secondary"
          className={cn(
            'rounded-full',
            supplier.active
              ? 'bg-success/10 text-success'
              : 'bg-warning/10 text-warning',
          )}
        >
          {t(supplier.active ? 'active' : 'onHold')}
        </Badge>
      </header>
      <div className="grid grid-cols-2 gap-2 @min-[28rem]:grid-cols-3">
        {[
          [t('spendYtd'), compactMoney(supplier.spendMinor), Wallet],
          [t('openOrders'), supplier.orders, Package],
          [t('rating'), supplier.rating.toFixed(1), Star],
        ].map(([label, value, Icon], index) => {
          const MetricIcon = Icon as typeof Wallet
          return (
            <div
              key={String(label)}
              className={cn(
                'min-w-0 rounded-lg border bg-muted/25 p-3',
                index === 0 && 'col-span-2 @min-[28rem]:col-span-1',
              )}
            >
              <MetricIcon
                aria-hidden="true"
                className="mb-2 size-4 text-primary"
              />
              <p className="text-xs text-muted-foreground">{String(label)}</p>
              <bdi className="mt-1 block text-base font-semibold tabular-nums">
                {String(value)}
              </bdi>
            </div>
          )
        })}
      </div>
      <section className="grid gap-4 rounded-xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold">{t('mdHealth')}</h4>
          <Badge variant="outline">{t('mdSixMonths')}</Badge>
        </div>
        <div className="grid grid-cols-[1fr_5rem] items-center gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t('mdVolume')}</p>
            <svg
              role="img"
              aria-label={t('mdTrendLabel')}
              viewBox="0 0 240 64"
              className="mt-2 h-16 w-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0 58 L32 44 L64 50 L96 26 L128 34 L160 18 L192 23 L224 8 L240 14 L240 64 L0 64 Z"
                fill="currentColor"
                className="text-primary/10"
              />
              <path
                d="M0 58 L32 44 L64 50 L96 26 L128 34 L160 18 L192 23 L224 8 L240 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-primary"
              />
            </svg>
          </div>
          <div className="relative grid size-20 place-items-center">
            <svg
              viewBox="0 0 40 40"
              aria-hidden="true"
              className="absolute size-20 -rotate-90"
            >
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                className="text-muted"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeDasharray={`${delivery} ${101 - delivery}`}
                className="text-success"
              />
            </svg>
            <bdi className="text-sm font-semibold">{delivery}%</bdi>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('mdOnTime')} · {t('paymentTerms')}: {t(supplier.terms)}
        </p>
      </section>
      <section className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold">{t('mdOrders')}</h4>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={filter === 'open' ? 'secondary' : 'ghost'}
              aria-pressed={filter === 'open'}
              onClick={() => setFilter('open')}
            >
              {t('openOrders')}
            </Button>
            <Button
              size="sm"
              variant={filter === 'all' ? 'secondary' : 'ghost'}
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              {t('mdAll')}
            </Button>
          </div>
        </div>
        {orders
          .filter((o) => filter === 'all' || o.open)
          .map((order) => (
            <div key={order.ref} className="rounded-lg border">
              <button
                className="grid w-full gap-2 p-3 text-start hover:bg-accent/50"
                aria-expanded={expanded === order.ref}
                onClick={() =>
                  setExpanded(expanded === order.ref ? null : order.ref)
                }
              >
                <span className="flex justify-between gap-3 text-sm">
                  <bdi className="font-medium">{order.ref}</bdi>
                  <bdi>{compactMoney(order.amount)}</bdi>
                </span>
                <span className="flex justify-between gap-3 text-xs text-muted-foreground">
                  <span>{t(order.open ? 'mdInTransit' : 'mdDelivered')}</span>
                  <span>{order.progress}%</span>
                </span>
                <Progress
                  value={order.progress}
                  aria-label={`${order.ref} ${t('mdDelivery')}`}
                  className="h-1.5"
                />
              </button>
              {expanded === order.ref && (
                <div className="flex items-center gap-2 border-t bg-muted/30 p-3 text-xs text-muted-foreground">
                  <Truck className="size-4 shrink-0 text-primary" />
                  {t(order.open ? 'mdShipmentHint' : 'mdReceivedHint')}
                </div>
              )}
            </div>
          ))}
        {filter === 'open' && supplier.orders === 0 && (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            {t('mdNoOrders')}
          </p>
        )}
      </section>
      <footer className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/40 p-3">
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">
            {supplier.contact
              .split(' ')
              .map((p) => p[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{supplier.contact}</p>
          <a
            href={`mailto:${supplier.email}`}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Mail className="size-3" />
            {t('mdContact')}
          </a>
        </div>
        <ConfirmAction
          title={t(supplier.active ? 'mdHold' : 'mdActivate')}
          description={t('mdStatusHint')}
          chips={[supplier.name]}
          confirmLabel={t(supplier.active ? 'mdHold' : 'mdActivate')}
          onConfirm={onToggle}
        >
          <Button size="sm" variant="outline">
            {t(supplier.active ? 'mdHold' : 'mdActivate')}
          </Button>
        </ConfirmAction>
      </footer>
    </div>
  )
}
