import { useCallback, useMemo } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useServices } from '@/shared/api/services'
import { AccessBoundary } from '@/shared/auth/access'
import {
  ActiveFilters,
  DataTableFilters,
  type FilterDefinition,
} from '@/shared/data-table/filters'
import { ExportMenu } from '@/shared/export/export-menu'
import { getCurrency } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import {
  DateRangePicker,
  fromIsoDate,
  standardPresets,
  toIsoDate,
} from '@/shared/ui/date-range-picker'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/ui/empty'
import { Illustration } from '@/shared/ui/illustration'
import { Label } from '@/shared/ui/label'
import { PageHeader } from '@/shared/ui/page'
import { Failure } from '@/shared/ui/route-feedback'
import { Skeleton } from '@/shared/ui/skeleton'
import { Switch } from '@/shared/ui/switch'
import {
  categoryIcons,
  requestCategories,
  type RequestFilter,
} from '@/modules/requests/public'
import { BreakdownTable } from './breakdown'
import { ns } from './messages'
import { permissions } from './permissions'
import { reportOptions } from './queries'
import { resolveReportQuery } from './range'
import { exportReport } from './report-export'
import { reportPresets, type ReportSearch } from './schema'
import {
  CategoryChart,
  Kpis,
  StatusChart,
  TopRequesters,
  TrendChart,
} from './widgets'

const route = getRouteApi('/reports')

export default function Reports() {
  return (
    <AccessBoundary
      flag="requests"
      entitlement="requests"
      action={permissions.read}
    >
      <Dashboard />
    </AccessBoundary>
  )
}

