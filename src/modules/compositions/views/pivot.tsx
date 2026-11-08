import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { compactMoney, money } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { ns } from '../messages'

const departments = ['Operations', 'Finance', 'Engineering', 'Sales', 'People']
const costTypes = [
  'costStaff',
  'costSoftware',
  'costTravel',
  'costFacilities',
  'costServices',
]
const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
/** Q4 is in progress: actuals are to date, so variance compares against a pro-rated budget. */
const CURRENT = 3
const PRORATE = 0.6
interface Fact {
  department: string
  type: string
  quarter: number
  budget: number
  actual: number
}
// Deterministic sample cube so the demo looks the same on every load.
const facts: Fact[] = (() => {
  let seed = 7
  const random = () => (seed = (seed * 16_807) % 2_147_483_647) / 2_147_483_647
  return departments.flatMap((department, d) =>
    costTypes.flatMap((type, c) =>
      quarters.map((_, quarter) => {
        const budget = Math.round(
          (40 + d * 18 + c * 11) * 100_000 * (0.8 + random() * 0.5),
        )
        const drift =
          (random() - 0.45) *
          (department === 'Engineering' && type === 'costSoftware' ? 0.9 : 0.35)
        const actual = Math.round(
          budget * (1 + drift) * (quarter === CURRENT ? PRORATE : 1),
        )
        return { department, type, quarter, budget, actual }
      }),
    ),
  )
})()
type Measure = 'actual' | 'budget' | 'variance'
type Rows = 'department' | 'type'

