import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PackageSearch, Truck } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Progress } from '@/shared/ui/progress'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { ns } from '../messages'

const aisles = ['A', 'B', 'C', 'D', 'E', 'F']
const BAYS = 12
const products = [
  ['SKU-10021', 'Barcode scanner'],
  ['SKU-10034', 'Label rolls (box)'],
  ['SKU-20410', 'Safety helmet'],
  ['SKU-20418', 'High-visibility vest'],
  ['SKU-30102', 'Pallet wrap'],
  ['SKU-30177', 'Packing tape'],
  ['SKU-40005', 'Thermal printer'],
  ['SKU-50090', 'Safety gloves (pair)'],
] as const
interface Bin {
  code: string
  fill: number
  /** Days since stock last moved. */
  idle: number
  picks: number
  items: { sku: string; name: string; quantity: number }[]
}
const bins: Bin[] = (() => {
  let seed = 11
  const random = () => (seed = (seed * 16_807) % 2_147_483_647) / 2_147_483_647
  return aisles.flatMap((aisle, a) =>
    Array.from({ length: BAYS }, (_, bay) => {
      // Fast movers sit near the dock (low bay numbers); slow stock drifts to the back.
      const fill = Math.round(
        Math.min(1, Math.max(0, random() * 1.1 - (bay > 9 ? 0.2 : 0))) * 100,
      )
      const count = fill === 0 ? 0 : 1 + Math.floor(random() * 2)
      const items = Array.from({ length: count }, () => {
        const [sku, name] = products[Math.floor(random() * products.length)]!
        return { sku, name, quantity: 4 + Math.floor(random() * 60) }
      })
      return {
        code: `${aisle}-${String(bay + 1).padStart(2, '0')}`,
        fill,
        idle: Math.round(random() * (bay + a) * 9),
        picks: fill === 0 ? 0 : Math.round(random() * (BAYS - bay) * 2.5),
        items,
      }
    }),
  )
})()
type Mode = 'fill' | 'idle' | 'picks'
const scale: Record<Mode, { value: (bin: Bin) => number; token: string }> = {
  fill: { value: (bin) => bin.fill / 100, token: '--primary' },
  idle: { value: (bin) => Math.min(bin.idle / 120, 1), token: '--warning' },
  picks: { value: (bin) => Math.min(bin.picks / 25, 1), token: '--info' },
}