function Dashboard() {
  const { t, i18n } = useTranslation(ns)
  const { api, session } = useServices()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const openRequests = useNavigate()
  const range = resolveReportQuery(search)
  const query = useQuery({
    ...reportOptions(api, session.workspace.id, range),
    placeholderData: keepPreviousData,
  })
  const report = query.data
  const presets = useMemo(() => standardPresets(t, reportPresets), [t])
  const update = (patch: Partial<ReportSearch>) =>
    // Same page, new URL state: keep the reader's scroll position.
    void navigate({
      search: (current) => ({ ...current, ...patch }),
      resetScroll: false,
    })
  const rangeFormat = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const from = fromIsoDate(range.from)!,
    to = fromIsoDate(range.to)!
  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1
  const previousTo = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate() - 1,
  )
  const previousFrom = new Date(
    previousTo.getFullYear(),
    previousTo.getMonth(),
    previousTo.getDate() - days + 1,
  )
  const periodFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        month: 'short',
        year: 'numeric',
        ...(report?.bucket === 'month' ? {} : { day: 'numeric' }),
      }),
    [i18n.language, report?.bucket],
  )
  // Breakdown keys are periods (yyyy-mm-dd), category ids or owner ids.
  const rowLabel = useCallback(
    (row: { key: string; label: string }) =>
      /^\d{4}-\d{2}-\d{2}$/.test(row.key)
        ? periodFormat.format(fromIsoDate(row.key)!)
        : (requestCategories as readonly string[]).includes(row.key)
          ? t(`requests:${row.key}`)
          : row.label,
    [periodFormat, t],
  )
  const filters: FilterDefinition[] = [
    {
      id: 'category',
      label: t('category'),
      type: 'options',
      value: search.category,
      onChange: (category) => update({ category }),
      options: requestCategories.map((category) => ({
        value: category,
        label: t(`requests:${category}`),
        icon: categoryIcons[category],
      })),
    },
    {
      id: 'owner',
      label: t('owner'),
      type: 'options',
      value: search.owner,
      onChange: (owner) => update({ owner }),
      options: (report?.owners ?? []).map((owner) => ({
        value: owner.id,
        label: owner.name,
      })),
    },
  ]
  // Drill-down keeps the same window and filters in the request list.
  const drill = (patch: { category?: string[]; owner?: string[] }) =>
    void openRequests({
      to: '/requests',
      search: {
        category: (patch.category ??
          search.category) as RequestFilter['category'],
        owner: patch.owner ?? search.owner,
        from: range.from,
        to: range.to,
      },
    })
  const empty = report && report.totals.count === 0
  return (
    <>
      <PageHeader
        title={t('navigation')}
        description={t('subtitle')}
        actions={
          <ExportMenu
            disabled={!report || Boolean(empty)}
            onExport={(kind) =>
              exportReport({
                kind,
                report: report!,
                breakdown: search.breakdown,
                t,
                label: rowLabel,
                document: {
                  fileName: `${t('title')} ${range.from} ${range.to}`,
                  title: t('title'),
                  subtitle: rangeFormat.formatRange(from, to),
                  details: [
                    [t('period'), `${range.from} → ${range.to}`],
                    ...(report?.previous
                      ? [
                          [
                            t('previousPeriod'),
                            `${toIsoDate(previousFrom)} → ${toIsoDate(previousTo)}`,
                          ] as [string, string],
                        ]
                      : []),
                    ...filters
                      .filter(
                        (filter) =>
                          filter.type === 'options' && filter.value.length,
                      )
                      .map((filter): [string, string] => [
                        filter.label,
                        filter.type === 'options'
                          ? filter.options
                              .filter((option) =>
                                filter.value.includes(option.value),
                              )
                              .map((option) => option.label)
                              .join(', ')
                          : '',
                      ]),
                    [
                      t('common:generatedAt'),
                      new Date().toLocaleString(i18n.language),
                    ],
                  ],
                  currency: getCurrency(),
                  rtl: i18n.dir() === 'rtl',
                },
              })
            }
          />
        }
      />
      <div className="mb-3 flex items-center gap-2">
        <DateRangePicker
          value={{
            from,
            to,
            preset: search.preset === 'custom' ? undefined : search.preset,
          }}
          onChange={(value) =>
            value.preset
              ? update({
                  preset: value.preset as ReportSearch['preset'],
                  from: undefined,
                  to: undefined,
                })
              : value.from &&
                update({
                  preset: 'custom',
                  from: toIsoDate(value.from),
                  to: toIsoDate(value.to ?? value.from),
                })
          }
          presets={presets}
          className="w-auto max-w-[16rem] min-w-0 sm:min-w-44"
        />
        <DataTableFilters
          filters={filters}
          onClearAll={() => update({ category: [], owner: [] })}
        />
        <div className="flex min-w-0 items-center gap-2 ps-1">
          <Switch
            id="compare"
            checked={search.compare}
            onCheckedChange={(compare) => update({ compare })}
          />
          <Label htmlFor="compare" className="truncate font-normal">
            <span className="sr-only md:not-sr-only">{t('compare')}</span>
            <span className="md:hidden">{t('previous')}</span>
          </Label>
        </div>
        {search.compare && (
          <span className="ms-auto hidden truncate text-sm text-muted-foreground lg:inline">
            {t('comparedTo', {
              range: rangeFormat.formatRange(previousFrom, previousTo),
            })}
          </span>
        )}
      </div>
      <div className="mb-4 empty:hidden">
        <ActiveFilters
          filters={filters}
          onClearAll={() => update({ category: [], owner: [] })}
        />
      </div>
      {query.isError && !report ? (
        <Failure
          error={query.error}
          retry={() => void query.refetch()}
          layout="page"
        />
      ) : !report ? (
        <DashboardSkeleton />
      ) : empty ? (
        <Empty className="min-h-[50vh] border">
          <EmptyHeader>
            <EmptyMedia>
              <Illustration name="no-results" />
            </EmptyMedia>
            <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('emptyHint')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div
          className={cn(
            'grid gap-3 transition-opacity duration-200 lg:gap-4',
            query.isPlaceholderData && 'opacity-60',
          )}
          aria-busy={query.isFetching}
        >
          <Kpis report={report} />
          <div className="grid gap-3 md:grid-cols-3 lg:gap-4">
            <TrendChart
              report={report}
              metric={search.metric}
              onMetricChange={(metric) => update({ metric })}
            />
            <StatusChart report={report} />
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:gap-4">
            <CategoryChart
              report={report}
              onSelect={(category) => drill({ category: [category] })}
            />
            <TopRequesters
              report={report}
              onSelect={(owner) => drill({ owner: [owner] })}
            />
          </div>
          <BreakdownTable
            report={report}
            breakdown={search.breakdown}
            onBreakdownChange={(breakdown) => update({ breakdown })}
            rowLabel={rowLabel}
            onOpen={(row) =>
              drill(
                search.breakdown === 'owner'
                  ? { owner: [row.key] }
                  : { category: [row.key] },
              )
            }
          />
          <p className="text-xs text-muted-foreground">
            {t('serverAggregates')}
          </p>
        </div>
      )}
    </>
  )
}

function DashboardSkeleton() {
  const { t } = useTranslation()
  return (
    <div
      role="status"
      aria-label={t('loading')}
      className="grid gap-3 lg:gap-4"
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[6.5rem] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-3 lg:gap-4">
        <Skeleton className="h-[21rem] rounded-xl md:col-span-2" />
        <Skeleton className="h-[21rem] rounded-xl" />
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )
}