export default function Pivot() {
  const { t } = useTranslation(ns)
  const [measure, setMeasure] = useState<Measure>('variance')
  const [rowsBy, setRowsBy] = useState<Rows>('department')
  const [focus, setFocus] = useState<{ row: string; quarter: number } | null>({
    row: 'Engineering',
    quarter: 2,
  })
  const rowKeys = rowsBy === 'department' ? departments : costTypes
  const label = (key: string) => (rowsBy === 'type' ? t(key) : key)
  const cell = useMemo(() => {
    const total = (filter: (fact: Fact) => boolean) => {
      const list = facts.filter(filter)
      const budget = list.reduce(
        (sum, fact) =>
          sum + fact.budget * (fact.quarter === CURRENT ? PRORATE : 1),
        0,
      )
      const actual = list.reduce((sum, fact) => sum + fact.actual, 0)
      return { budget, actual, variance: budget ? actual / budget - 1 : 0 }
    }
    return (row: string | null, quarter: number | null) =>
      total(
        (fact) =>
          (row === null || fact[rowsBy] === row) &&
          (quarter === null || fact.quarter === quarter),
      )
  }, [rowsBy])
  const percent = (value: number) =>
    new Intl.NumberFormat(undefined, {
      style: 'percent',
      maximumFractionDigits: 1,
      signDisplay: 'exceptZero',
    }).format(value)
  const display = (value: ReturnType<typeof cell>) =>
    measure === 'variance'
      ? percent(value.variance)
      : compactMoney(value[measure])
  // Diverging scale: over budget tints red, under budget tints green, capped at 25%.
  const heat = (variance: number) => {
    const strength = Math.min(Math.abs(variance) / 0.25, 1) * 28
    if (Math.abs(variance) < 0.02) return undefined
    return `color-mix(in oklch, var(--${variance > 0 ? 'destructive' : 'success'}) ${strength}%, transparent)`
  }
  const detail = focus ? cell(focus.row, focus.quarter) : null
  const contributors =
    focus && rowsBy === 'department'
      ? costTypes
          .map((type) => {
            const list = facts.filter(
              (fact) =>
                fact.department === focus.row &&
                fact.quarter === focus.quarter &&
                fact.type === type,
            )
            const budget = list.reduce(
              (sum, fact) =>
                sum + fact.budget * (fact.quarter === CURRENT ? PRORATE : 1),
              0,
            )
            const actual = list.reduce((sum, fact) => sum + fact.actual, 0)
            return { type, gap: actual - budget }
          })
          .sort((a, b) => b.gap - a.gap)
          .slice(0, 3)
      : []

  return (
    <div className="grid gap-3 lg:gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={measure}
          onValueChange={(value) => value && setMeasure(value as Measure)}
          aria-label={t('measure')}
        >
          {(['variance', 'actual', 'budget'] as const).map((value) => (
            <ToggleGroupItem key={value} value={value} className="px-3">
              {t(`measure_${value}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={rowsBy}
          onValueChange={(value) => {
            if (!value) return
            setRowsBy(value as Rows)
            setFocus(null)
          }}
          aria-label={t('rowsBy')}
          className="ms-auto"
        >
          <ToggleGroupItem value="department" className="px-3">
            {t('byDepartment')}
          </ToggleGroupItem>
          <ToggleGroupItem value="type" className="px-3">
            {t('byCostType')}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <Card className="min-w-0 gap-0 overflow-hidden py-0">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <caption className="sr-only">{t('pivotCaption')}</caption>
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th scope="col" className="px-4 py-2 text-start font-medium">
                  {rowsBy === 'department' ? t('department') : t('costType')}
                </th>
                {quarters.map((quarter, index) => (
                  <th
                    key={quarter}
                    scope="col"
                    className="px-3 py-2 text-end font-medium"
                  >
                    {quarter}
                    {index === CURRENT && (
                      <span className="ms-1 font-normal italic">
                        ({t('toDate')})
                      </span>
                    )}
                  </th>
                ))}
                <th
                  scope="col"
                  className="border-s px-4 py-2 text-end font-semibold text-foreground"
                >
                  {t('yearTotal')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rowKeys.map((row) => (
                <tr key={row}>
                  <th scope="row" className="px-4 py-2 text-start font-medium">
                    {label(row)}
                  </th>
                  {quarters.map((quarter, index) => {
                    const value = cell(row, index)
                    const active = focus?.row === row && focus.quarter === index
                    return (
                      <td key={quarter} className="p-0.5">
                        <button
                          type="button"
                          onClick={() => setFocus({ row, quarter: index })}
                          aria-pressed={active}
                          aria-label={`${label(row)} ${quarter}: ${t('measure_actual')} ${money(value.actual)}, ${t('measure_budget')} ${money(value.budget)}, ${percent(value.variance)}`}
                          style={{ background: heat(value.variance) }}
                          className={cn(
                            'w-full rounded-md px-2.5 py-1.5 text-end tabular-nums transition-shadow hover:ring-1 hover:ring-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                            active && 'ring-2 ring-primary',
                            index === CURRENT && 'italic',
                          )}
                        >
                          <bdi>{display(value)}</bdi>
                        </button>
                      </td>
                    )
                  })}
                  <td className="border-s px-4 py-2 text-end font-semibold tabular-nums">
                    <bdi>{display(cell(row, null))}</bdi>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/30 font-semibold">
                <th scope="row" className="px-4 py-2 text-start">
                  {t('total')}
                </th>
                {quarters.map((quarter, index) => (
                  <td key={quarter} className="px-3 py-2 text-end tabular-nums">
                    <bdi>{display(cell(null, index))}</bdi>
                  </td>
                ))}
                <td className="border-s px-4 py-2 text-end tabular-nums">
                  <bdi>{display(cell(null, null))}</bdi>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-5 rounded-sm"
              style={{ background: heat(-0.25) }}
            />
            {t('underBudget')}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-5 rounded-sm"
              style={{ background: heat(0.25) }}
            />
            {t('overBudget')}
          </span>
          <span className="ms-auto">{t('pivotNote')}</span>
        </div>
      </Card>
      {focus && detail && (
        <Card className="animate-in gap-3 px-5 py-4 duration-200 fade-in-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-sm font-semibold">
              {label(focus.row)} · {quarters[focus.quarter]}
            </h3>
            <p className="text-sm text-muted-foreground">
              <bdi className="font-medium text-foreground">
                {money(detail.actual)}
              </bdi>{' '}
              {t('ofBudget')} <bdi>{money(detail.budget)}</bdi>
            </p>
            <p
              className={cn(
                'text-sm font-medium tabular-nums',
                detail.variance > 0 ? 'text-destructive' : 'text-success',
              )}
            >
              {percent(detail.variance)}
            </p>
          </div>
          {contributors.length > 0 && (
            <div className="grid gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                {t('biggestDrivers')}
              </p>
              {contributors.map((entry) => (
                <div
                  key={entry.type}
                  className="grid grid-cols-[8rem_minmax(0,1fr)_6rem] items-center gap-3 text-sm"
                >
                  <span className="truncate">{t(entry.type)}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <span
                      className={cn(
                        'block h-full rounded-full',
                        entry.gap > 0 ? 'bg-destructive' : 'bg-success',
                      )}
                      style={{
                        width: `${Math.min((Math.abs(entry.gap) / Math.max(...contributors.map((item) => Math.abs(item.gap)), 1)) * 100, 100)}%`,
                      }}
                    />
                  </span>
                  <bdi className="text-end tabular-nums">
                    {compactMoney(entry.gap)}
                  </bdi>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
