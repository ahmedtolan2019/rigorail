import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
  type GroupingState,
  type SortingState,
} from '@tanstack/react-table'
import { Plus, RotateCw } from 'lucide-react'
import { Illustration } from '@/shared/ui/illustration'
import { DataTable } from '@/shared/data-table/data-table'
import { DataTableColumnHeader } from '@/shared/data-table/column-header'
import { DataTableSearch } from '@/shared/data-table/search-input'
import { money } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/ui/empty'
import { PageSkeleton } from '@/shared/ui/page'
import { Progress } from '@/shared/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Skeleton } from '@/shared/ui/skeleton'
import { ns } from '../messages'
import { Showcase } from './section'

export default function Patterns() {
  const { t } = useTranslation(ns)
  return (
    <div className="grid gap-6">
      <Showcase title={t('pageAnatomy')} hint={t('pageAnatomyHint')}>
        <Anatomy />
      </Showcase>
      <Showcase
        title={t('states')}
        hint={t('statesHint')}
        className="grid gap-4 lg:grid-cols-3"
      >
        <State label={t('stateLoading')}>
          <div className="pointer-events-none origin-top-left scale-[0.55] rtl:origin-top-right">
            <div className="w-[180%]">
              <PageSkeleton />
            </div>
          </div>
        </State>
        <State label={t('stateEmpty')}>
          <Empty className="h-full border-0 p-4">
            <EmptyHeader>
              <EmptyMedia>
                <Illustration name="empty" className="size-20 sm:size-20" />
              </EmptyMedia>
              <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
              <EmptyDescription>{t('emptyHint')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </State>
        <State label={t('stateError')}>
          <Empty className="h-full border-0 p-4">
            <EmptyHeader>
              <EmptyMedia>
                <Illustration name="offline" className="size-20 sm:size-20" />
              </EmptyMedia>
              <EmptyTitle>{t('common:offlineTitle')}</EmptyTitle>
              <EmptyDescription>{t('common:connectionError')}</EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" size="sm">
              <RotateCw />
              {t('common:retry')}
            </Button>
          </Empty>
        </State>
      </Showcase>
      <Showcase title={t('advancedGrid')} hint={t('advancedGridHint')}>
        <AdvancedGrid />
      </Showcase>
      <Showcase title={t('treeGrid')} hint={t('treeGridHint')}>
        <TreeGrid />
      </Showcase>
    </div>
  )
}

function State({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <figure className="grid gap-2">
      <div className="h-56 overflow-hidden rounded-lg border bg-background">
        {children}
      </div>
      <figcaption className="text-xs text-muted-foreground">{label}</figcaption>
    </figure>
  )
}

function Anatomy() {
  const { t } = useTranslation(ns)
  const block = 'rounded-md border border-dashed border-primary/40 bg-primary/5'
  return (
    <div
      className="grid gap-3 rounded-lg border bg-muted/30 p-4"
      aria-hidden="true"
    >
      <div className={`flex items-center justify-between gap-3 p-3 ${block}`}>
        <span className="grid min-w-0 flex-1 gap-1.5">
          <Skeleton className="h-4 w-32 max-w-full bg-foreground/15" />
          <Skeleton className="h-3 w-52 max-w-full bg-foreground/10" />
        </span>
        <Button size="sm" tabIndex={-1}>
          <Plus />
          {t('primary')}
        </Button>
      </div>
      <div className={`flex gap-2 p-2 ${block}`}>
        <Skeleton className="h-7 w-40 min-w-0 shrink bg-foreground/10" />
        <Skeleton className="h-7 w-20 min-w-0 shrink bg-foreground/10" />
        <Skeleton className="h-7 w-20 min-w-0 shrink bg-foreground/10" />
      </div>
      <div className={`grid h-28 gap-2 p-3 ${block}`}>
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-4 bg-foreground/10" />
        ))}
      </div>
      <div className={`flex justify-end gap-1 p-2 ${block}`}>
        <Skeleton className="h-6 w-6 bg-foreground/10" />
        <Skeleton className="h-6 w-6 bg-foreground/10" />
      </div>
    </div>
  )
}

interface Order {
  id: string
  customer: string
  region: string
  product: string
  quantity: number
  revenueMinor: number
}
const regions = ['North', 'South', 'East', 'West', 'Central']
const products = ['Laptop', 'Monitor', 'Dock', 'Headset', 'Keyboard', 'Chair']
const customers = [
  'Acme',
  'Globex',
  'Initech',
  'Umbrella',
  'Stark',
  'Wayne',
  'Hooli',
  'Vandelay',
]
function makeOrders(count: number): Order[] {
  let seed = 42
  const next = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  return Array.from({ length: count }, (_, index) => {
    const quantity = 1 + Math.floor(next() * 40)
    return {
      id: `SO-${String(10001 + index)}`,
      customer: customers[Math.floor(next() * customers.length)]!,
      region: regions[Math.floor(next() * regions.length)]!,
      product: products[Math.floor(next() * products.length)]!,
      quantity,
      revenueMinor: quantity * (2000 + Math.floor(next() * 90000)),
    }
  })
}