export default function BinMap() {
  const { t } = useTranslation(ns)
  const [mode, setMode] = useState<Mode>('fill')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState('A-03')
  const search = query.trim().toLowerCase()
  const hits = useMemo(
    () =>
      new Set(
        search
          ? bins
              .filter((bin) =>
                bin.items.some(
                  (item) =>
                    item.sku.toLowerCase().includes(search) ||
                    item.name.toLowerCase().includes(search),
                ),
              )
              .map((bin) => bin.code)
          : [],
      ),
    [search],
  )
  const bin = bins.find((entry) => entry.code === selected)!
  const color = (entry: Bin) => {
    const value = scale[mode].value(entry)
    return value === 0
      ? undefined
      : `color-mix(in oklch, var(${scale[mode].token}) ${Math.round(12 + value * 78)}%, transparent)`
  }
  const empty = bins.filter((entry) => entry.fill === 0).length
  const average = Math.round(
    bins.reduce((sum, entry) => sum + entry.fill, 0) / bins.length,
  )
  return (
    <div className="grid gap-3 lg:gap-4 2xl:grid-cols-[minmax(0,1fr)_17rem]">
      <Card className="min-w-0 gap-3 px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={mode}
            onValueChange={(value) => value && setMode(value as Mode)}
            aria-label={t('colourBy')}
          >
            <ToggleGroupItem value="fill" className="px-3">
              {t('modeFill')}
            </ToggleGroupItem>
            <ToggleGroupItem value="idle" className="px-3">
              {t('modeIdle')}
            </ToggleGroupItem>
            <ToggleGroupItem value="picks" className="px-3">
              {t('modePicks')}
            </ToggleGroupItem>
          </ToggleGroup>
          <div className="relative ms-auto w-full sm:w-56">
            <PackageSearch
              aria-hidden="true"
              className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('findSku')}
              aria-label={t('findSku')}
              className="h-8 ps-8"
            />
          </div>
        </div>
        {search && (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {t('binsFound', { count: hits.size })}
          </p>
        )}
        <div className="overflow-x-auto pb-1">
          {/* Aisles are drawn in back-to-back pairs with a walkway between pairs, as on the floor. */}
          <div
            className="grid min-w-[30rem] gap-1"
            role="grid"
            aria-label={t('floorPlan')}
          >
            {aisles.map((aisle, index) => (
              <div
                key={aisle}
                role="row"
                className={cn(
                  'flex items-center gap-1',
                  index % 2 === 1 && index < aisles.length - 1 && 'mb-4',
                )}
              >
                <span
                  role="rowheader"
                  className="w-6 shrink-0 text-center text-xs font-semibold text-muted-foreground"
                >
                  {aisle}
                </span>
                {bins
                  .filter((entry) => entry.code.startsWith(`${aisle}-`))
                  .map((entry) => {
                    const dimmed = search && !hits.has(entry.code)
                    return (
                      <button
                        key={entry.code}
                        type="button"
                        role="gridcell"
                        aria-selected={entry.code === selected}
                        aria-label={`${entry.code}: ${t('fillPercent', { value: entry.fill })}`}
                        onClick={() => setSelected(entry.code)}
                        style={{ background: color(entry) }}
                        className={cn(
                          'relative h-9 min-w-0 flex-1 rounded border border-border/70 transition-[opacity,box-shadow] hover:ring-1 hover:ring-foreground/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                          entry.fill === 0 &&
                            'bg-[repeating-linear-gradient(135deg,transparent_0_4px,var(--border)_4px_5px)]',
                          entry.code === selected && 'ring-2 ring-foreground',
                          dimmed && 'opacity-20',
                          search &&
                            hits.has(entry.code) &&
                            'ring-2 ring-primary',
                        )}
                      />
                    )
                  })}
              </div>
            ))}
            <div className="mt-2 flex items-center gap-1 ps-7 text-xs text-muted-foreground">
              {Array.from({ length: BAYS }, (_, bay) => (
                <span key={bay} className="flex-1 text-center tabular-nums">
                  {bay + 1}
                </span>
              ))}
            </div>
            <div className="mt-1 flex items-center gap-2 ps-7 text-xs font-medium text-muted-foreground">
              <Truck aria-hidden="true" className="size-4 rtl:-scale-x-100" />
              {t('dockDoors')}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            {t('low')}
            <span
              className="h-2 w-24 rounded-full rtl:-scale-x-100"
              style={{
                background: `linear-gradient(to right, color-mix(in oklch, var(${scale[mode].token}) 12%, transparent), var(${scale[mode].token}))`,
              }}
            />
            {t('high')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm border bg-[repeating-linear-gradient(135deg,transparent_0_3px,var(--border)_3px_4px)]" />
            {t('emptyBin')}
          </span>
          <span className="ms-auto">{t('binSummary', { average, empty })}</span>
        </div>
      </Card>
      <Card
        key={bin.code}
        className="animate-in gap-4 px-5 py-4 duration-150 fade-in-0 2xl:self-start"
      >
        <div>
          <p className="text-xs text-muted-foreground">{t('bin')}</p>
          <h3
            dir="ltr"
            className="text-start text-lg font-semibold tracking-tight tabular-nums"
          >
            {bin.code}
          </h3>
        </div>
        <div className="grid gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{t('modeFill')}</span>
            <span className="font-medium tabular-nums">{bin.fill}%</span>
          </div>
          <Progress value={bin.fill} className="h-1.5" />
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">{t('modeIdle')}</dt>
            <dd className={cn('font-medium', bin.idle > 90 && 'text-warning')}>
              {t('daysCount', { count: bin.idle })}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t('modePicks')}</dt>
            <dd className="font-medium tabular-nums">{bin.picks}</dd>
          </div>
        </dl>
        <div className="grid gap-2 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            {t('contents')}
          </p>
          {bin.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('emptyBin')}</p>
          ) : (
            <ul className="grid gap-2">
              {bin.items.map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{item.name}</span>
                    <span
                      dir="ltr"
                      className="block text-start text-xs text-muted-foreground tabular-nums"
                    >
                      {item.sku}
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">
                    × {item.quantity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  )
}
