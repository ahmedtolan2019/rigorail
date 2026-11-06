import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpRight } from 'lucide-react'
import { DataTable } from '@/shared/data-table/data-table'
import { DataTableColumnHeader } from '@/shared/data-table/column-header'
import { money } from '@/shared/lib/format'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { ns } from './messages'
import type { RequestReport } from './schema'
import { breakdownRows, type Breakdown, type TableRow } from './report-data'

const rate = (row: {
  approved: number
  count: number
  draft: number | null
}) => {
  const submitted = row.count - (row.draft ?? 0)
  return submitted > 0 ? row.approved / submitted : null
}
const percent = (value: number | null) =>
  value === null
    ? '–'
    : new Intl.NumberFormat(undefined, {
        style: 'percent',
        maximumFractionDigits: 0,
      }).format(value)

export function BreakdownTable({
  report,
  breakdown,
  onBreakdownChange,
  rowLabel,
  onOpen,
}: {
  report: RequestReport
  breakdown: Breakdown
  onBreakdownChange: (breakdown: Breakdown) => void
  rowLabel: (row: { key: string; label: string }) => string
  onOpen?: (row: TableRow) => void
}) {
  const { t } = useTranslation(ns)
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'amountMinor', desc: true },
  ])
  const data = useMemo(
    () => breakdownRows(report, breakdown, rowLabel),
    [report, breakdown, rowLabel],
  )
  const totals = useMemo(
    () =>
      data.reduce(
        (sum, row) => ({
          count: sum.count + row.count,
          approved: sum.approved + row.approved,
          pending: sum.pending + (row.pending ?? 0),
          draft: sum.draft + (row.draft ?? 0),
          amountMinor: sum.amountMinor + row.amountMinor,
          approvedAmountMinor:
            sum.approvedAmountMinor + row.approvedAmountMinor,
        }),
        {
          count: 0,
          approved: 0,
          pending: 0,
          draft: 0,
          amountMinor: 0,
          approvedAmountMinor: 0,
        },
      ),
    [data],
  )
  const period = breakdown === 'period'
  const columns = useMemo<ColumnDef<TableRow>[]>(() => {
    const number = (
      id: keyof TableRow,
      title: string,
      format: (row: TableRow) => string,
      footer: string,
    ): ColumnDef<TableRow> => ({
      accessorKey: id,
      meta: { className: 'text-end tabular-nums' },
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={title}
          className="-me-2.5"
        />
      ),
      cell: ({ row }) => <bdi>{format(row.original)}</bdi>,
      footer: () => <bdi>{footer}</bdi>,
    })
    return [
      {
        accessorKey: 'label',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t(
              period ? 'period' : breakdown === 'owner' ? 'owner' : 'category',
            )}
          />
        ),
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 font-medium">
            <bdi>{row.original.label}</bdi>
            {onOpen && !period && (
              <ArrowUpRight
                aria-hidden="true"
                className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 rtl:-scale-x-100"
              />
            )}
          </span>
        ),
        footer: () => t('common:total'),
      },
      number(
        'count',
        t('requests'),
        (row) => String(row.count),
        String(totals.count),
      ),
      number(
        'approved',
        t('approved'),
        (row) => String(row.approved),
        String(totals.approved),
      ),
      ...(period
        ? []
        : [
            number(
              'pending',
              t('pending'),
              (row) => String(row.pending ?? '–'),
              String(totals.pending),
            ),
          ]),
      number(
        'amountMinor',
        t('requestedAmount'),
        (row) => money(row.amountMinor),
        money(totals.amountMinor),
      ),
      number(
        'approvedAmountMinor',
        t('approvedAmount'),
        (row) => money(row.approvedAmountMinor),
        money(totals.approvedAmountMinor),
      ),
      {
        id: 'rate',
        accessorFn: (row) => rate(row) ?? -1,
        meta: { className: 'text-end tabular-nums' },
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('approvalRate')}
            className="-me-2.5"
          />
        ),
        cell: ({ row }) => percent(rate(row.original)),
        footer: () =>
          percent(rate({ ...totals, draft: period ? null : totals.draft })),
      },
      {
        id: 'share',
        accessorFn: (row) => row.amountMinor,
        enableSorting: false,
        meta: { className: 'w-32' },
        header: t('share'),
        cell: ({ row }) => {
          const share = totals.amountMinor
            ? row.original.amountMinor / totals.amountMinor
            : 0
          return (
            <span className="flex items-center gap-2">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary/70"
                  style={{ width: `${share * 100}%` }}
                />
              </span>
              <span className="w-8 text-end text-xs text-muted-foreground tabular-nums">
                {percent(share)}
              </span>
            </span>
          )
        },
      },
    ]
  }, [t, breakdown, period, totals, onOpen])
  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.key,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })
  return (
    <Card className="min-w-0 gap-4 pb-0">
      <CardHeader>
        <CardTitle>{t('breakdown')}</CardTitle>
        <CardDescription>{t('breakdownHint')}</CardDescription>
        <CardAction>
          <Tabs
            value={breakdown}
            onValueChange={(value) => onBreakdownChange(value as Breakdown)}
          >
            <TabsList>
              <TabsTrigger value="category" aria-controls="breakdown-results">
                {t('byCategoryTab')}
              </TabsTrigger>
              <TabsTrigger value="owner" aria-controls="breakdown-results">
                {t('byOwnerTab')}
              </TabsTrigger>
              <TabsTrigger value="period" aria-controls="breakdown-results">
                {t('byPeriodTab')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardAction>
      </CardHeader>
      <CardContent
        id="breakdown-results"
        role="tabpanel"
        aria-label={t('breakdown')}
        className="px-0"
      >
        <DataTable
          table={table}
          caption={t('breakdown')}
          className="rounded-none border-x-0 border-b-0"
          onRowClick={
            onOpen && !period ? (row) => onOpen(row.original) : undefined
          }
        />
      </CardContent>
    </Card>
  )
}