function AdvancedGrid() {
  const { t } = useTranslation(ns)
  const data = useMemo(() => makeOrders(10_000), [])
  const [sorting, setSorting] = useState<SortingState>([])
  const [grouping, setGrouping] = useState<GroupingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [filter, setFilter] = useState('')
  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: 'id',
        size: 120,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('order')} />
        ),
        cell: ({ getValue }) => (
          <code dir="ltr" className="font-mono text-xs">
            {getValue<string>()}
          </code>
        ),
        aggregatedCell: () => null,
        enableGrouping: false,
      },
      {
        accessorKey: 'customer',
        size: 160,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('customer')} />
        ),
        aggregatedCell: () => null,
      },
      {
        accessorKey: 'region',
        size: 140,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('region')} />
        ),
        aggregatedCell: () => null,
      },
      {
        accessorKey: 'product',
        size: 140,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('product')} />
        ),
        aggregatedCell: () => null,
      },
      {
        accessorKey: 'quantity',
        size: 120,
        meta: { className: 'text-end' },
        aggregationFn: 'sum',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('quantity')}
            className="-me-2.5"
          />
        ),
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'revenueMinor',
        size: 160,
        meta: { className: 'text-end' },
        aggregationFn: 'sum',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('revenue')}
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
    data,
    columns,
    getRowId: (row) => row.id,
    state: {
      sorting,
      grouping,
      expanded,
      globalFilter: filter,
      columnPinning: { left: ['id'] },
    },
    onSortingChange: setSorting,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    autoResetExpanded: false,
    // This grid virtualizes all rows; there is no page index to reset. TanStack's
    // queued reset can otherwise update an abandoned initial Suspense render.
    autoResetPageIndex: false,
  })
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <DataTableSearch
          value={filter}
          onChange={setFilter}
          placeholder={t('common:search')}
          delay={150}
          className="w-full sm:w-64"
        />
        <Select
          value={grouping[0] ?? 'none'}
          onValueChange={(value) => {
            setGrouping(value === 'none' ? [] : [value])
            setExpanded({})
          }}
        >
          <SelectTrigger className="w-auto min-w-48" aria-label={t('groupBy')}>
            <span className="text-muted-foreground">{t('groupBy')}:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('noGrouping')}</SelectItem>
            <SelectItem value="region">{t('region')}</SelectItem>
            <SelectItem value="product">{t('product')}</SelectItem>
            <SelectItem value="customer">{t('customer')}</SelectItem>
          </SelectContent>
        </Select>
        <span className="ms-auto text-sm text-muted-foreground tabular-nums">
          {t('rowsCount', { count: table.getFilteredRowModel().rows.length })}
        </span>
      </div>
      <DataTable
        table={table}
        virtualize
        height={440}
        caption={t('advancedGrid')}
      />
    </div>
  )
}

interface CostCenter {
  id: string
  name: string
  budgetMinor: number
  spentMinor: number
  subRows?: CostCenter[]
}
const centers: CostCenter[] = [
  {
    id: 'ops',
    name: 'Operations',
    budgetMinor: 120_000_00,
    spentMinor: 86_400_00,
    subRows: [
      {
        id: 'ops-log',
        name: 'Logistics',
        budgetMinor: 70_000_00,
        spentMinor: 52_100_00,
        subRows: [
          {
            id: 'ops-log-fleet',
            name: 'Fleet',
            budgetMinor: 45_000_00,
            spentMinor: 38_900_00,
          },
          {
            id: 'ops-log-wh',
            name: 'Warehousing',
            budgetMinor: 25_000_00,
            spentMinor: 13_200_00,
          },
        ],
      },
      {
        id: 'ops-fac',
        name: 'Facilities',
        budgetMinor: 50_000_00,
        spentMinor: 34_300_00,
      },
    ],
  },
  {
    id: 'eng',
    name: 'Engineering',
    budgetMinor: 210_000_00,
    spentMinor: 121_750_00,
    subRows: [
      {
        id: 'eng-platform',
        name: 'Platform',
        budgetMinor: 130_000_00,
        spentMinor: 88_000_00,
      },
      {
        id: 'eng-tools',
        name: 'Tooling',
        budgetMinor: 80_000_00,
        spentMinor: 33_750_00,
      },
    ],
  },
  {
    id: 'people',
    name: 'People',
    budgetMinor: 60_000_00,
    spentMinor: 57_600_00,
  },
]

function TreeGrid() {
  const { t } = useTranslation(ns)
  const [expanded, setExpanded] = useState<ExpandedState>({ ops: true })
  const columns = useMemo<ColumnDef<CostCenter>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('costCenter'),
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'budgetMinor',
        header: t('budget'),
        meta: { className: 'text-end' },
        cell: ({ getValue }) => (
          <bdi className="tabular-nums">{money(getValue<number>())}</bdi>
        ),
      },
      {
        accessorKey: 'spentMinor',
        header: t('spent'),
        meta: { className: 'w-64' },
        cell: ({ row }) => {
          const ratio = row.original.spentMinor / row.original.budgetMinor
          return (
            <span className="flex items-center gap-3">
              <Progress
                value={ratio * 100}
                className="h-1.5"
                aria-label={t('spent')}
              />
              <span className="w-10 text-end text-xs text-muted-foreground tabular-nums">
                {Math.round(ratio * 100)}%
              </span>
            </span>
          )
        },
      },
    ],
    [t],
  )
  const table = useReactTable({
    data: centers,
    columns,
    getRowId: (row) => row.id,
    getSubRows: (row) => row.subRows,
    state: { expanded },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    autoResetPageIndex: false,
  })
  return <DataTable table={table} caption={t('treeGrid')} />
}
