import { useMemo, useState } from 'react'
import { Link, getRouteApi, useRouterState } from '@tanstack/react-router'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnPinningState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  CheckCheck,
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
} from 'lucide-react'
import { useServices } from '@/shared/api/services'
import { AccessBoundary } from '@/shared/auth/access'
import { useCapability } from '@/shared/capabilities/hooks'
import { usePersistentState } from '@/shared/hooks/use-persistent-state'
import {
  date,
  dateTime,
  getCurrency,
  money,
  relativeDate,
} from '@/shared/lib/format'
import { DataTable, selectionColumn } from '@/shared/data-table/data-table'
import { DataTableColumnHeader } from '@/shared/data-table/column-header'
import {
  ActiveFilters,
  DataTableFilters,
  type FilterDefinition,
} from '@/shared/data-table/filters'
import { exportCsv } from '@/shared/export/csv'
import { ExportMenu, type ExportKind } from '@/shared/export/export-menu'
import type { ExportDocument, ExportSheet } from '@/shared/export/model'
import { exportXlsx } from '@/shared/export/xlsx'
import {
  fromIsoDate,
  standardPresets,
  toIsoDate,
} from '@/shared/ui/date-range-picker'
import { DataTablePagination } from '@/shared/data-table/pagination'
import { DataTableSearch } from '@/shared/data-table/search-input'
import {
  DataTableSelectionBar,
  useServerSelection,
} from '@/shared/data-table/selection'
import { DataTableViewOptions } from '@/shared/data-table/view-options'
import { useShortcut } from '@/shared/shortcuts/registry'
import { SavedViews } from '@/shared/data-table/saved-views'
import type { SavedViewState } from '@/shared/data-table/saved-views-model'
import { Button } from '@/shared/ui/button'
import { ConfirmAction } from '@/shared/ui/confirm-action'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/ui/empty'
import { Failure } from '@/shared/ui/route-feedback'
import { Illustration } from '@/shared/ui/illustration'
import { PageHeader } from '@/shared/ui/page'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'
import { permissions } from '../permissions'
import {
  defaultRequestSearch,
  PAGE_SIZES,
  requestCategories,
  requestSearch,
  requestStatuses,
  type RequestRecord,
  type RequestSearch,
} from '../schema'
import {
  fetchExport,
  listOptions,
  searchOwners,
  requestKeys,
  runBulkCommand,
} from '../queries'
import { ns } from '../i18n'
import { CategoryLabel, Person, StatusBadge } from '../presentation'
import { categoryIcons } from '../categories'

const route = getRouteApi('/requests/')
// Table column id -> server sort key.
const sortColumns: Record<string, RequestSearch['sort']> = {
  title: 'title',
  amountMinor: 'amount',
  status: 'status',
  ownerName: 'owner',
  updatedAt: 'updated',
  createdAt: 'created',
}
const defaultVisibility: VisibilityState = { createdAt: false }
const defaultPinning: ColumnPinningState = {
  left: ['select', 'title'],
  right: ['actions'],
}
const cleared = {
  q: '',
  status: [],
  category: [],
  owner: [],
  from: undefined,
  to: undefined,
}

export default function RequestList() {
  return (
    <AccessBoundary
      flag="requests"
      entitlement="requests"
      action={permissions.read}
    >
      <ListContent />
    </AccessBoundary>
  )
}

