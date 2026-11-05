import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, Minus, Plus, ShieldAlert } from 'lucide-react'
import { money } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import { Label } from '@/shared/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import { Slider } from '@/shared/ui/slider'
import { ns } from '../messages'

const plans = [
  {
    key: 'planStarter',
    seat: 1_900,
    features: ['featureRequests', 'featureReports'],
  },
  {
    key: 'planBusiness',
    seat: 3_900,
    features: [
      'featureRequests',
      'featureReports',
      'featureApprovals',
      'featureApi',
    ],
  },
  {
    key: 'planEnterprise',
    seat: 6_500,
    features: [
      'featureRequests',
      'featureReports',
      'featureApprovals',
      'featureApi',
      'featureSso',
      'featureAudit',
    ],
  },
] as const
const terms = [
  { months: 12, discount: 0 },
  { months: 24, discount: 0.08 },
  { months: 36, discount: 0.12 },
]
const addOns = [
  { key: 'addonOnboarding', price: 450_000, once: true },
  { key: 'addonSupport', price: 120_000, once: false },
]
const APPROVAL_LIMIT = 15

export default function QuoteBuilder() {
  const { t } = useTranslation(ns)
  const [plan, setPlan] =
    useState<(typeof plans)[number]['key']>('planBusiness')
  const [seats, setSeats] = useState(40)
  const [term, setTerm] = useState(24)
  const [extras, setExtras] = useState<Set<string>>(
    new Set(['addonOnboarding']),
  )
  const [discount, setDiscount] = useState(5)
  const chosen = plans.find((entry) => entry.key === plan)!
  const termDiscount = terms.find((entry) => entry.months === term)!.discount
  // Volume pricing: every seat above 50 is 10% cheaper.
  const seatTotal =
    Math.min(seats, 50) * chosen.seat +
    Math.max(seats - 50, 0) * chosen.seat * 0.9
  const yearly = seatTotal * 12
  const recurringExtras = addOns
    .filter((entry) => !entry.once && extras.has(entry.key))
    .reduce((sum, entry) => sum + entry.price, 0)
  const oneOff = addOns
    .filter((entry) => entry.once && extras.has(entry.key))
    .reduce((sum, entry) => sum + entry.price, 0)
  const listAnnual = yearly + recurringExtras
  const afterTerm = listAnnual * (1 - termDiscount)
  const annual = Math.round(afterTerm * (1 - discount / 100))
  const contract = annual * (term / 12) + oneOff
  const needsApproval = discount > APPROVAL_LIMIT

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-4">
      <div className="grid min-w-0 content-start gap-3 lg:gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('choosePlan')}</CardTitle>
            <CardDescription>{t('choosePlanHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={plan}
              onValueChange={(value) => setPlan(value as typeof plan)}
              className="grid gap-2 2xl:grid-cols-3"
            >
              {plans.map((entry) => (
                <Label
                  key={entry.key}
                  htmlFor={entry.key}
                  className={cn(
                    'grid cursor-pointer content-start gap-2 rounded-lg border p-3 font-normal transition-colors hover:bg-muted/40',
                    plan === entry.key &&
                      'border-primary bg-primary/5 hover:bg-primary/5',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <RadioGroupItem id={entry.key} value={entry.key} />
                    <span className="font-medium">{t(entry.key)}</span>
                  </span>
                  <span className="text-sm">
                    <bdi className="font-semibold tabular-nums">
                      {money(entry.seat)}
                    </bdi>
                    <span className="text-muted-foreground">
                      {' '}
                      {t('perSeatMonth')}
                    </span>
                  </span>
                  <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground 2xl:grid">
                    {entry.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-1.5">
                        <Check
                          aria-hidden="true"
                          className="size-3 text-success"
                        />
                        {t(feature)}
                      </li>
                    ))}
                  </ul>
                </Label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('seatsAndTerm')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="flex flex-wrap items-center gap-4">
              <span id="seats-label" className="text-sm font-medium">
                {t('seats')}
              </span>
              <div
                className="flex items-center rounded-md border"
                role="group"
                aria-labelledby="seats-label"
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 rounded-e-none"
                  onClick={() => setSeats((value) => Math.max(5, value - 5))}
                  aria-label={t('fewerSeats')}
                >
                  <Minus />
                </Button>
                <input
                  aria-labelledby="seats-label"
                  inputMode="numeric"
                  value={seats}
                  onChange={(event) => {
                    const next = Number(event.target.value.replace(/\D/g, ''))
                    if (!Number.isNaN(next)) setSeats(Math.min(next, 500))
                  }}
                  onBlur={() => setSeats((value) => Math.max(5, value))}
                  className="h-8 w-14 border-x bg-transparent text-center text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 rounded-s-none"
                  onClick={() => setSeats((value) => Math.min(500, value + 5))}
                  aria-label={t('moreSeats')}
                >
                  <Plus />
                </Button>
              </div>
              {seats > 50 && (
                <span className="text-xs text-success">
                  {t('volumePricing')}
                </span>
              )}
            </div>
            <div className="grid gap-2">
              <span className="text-sm font-medium">{t('term')}</span>
              <div className="grid grid-cols-3 gap-2">
                {terms.map((entry) => (
                  <button
                    key={entry.months}
                    type="button"
                    aria-pressed={term === entry.months}
                    onClick={() => setTerm(entry.months)}
                    className={cn(
                      'grid gap-0.5 rounded-lg border px-3 py-2 text-start transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                      term === entry.months &&
                        'border-primary bg-primary/5 hover:bg-primary/5',
                    )}
                  >
                    <span className="text-sm font-medium">
                      {t('monthsCount', { count: entry.months })}
                    </span>
                    <span
                      className={cn(
                        'text-xs',
                        entry.discount
                          ? 'text-success'
                          : 'text-muted-foreground',
                      )}
                    >
                      {entry.discount
                        ? t('saveDiscount', { value: entry.discount * 100 })
                        : t('listPrice')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <span className="text-sm font-medium">{t('addOns')}</span>
              {addOns.map((entry) => (
                <Label
                  key={entry.key}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2.5 font-normal"
                >
                  <Checkbox
                    checked={extras.has(entry.key)}
                    onCheckedChange={(on) =>
                      setExtras((set) => {
                        const next = new Set(set)
                        if (on) next.add(entry.key)
                        else next.delete(entry.key)
                        return next
                      })
                    }
                  />
                  <span className="flex-1 text-sm">{t(entry.key)}</span>
                  <span className="text-sm text-muted-foreground">
                    <bdi className="tabular-nums">{money(entry.price)}</bdi>{' '}
                    {entry.once ? t('oneOff') : t('perYear')}
                  </span>
                </Label>
              ))}
            </div>
            <div className="grid gap-3">
              <div className="flex items-center justify-between text-sm">
                <span id="discount-label" className="font-medium">
                  {t('extraDiscount')}
                </span>
                <span
                  className={cn(
                    'font-medium tabular-nums',
                    needsApproval && 'text-warning',
                  )}
                >
                  {discount}%
                </span>
              </div>
              <Slider
                aria-labelledby="discount-label"
                value={[discount]}
                min={0}
                max={30}
                step={1}
                onValueChange={([value]) => setDiscount(value!)}
              />
              <p
                className={cn(
                  'flex items-center gap-1.5 text-xs',
                  needsApproval
                    ? 'font-medium text-warning'
                    : 'text-muted-foreground',
                )}
              >
                {needsApproval && <ShieldAlert className="size-3.5" />}
                {needsApproval
                  ? t('discountNeedsApproval', { limit: APPROVAL_LIMIT })
                  : t('discountLimit', { limit: APPROVAL_LIMIT })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* The summary recalculates on every change and stays in view while configuring. */}
      <Card className="gap-4 px-5 py-4 lg:sticky lg:top-20 lg:self-start">
        <div>
          <p className="text-xs text-muted-foreground">{t('quoteFor')}</p>
          <h3 className="font-semibold">Adatum Software</h3>
        </div>
        <dl className="grid grid-cols-[1fr_auto] gap-y-1.5 text-sm [&_dt]:pe-4">
          <dt className="text-muted-foreground">
            {t('seatsLine', { count: seats, plan: t(plan) })}
          </dt>
          <dd className="text-end tabular-nums">
            <bdi>{money(yearly)}</bdi>
          </dd>
          {recurringExtras > 0 && (
            <>
              <dt className="text-muted-foreground">{t('addonSupport')}</dt>
              <dd className="text-end tabular-nums">
                <bdi>{money(recurringExtras)}</bdi>
              </dd>
            </>
          )}
          {termDiscount > 0 && (
            <>
              <dt className="text-muted-foreground">{t('termDiscount')}</dt>
              <dd className="text-end text-success tabular-nums">
                <bdi>-{money(listAnnual - afterTerm)}</bdi>
              </dd>
            </>
          )}
          {discount > 0 && (
            <>
              <dt className="text-muted-foreground">{t('extraDiscount')}</dt>
              <dd className="text-end text-success tabular-nums">
                <bdi>-{money(Math.round(afterTerm - annual))}</bdi>
              </dd>
            </>
          )}
          <dt className="border-t pt-2 font-medium">{t('annualPrice')}</dt>
          <dd className="border-t pt-2 text-end font-medium tabular-nums">
            <bdi>{money(annual)}</bdi>
          </dd>
          {oneOff > 0 && (
            <>
              <dt className="text-muted-foreground">{t('addonOnboarding')}</dt>
              <dd className="text-end tabular-nums">
                <bdi>{money(oneOff)}</bdi>
              </dd>
            </>
          )}
        </dl>
        <div className="rounded-lg bg-muted/50 px-3 py-2.5">
          <p className="text-xs text-muted-foreground">
            {t('contractValue', { count: term })}
          </p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            <bdi>{money(contract)}</bdi>
          </p>
        </div>
        <Button
          onClick={() =>
            toast.success(
              needsApproval ? t('quoteSentForApproval') : t('quoteCreated'),
            )
          }
        >
          {needsApproval ? t('requestApproval') : t('createQuote')}
        </Button>
      </Card>
    </div>
  )
}
