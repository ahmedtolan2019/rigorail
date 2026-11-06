import { useMemo, useState } from 'react'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import {
  Armchair,
  Car,
  LayoutGrid,
  Laptop,
  MapPin,
  Printer,
  Rows3,
  Server,
  type LucideIcon,
} from 'lucide-react'
import { DataTableColumnHeader } from '@/shared/data-table/column-header'
import { DataTable } from '@/shared/data-table/data-table'
import { DataTableSearch } from '@/shared/data-table/search-input'
import { money } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import { Illustration } from '@/shared/ui/illustration'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { ns } from '../messages'

type Kind = 'laptop' | 'server' | 'printer' | 'vehicle' | 'furniture'
type Condition = 'inUse' | 'repair' | 'stored'
interface Asset {
  tag: string
  name: string
  kind: Kind
  location: string
  condition: Condition
  value: number
}
const icons: Record<Kind, LucideIcon> = {
  laptop: Laptop,
  server: Server,
  printer: Printer,
  vehicle: Car,
  furniture: Armchair,
}
const conditionTone: Record<Condition, string> = {
  inUse: 'bg-success/12 text-success',
  repair: 'bg-warning/12 text-warning',
  stored: 'bg-muted text-muted-foreground',
}
const conditionLabel = {
  inUse: 'conditionInUse',
  repair: 'conditionRepair',
  stored: 'conditionStored',
} as const
const assets: Asset[] = [
  {
    tag: 'AST-0142',
    name: 'MacBook Pro 14"',
    kind: 'laptop',
    location: 'Riyadh HQ',
    condition: 'inUse',
    value: 899_000,
  },
  {
    tag: 'AST-0157',
    name: 'ThinkPad X1 Carbon',
    kind: 'laptop',
    location: 'Dubai office',
    condition: 'repair',
    value: 645_000,
  },
  {
    tag: 'AST-0203',
    name: 'Rack server R750',
    kind: 'server',
    location: 'Data centre A',
    condition: 'inUse',
    value: 2_450_000,
  },
  {
    tag: 'AST-0219',
    name: 'Storage array',
    kind: 'server',
    location: 'Data centre A',
    condition: 'inUse',
    value: 3_120_000,
  },
  {
    tag: 'AST-0311',
    name: 'Colour laser printer',
    kind: 'printer',
    location: 'Riyadh HQ',
    condition: 'stored',
    value: 98_000,
  },
  {
    tag: 'AST-0405',
    name: 'Delivery van',
    kind: 'vehicle',
    location: 'Jeddah depot',
    condition: 'inUse',
    value: 11_500_000,
  },
  {
    tag: 'AST-0412',
    name: 'Forklift',
    kind: 'vehicle',
    location: 'Jeddah depot',
    condition: 'repair',
    value: 7_800_000,
  },
  {
    tag: 'AST-0520',
    name: 'Boardroom table',
    kind: 'furniture',
    location: 'Dubai office',
    condition: 'inUse',
    value: 420_000,
  },
]