function ListContent() {
  const { t, i18n } = useTranslation(ns)
  const services = useServices(),
    client = useQueryClient()
  const navigate = route.useNavigate()
  const search = route.useSearch()
  const scope = services.session.workspace.id
  const create = useCapability({
    action: permissions.create,
    quota: 'requests.create',
  })
  const query = useQuery({
    ...listOptions(services.api, scope, search),
    placeholderData: keepPreviousData,
  })
  // A filter change updates the URL at once but keeps the previous rows until the
  // route loader settles; treat that window as loading so nothing acts on stale rows.
  const navigating = useRouterState({ select: (state) => state.status === 'pending' })
  const stale = query.isPlaceholderData || navigating
  const items = useMemo(() => query.data?.items ?? [], [query.data])
  // References of rows seen on any page, so confirmations can name selected records.
  const [references] = useState(() => new Map<string, string>())
  for (const item of items) references.set(item.id, item.reference)
  const total = query.data?.total ?? 0
  const selection = useServerSelection({
    pageIds: items.map((item) => item.id),
    total,
    scope: JSON.stringify([
      scope,
      search.q,
      search.status,
      search.category,
      search.owner,
    ]),
  })
  const [columnVisibility, setColumnVisibility] =
    usePersistentState<VisibilityState>(
      'requests:list:columns',
      defaultVisibility,
    )
  const [columnPinning, setColumnPinning] =
    usePersistentState<ColumnPinningState>(
      'requests:list:pinning',
      defaultPinning,
    )
  // Saved views store only what differs from the defaults (never the page number).
  const viewState = useMemo<SavedViewState>(() => {
    const changed = Object.fromEntries(
      Object.entries(search).filter(
        ([key, value]) =>
          key !== 'page' &&
          JSON.stringify(value) !==
            JSON.stringify(defaultRequestSearch[key as keyof RequestSearch]),
      ),
    )
    const columnsChanged =
      JSON.stringify(columnVisibility) !== JSON.stringify(defaultVisibility) ||
      JSON.stringify(columnPinning) !== JSON.stringify(defaultPinning)
    return {
      search: changed,
      ...(columnsChanged
        ? { columns: { visibility: columnVisibility, pinning: columnPinning } }
        : {}),
    }
  }, [search, columnVisibility, columnPinning])
  const applyView = (state: SavedViewState | null) => {
    // Validate through the route schema: views saved by older versions stay safe.
    void navigate({
      search: requestSearch.parse({ ...(state?.search ?? {}), page: 1 }),
      resetScroll: false,
    })
    setColumnVisibility(state?.columns?.visibility ?? defaultVisibility)
    const pinning = state?.columns?.pinning
    setColumnPinning(
      pinning
        ? {
            left: [
              'select',
              ...(pinning.left ?? []).filter((id) => id !== 'select'),
            ],
            right: [
              ...(pinning.right ?? []).filter((id) => id !== 'actions'),
              'actions',
            ],
          }
        : defaultPinning,
    )
  }
  const update = (patch: Partial<RequestSearch>) =>
    // Same page, new URL state: keep the reader's scroll position.
    void navigate({
      search: (current) => ({ ...current, page: 1, ...patch }),
      resetScroll: false,
    })
  const filtered =
    search.q !== '' ||
    search.status.length > 0 ||
    search.category.length > 0 ||
    search.owner.length > 0 ||
    Boolean(search.from)
  const bulk = useMutation({
    mutationFn: (action: 'submit' | 'approve') =>
      runBulkCommand(services.api, {
        action,
        target:
          selection.selection.mode === 'ids'
            ? { mode: 'ids', ids: selection.selection.ids }
            : {
                mode: 'all',
                excluded: selection.selection.excluded,
                filter: {
                  q: search.q,
                  status: search.status,
                  category: search.category,
                  owner: search.owner,
                  from: search.from,
                  to: search.to,
                },
              },
      }),
    onSuccess: async (result) => {
      const done = result.succeeded.length,
        failed = result.failed.length
      if (done && !failed) toast.success(t('bulkDone', { count: done }))
      else if (done) toast.warning(t('bulkPartial', { done, failed }))
      else toast.error(t('bulkNone'))
      selection.clear()
      await client.invalidateQueries({ queryKey: requestKeys.all(scope) })
    },
    onError: () => toast.error(t('unavailable')),
  })

  const presets = useMemo(() => standardPresets(t), [t])
  const filters: FilterDefinition[] = [
    {
      id: 'status',
      label: t('status'),
      type: 'options',
      value: search.status,
      onChange: (status) =>
        update({ status: status as RequestSearch['status'] }),
      options: requestStatuses.map((status) => ({
        value: status,
        label: t(status),
        count: query.data?.facets.status[status],
      })),
    },
    {
      id: 'category',
      label: t('category'),
      type: 'options',
      value: search.category,
      onChange: (category) =>
        update({ category: category as RequestSearch['category'] }),
      options: requestCategories.map((category) => ({
        value: category,
        label: t(category),
        icon: categoryIcons[category],
        count: query.data?.facets.category[category],
      })),
    },
    {
      id: 'owner',
      label: t('owner'),
      type: 'options',
      value: search.owner,
      onChange: (owner) => update({ owner }),
      options: (query.data?.facets.owner ?? []).map((owner) => ({
        value: owner.id,
        label: owner.name,
        count: owner.count,
      })),
      total: query.data?.facets.ownerTotal,
      search: (name, signal) =>
        searchOwners(services.api, search, name, signal),
    },
    {
      id: 'created',
      label: t('created'),
      type: 'date',
      presets,
      value: {
        from: fromIsoDate(search.from),
        to: fromIsoDate(search.to),
      },
      onChange: (range) =>
        update({
          from: range.from && toIsoDate(range.from),
          to: range.to && toIsoDate(range.to),
        }),
    },
  ]
  async function exportRequests(kind: ExportKind) {
    const { items, total: matching } = await fetchExport(services.api, search)
    const document: ExportDocument = {
      fileName: `${t('navigation')} ${toIsoDate(new Date())}`,
      title: t('navigation'),
      subtitle: `${t('common:generatedAt')}: ${dateTime()}`,
      details: [
        ...filters
          .filter((filter) =>
            filter.type === 'options' ? filter.value.length : filter.value.from,
          )
          .map((filter): [string, string] => [
            filter.label,
            filter.type === 'options'
              ? filter.options
                  .filter((option) => filter.value.includes(option.value))
                  .map((option) => option.label)
                  .join(', ')
              : `${search.from ?? ''} → ${search.to ?? ''}`,
          ]),
        ...(search.q
          ? [[t('common:search'), search.q] as [string, string]]
          : []),
        [t('records', { count: matching }), ''],
      ],
      currency: getCurrency(),
      rtl: i18n.dir() === 'rtl',
    }
    const sheet: ExportSheet<RequestRecord> = {
      name: t('navigation'),
      totalsLabel: t('common:total'),
      rows: items,
      columns: [
        { header: t('reference'), value: (row) => row.reference },
        { header: t('title'), value: (row) => row.title, width: 32 },
        { header: t('category'), value: (row) => t(row.category) },
        { header: t('owner'), value: (row) => row.ownerName },
        { header: t('status'), value: (row) => t(row.status) },
        {
          header: t('amount'),
          value: (row) => row.amountMinor / 100,
          format: 'money',
          total: 'sum',
        },
        {
          header: t('created'),
          value: (row) => new Date(row.createdAt),
          format: 'date',
        },
        {
          header: t('updated'),
          value: (row) => new Date(row.updatedAt),
          format: 'datetime',
        },
        {
          header: t('description'),
          value: (row) => row.description,
          width: 48,
        },
      ],
    }
    if (kind === 'csv') exportCsv(document, sheet)
    else await exportXlsx(document, [sheet as ExportSheet<unknown>])
  }
  const columns = useMemo<ColumnDef<RequestRecord>[]>(
    () => [
      selectionColumn<RequestRecord>({
        all: t('selectAll'),
        row: t('selectRow'),
      }),
      {
        accessorKey: 'title',
        meta: { label: t('title') },
        enableHiding: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('title')} />
        ),
        cell: ({ row }) => <TitleCell record={row.original} />,
      },
      {
        accessorKey: 'category',
        meta: { label: t('category') },
        enableSorting: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('category')} />
        ),
        cell: ({ row }) => <CategoryLabel category={row.original.category} />,
      },
      {
        accessorKey: 'ownerName',
        meta: { label: t('owner') },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('owner')} />
        ),
        cell: ({ row }) => (
          <Person id={row.original.ownerId} name={row.original.ownerName} />
        ),
      },
      {
        accessorKey: 'amountMinor',
        meta: { label: t('amount'), className: 'text-end' },
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('amount')}
            className="-me-2.5"
          />
        ),
        cell: ({ row }) => (
          <bdi className="font-medium">{money(row.original.amountMinor)}</bdi>
        ),
      },
      {
        accessorKey: 'status',
        meta: { label: t('status') },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('status')} />
        ),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'createdAt',
        meta: { label: t('created') },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('created')} />
        ),
        cell: ({ row }) => <When iso={row.original.createdAt} />,
      },
      {
        accessorKey: 'updatedAt',
        meta: { label: t('updated') },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('updated')} />
        ),
        cell: ({ row }) => <When iso={row.original.updatedAt} />,
      },
      {
        id: 'actions',
        size: 48,
        enableHiding: false,
        enableSorting: false,
        enablePinning: false,
        header: () => <span className="sr-only">{t('actions')}</span>,
        cell: ({ row }) => <RowActions record={row.original} />,
      },
    ],
    [t],
  )
  const sorting: SortingState = [
    {
      id:
        Object.entries(sortColumns).find(
          ([, value]) => value === search.sort,
        )?.[0] ?? 'updatedAt',
      desc: search.dir === 'desc',
    },
  ]
  const table = useReactTable({
    data: items,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    rowCount: total,
    // Rows from the previous query stay visible while fetching; never select those.
    enableRowSelection: !stale,
    state: {
      sorting,
      columnVisibility,
      rowSelection: selection.rowSelection,
      columnPinning,
    },
    initialState: {
      columnVisibility: defaultVisibility,
      columnPinning: defaultPinning,
    },
    // Users pin any column; selection always stays first and row actions last.
    onColumnPinningChange: (updater) =>
      setColumnPinning((current) => {
        const next = typeof updater === 'function' ? updater(current) : updater
        const left = (next.left ?? []).filter((id) => id !== 'select')
        const right = (next.right ?? []).filter((id) => id !== 'actions')
        return { left: ['select', ...left], right: [...right, 'actions'] }
      }),
    onRowSelectionChange: selection.onRowSelectionChange,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      const first = next[0]
      update(
        first
          ? {
              sort: sortColumns[first.id] ?? 'updated',
              dir: first.desc ? 'desc' : 'asc',
            }
          : { sort: 'updated', dir: 'desc' },
      )
    },
  })
  const facets = query.data?.facets
  const confirmChips = selection.allMatching
    ? filters.flatMap((filter) =>
        filter.type === 'options'
          ? filter.options
              .filter((option) => filter.value.includes(option.value))
              .map((option) => option.label)
          : filter.value.from
            ? [`${search.from} → ${search.to}`]
            : [],
      )
    : selection.selection.mode === 'ids'
      ? selection.selection.ids.map((id) => references.get(id) ?? id)
      : []
  const statusTotal = facets
    ? requestStatuses.reduce((sum, status) => sum + facets.status[status], 0)
    : undefined
  useShortcut(
    { keys: '/', label: t('shortcutFocusSearch'), group: t('navigation') },
    () =>
      document
        .querySelector<HTMLInputElement>(
          `input[aria-label="${t('searchRequests')}"]`,
        )
        ?.focus(),
  )
  useShortcut(
    {
      keys: 'n',
      label: t('newRequest'),
      group: t('navigation'),
      enabled: create.status === 'allowed',
    },
    () => void navigate({ to: '/requests/new', search }),
  )
  const newRequest = (
    <Button asChild>
      <Link to="/requests/new" search={search}>
        <Plus data-icon="inline-start" />
        {t('newRequest')}
      </Link>
    </Button>
  )

  return (
    <>
      <PageHeader
        title={t('navigation')}
        description={t('requestSubtitle')}
        actions={
          create.status === 'allowed' ? (
            newRequest
          ) : (
            <div className="flex flex-col items-start gap-1.5 sm:items-end">
              <Button disabled>
                <Plus data-icon="inline-start" />
                {t('newRequest')}
              </Button>
              {create.status === 'denied' && (
                <p className="max-w-xs text-xs text-muted-foreground sm:text-end">
                  {t(create.reason)}
                </p>
              )}
            </div>
          )
        }
      />
      <Tabs
        value={search.status.length === 1 ? search.status[0]! : 'all'}
        onValueChange={(value) =>
          update({
            status: value === 'all' ? [] : [value as RequestRecord['status']],
          })
        }
        className="mb-4"
      >
        <TabsList className="max-w-full justify-start overflow-x-auto">
          {(['all', ...requestStatuses] as const).map((status) => (
            <TabsTrigger
              key={status}
              value={status}
              // Every status tab filters the same results panel below.
              aria-controls="requests-results"
              className="gap-1.5 px-3"
            >
              {t(status === 'all' ? 'viewAll' : status)}
              {facets && (
                <span className="rounded-full bg-muted px-1.5 text-xs leading-5 font-normal text-muted-foreground tabular-nums">
                  {status === 'all' ? statusTotal : facets.status[status]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="mb-3 flex items-center gap-2">
        <SavedViews
          scope="requests"
          current={viewState}
          defaultLabel={t('allRequests')}
          onApply={applyView}
        />
        <DataTableSearch
          value={search.q}
          onChange={(q) => update({ q })}
          placeholder={t('searchRequests')}
          className="min-w-0 flex-1 sm:max-w-72"
        />
        <DataTableFilters
          filters={filters}
          onClearAll={() => update(cleared)}
        />
        <div className="ms-auto flex items-center gap-2">
          <DataTableViewOptions table={table} />
          <ExportMenu
            disabled={!total}
            onExport={(kind) => exportRequests(kind)}
          />
        </div>
      </div>
      <div className="mb-3 empty:hidden">
        <ActiveFilters
          filters={filters}
          onClearAll={() => update(cleared)}
          extra={
            search.q
              ? [
                  {
                    id: 'q',
                    label: (
                      <>
                        <span className="text-muted-foreground">
                          {t('common:search')}:
                        </span>{' '}
                        “{search.q}”
                      </>
                    ),
                    onRemove: () => update({ q: '' }),
                  },
                ]
              : undefined
          }
        />
      </div>
      <div id="requests-results" role="tabpanel" aria-label={t('navigation')}>
        {query.isError && !query.data ? (
          <Failure
            error={query.error}
            retry={() => void query.refetch()}
            layout="page"
          />
        ) : (
          <DataTable
            table={table}
            loading={query.isPending}
            fetching={query.isFetching || navigating}
            skeletonRows={Math.min(search.size, 12)}
            caption={t('navigation')}
            fitViewport
            onRowClick={(row) =>
              void navigate({
                to: '/requests/$requestId',
                params: { requestId: row.original.id },
                search,
              })
            }
            empty={
              <Empty className="border-0 py-16">
                <EmptyHeader>
                  <EmptyMedia>
                    <Illustration name={filtered ? 'no-results' : 'empty'} />
                  </EmptyMedia>
                  <EmptyTitle>
                    {t(filtered ? 'noMatches' : 'emptyTitle')}
                  </EmptyTitle>
                  <EmptyDescription>
                    {t(filtered ? 'noMatchesHint' : 'emptyHint')}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  {filtered ? (
                    <Button variant="outline" onClick={() => update(cleared)}>
                      {t('clearFilters')}
                    </Button>
                  ) : (
                    create.status === 'allowed' && newRequest
                  )}
                </EmptyContent>
              </Empty>
            }
          />
        )}
      </div>
      <DataTablePagination
        page={search.page}
        pageSize={search.size}
        total={total}
        pageSizes={PAGE_SIZES}
        disabled={query.isFetching}
        onPageChange={(page) =>
          void navigate({
            search: (current) => ({ ...current, page }),
            resetScroll: false,
          })
        }
        onPageSizeChange={(size) => update({ size })}
      />
      {services.mode === 'demo' && (
        <p className="mt-6 text-xs text-muted-foreground">{t('demoNote')}</p>
      )}
      <DataTableSelectionBar
        count={selection.count}
        total={total}
        allMatching={selection.allMatching}
        pageFullySelected={selection.pageFullySelected}
        onSelectAll={selection.selectAllMatching}
        onClear={selection.clear}
      >
        <ConfirmAction
          title={t('confirmBulkSubmit', { count: selection.count })}
          chips={confirmChips}
          chipTotal={selection.allMatching ? undefined : selection.count}
          description={t('confirmBulkHint')}
          confirmLabel={t('submitCount', { count: selection.count })}
          tone="default"
          icon={Send}

          details={[
            [t('requestCount'), selection.count],
            [
              t('appliesTo'),
              t(selection.allMatching ? 'scopeAll' : 'scopeSelected'),
            ],
          ]}
          onConfirm={() => bulk.mutate('submit')}
        >
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            disabled={bulk.isPending}
          >
            <Send />
            {t('bulkSubmit')}
          </Button>
        </ConfirmAction>
        <ConfirmAction
          title={t('confirmBulkApprove', { count: selection.count })}
          chips={confirmChips}
          chipTotal={selection.allMatching ? undefined : selection.count}
          description={t('confirmBulkHint')}
          confirmLabel={t('approveCount', { count: selection.count })}
          tone="warning"
          icon={CheckCheck}
          irreversible
          details={[
            [t('requestCount'), selection.count],
            [
              t('appliesTo'),
              t(selection.allMatching ? 'scopeAll' : 'scopeSelected'),
            ],
          ]}
          onConfirm={() => bulk.mutate('approve')}
        >
          <Button size="sm" className="h-8" disabled={bulk.isPending}>
            <CheckCheck />
            {t('bulkApprove')}
          </Button>
        </ConfirmAction>
      </DataTableSelectionBar>
    </>
  )
}

function When({ iso }: { iso: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time
          dateTime={iso}
          className="whitespace-nowrap text-muted-foreground"
        >
          {relativeDate(iso)}
        </time>
      </TooltipTrigger>
      <TooltipContent>{date(iso)}</TooltipContent>
    </Tooltip>
  )
}

function RowActions({ record }: { record: RequestRecord }) {
  const { t } = useTranslation(ns)
  const { access } = useServices()
  const search = route.useSearch()
  const editable =
    record.status === 'draft' &&
    access.decide(permissions.edit, record).status === 'allowed'
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground data-[state=open]:bg-accent"
          aria-label={`${t('rowActions')}: ${record.title}`}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link
            to="/requests/$requestId"
            params={{ requestId: record.id }}
            search={search}
          >
            <Eye />
            {t('open')}
          </Link>
        </DropdownMenuItem>
        {editable && (
          <DropdownMenuItem asChild>
            <Link
              to="/requests/$requestId/edit"
              params={{ requestId: record.id }}
              search={search}
            >
              <Pencil />
              {t('edit')}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            void navigator.clipboard
              ?.writeText(record.reference)
              .then(() => toast.success(t('referenceCopied')))
          }
        >
          <Copy />
          {t('copyReference')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Reads search itself so column definitions never depend on URL state. */
function TitleCell({ record }: { record: RequestRecord }) {
  const search = route.useSearch()
  return (
    <Link
      to="/requests/$requestId"
      params={{ requestId: record.id }}
      search={search}
      className="group/title flex w-[11rem] flex-col gap-0.5 rounded-sm outline-none sm:w-auto sm:max-w-[16rem] sm:min-w-[11rem] 2xl:max-w-[22rem]"
    >
      <span
        dir="auto"
        className="truncate font-medium group-hover/title:underline group-focus-visible/title:underline"
      >
        {record.title}
      </span>
      {/* Reference and description keep their own direction; only the text truncates. */}
      <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
        <span dir="ltr" className="shrink-0 font-medium tabular-nums">
          {record.reference}
        </span>
        <span aria-hidden="true">·</span>
        <span dir="auto" className="min-w-0 truncate">
          {record.description}
        </span>
      </span>
    </Link>
  )
}