export default function Gallery() {
  const { t } = useTranslation(ns)
  const [mode, setMode] = useState<'cards' | 'table'>('cards')
  const [query, setQuery] = useState('')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ])
  const columns = useMemo<ColumnDef<Asset>[]>(
    () => [
      {
        accessorKey: 'tag',
        meta: { label: t('assetTag') },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('assetTag')} />
        ),
        cell: ({ getValue }) => (
          <span dir="ltr" className="text-muted-foreground tabular-nums">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        meta: { label: t('assetName') },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('assetName')} />
        ),
        cell: ({ row }) => {
          const Icon = icons[row.original.kind]
          return (
            <span className="flex items-center gap-2 font-medium">
              <Icon
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
              {row.original.name}
            </span>
          )
        },
      },
      {
        accessorKey: 'location',
        meta: { label: t('location') },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('location')} />
        ),
      },
      {
        accessorKey: 'condition',
        meta: { label: t('condition') },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('condition')} />
        ),
        cell: ({ getValue }) => {
          const value = getValue<Condition>()
          return (
            <Badge
              variant="secondary"
              className={cn('rounded-full border-0', conditionTone[value])}
            >
              {t(conditionLabel[value])}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'value',
        meta: { label: t('bookValue'), className: 'text-end' },
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('bookValue')}
            className="-me-2.5"
          />
        ),
        cell: ({ getValue }) => (
          <bdi className="font-medium tabular-nums">
            {money(getValue<number>())}
          </bdi>
        ),
      },
    ],
    [t],
  )
  const table = useReactTable({
    data: assets,
    columns,
    getRowId: (row) => row.tag,
    state: { sorting, globalFilter: query },
    onSortingChange: setSorting,
    onGlobalFilterChange: setQuery,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })
  // Both views read the same sorted and filtered row model.
  const rows = table.getRowModel().rows
  const sort = sorting[0]
    ? `${sorting[0].id}:${sorting[0].desc ? 'desc' : 'asc'}`
    : 'name:asc'
  const empty = (
    <div className="grid place-items-center gap-1 py-10 text-center">
      <Illustration name="no-results" className="size-28 sm:size-28" />
      <p className="font-medium">{t('noMatches')}</p>
      <p className="text-sm text-muted-foreground">{t('noMatchesHint')}</p>
    </div>
  )
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <DataTableSearch
          value={query}
          onChange={setQuery}
          placeholder={t('searchAssets')}
          delay={150}
          className="w-full sm:w-64"
        />
        <Select
          value={sort}
          onValueChange={(value) => {
            const [id, direction] = value.split(':')
            setSorting([{ id: id!, desc: direction === 'desc' }])
          }}
        >
          <SelectTrigger className="w-auto" aria-label={t('sortBy')}>
            <span className="text-muted-foreground">{t('sortBy')}:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name:asc">{t('sortName')}</SelectItem>
            <SelectItem value="value:desc">{t('sortValueHigh')}</SelectItem>
            <SelectItem value="value:asc">{t('sortValueLow')}</SelectItem>
            <SelectItem value="location:asc">{t('location')}</SelectItem>
          </SelectContent>
        </Select>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={mode}
          onValueChange={(value) => value && setMode(value as typeof mode)}
          aria-label={t('viewMode')}
          className="ms-auto"
        >
          <ToggleGroupItem
            value="cards"
            aria-label={t('cardsView')}
            className="px-2.5"
          >
            <LayoutGrid />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="table"
            aria-label={t('tableView')}
            className="px-2.5"
          >
            <Rows3 />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {mode === 'table' ? (
        <DataTable table={table} caption={t('gallery')} empty={empty} />
      ) : rows.length === 0 ? (
        <Card>{empty}</Card>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-3">
          {rows.map(({ original: asset }) => {
            const Icon = icons[asset.kind]
            return (
              <li key={asset.tag}>
                <Card className="group h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
                  <div className="relative grid h-24 place-items-center bg-gradient-to-br from-muted to-muted/40">
                    <Icon
                      aria-hidden="true"
                      className="size-9 text-muted-foreground/70 transition-transform duration-300 group-hover:scale-110"
                    />
                    <Badge
                      variant="secondary"
                      className={cn(
                        'absolute end-2 top-2 rounded-full border-0',
                        conditionTone[asset.condition],
                      )}
                    >
                      {t(conditionLabel[asset.condition])}
                    </Badge>
                  </div>
                  <div className="grid gap-1 p-3">
                    <p className="truncate text-sm font-medium">{asset.name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin aria-hidden="true" className="size-3 shrink-0" />
                      {asset.location}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span
                        dir="ltr"
                        className="text-muted-foreground tabular-nums"
                      >
                        {asset.tag}
                      </span>
                      <bdi className="font-semibold tabular-nums">
                        {money(asset.value)}
                      </bdi>
                    </div>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
