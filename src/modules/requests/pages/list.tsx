import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { useServices } from '@/shared/api/services'
import { AccessBoundary } from '@/shared/auth/access'
import { useCapability } from '@/shared/capabilities/hooks'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select'
import { Badge } from '@/shared/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/shared/ui/empty'
import { LoadingState } from '@/shared/ui/loading-state'
import { Failure } from '@/shared/ui/route-feedback'
import { Skeleton } from '@/shared/ui/skeleton'
import { money, date } from '@/shared/lib/format'
import { permissions } from '../permissions'
import {
  requestSearch,
  PAGE_SIZE,
  type RequestRecord,
  type RequestSearch,
} from '../schema'
import { listOptions } from '../queries'

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
  const { t } = useTranslation()
  const services = useServices(),
    navigate = useNavigate()
  const rawSearch = useSearch({ strict: false })
  const search = useMemo(() => requestSearch.parse(rawSearch), [rawSearch])
  const [filterReset, setFilterReset] = useState(0)
  const create = useCapability({
    action: permissions.create,
    quota: 'requests.create',
  })
  const query = useQuery({
    ...listOptions(services.api, services.session.workspace.id, search),
    placeholderData: keepPreviousData,
  })
  const columns = useMemo<ColumnDef<RequestRecord>[]>(
    () => [
      {
        accessorKey: 'title',
        header: t('title'),
        cell: ({ row }) => (
          <Link
            className="record-link"
            to="/requests/$requestId"
            params={{ requestId: row.original.id }}
            search={search}
          >
            <strong dir="auto">{row.original.title}</strong>
            <span dir="auto">{row.original.description}</span>
          </Link>
        ),
      },
      {
        accessorKey: 'ownerName',
        header: t('owner'),
        cell: ({ row }) => <bdi>{row.original.ownerName}</bdi>,
      },
      {
        accessorKey: 'amountMinor',
        header: t('amount'),
        cell: ({ row }) => <bdi>{money(row.original.amountMinor)}</bdi>,
      },
      {
        accessorKey: 'status',
        header: t('status'),
        cell: ({ row }) => (
          <Badge variant="secondary" data-status={row.original.status}>
            {t(row.original.status)}
          </Badge>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: t('updated'),
        cell: ({ row }) => <bdi>{date(row.original.updatedAt)}</bdi>,
      },
    ],
    [t, search],
  )
  const table = useReactTable({
    data: query.data?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: query.data?.total ?? 0,
    state: { pagination: { pageIndex: search.page - 1, pageSize: PAGE_SIZE } },
  })
  function filter(patch: Partial<typeof search>) {
    void navigate({ to: '/requests', search: { ...search, page: 1, ...patch } })
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{t('requests')}</h1>
          <p>{t('requestSubtitle')}</p>
        </div>
        {create.status === 'allowed' ? (
          <Button asChild>
            <Link to="/requests/new" search={search}>
              <Plus data-icon="inline-start" />
              {t('newRequest')}
            </Link>
          </Button>
        ) : (
          <div>
            <Button disabled>{t('newRequest')}</Button>
            <p className="muted">{t(create.reason)}</p>
          </div>
        )}
      </div>
      <RequestFilters
        key={JSON.stringify([search.q, filterReset])}
        search={search}
        onFilter={filter}
      />
      {query.isPending ? (
        <div role="status" aria-label={t('loading')}>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : query.isError ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : query.data.total === 0 || query.data.items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('noResults')}</EmptyTitle>
            <EmptyDescription>{t('noResultsHint')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              onClick={() => {
                setFilterReset((value) => value + 1)
                filter({ q: '', status: 'all', page: 1 })
              }}
            >
              {t('resetFilters')}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="data-table" aria-busy={query.isFetching}>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {query.isFetching && !query.isPending && <LoadingState updating />}
      <footer className="list-footer">
        <p>
          {services.mode === 'demo'
            ? t('demoNote')
            : t('records', { count: query.data?.total ?? 0 })}
        </p>
        <div className="pagination">
          <Button
            variant="outline"
            disabled={search.page <= 1 || query.isFetching}
            onClick={() => filter({ page: search.page - 1 })}
          >
            {t('previous')}
          </Button>
          <span>
            {t('page', {
              page: search.page,
              pages: Math.max(
                1,
                Math.ceil((query.data?.total ?? 0) / PAGE_SIZE),
              ),
            })}
          </span>
          <Button
            variant="outline"
            disabled={!table.getCanNextPage() || query.isFetching}
            onClick={() => filter({ page: search.page + 1 })}
          >
            {t('next')}
          </Button>
        </div>
      </footer>
    </>
  )
}

function RequestFilters({
  search,
  onFilter,
}: {
  search: RequestSearch
  onFilter: (patch: Partial<RequestSearch>) => void
}) {
  const { t } = useTranslation()
  const [term, setTerm] = useState(search.q)
  return (
    <form
      className="filter-bar"
      onSubmit={(event) => {
        event.preventDefault()
        onFilter({ q: term })
      }}
    >
      <Input
        aria-label={t('searchRequests')}
        placeholder={t('searchRequests')}
        value={term}
        onChange={(event) => setTerm(event.target.value)}
      />
      <Button type="submit" variant="outline">
        {t('searchRequests')}
      </Button>
      <NativeSelect
        aria-label={t('status')}
        value={search.status}
        onChange={(event) =>
          onFilter({ status: event.target.value as typeof search.status })
        }
      >
        <NativeSelectOption value="all">{t('allStatuses')}</NativeSelectOption>
        {(['draft', 'pending', 'approved'] as const).map((status) => (
          <NativeSelectOption key={status} value={status}>
            {t(status)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label={t('sort')}
        value={search.sort}
        onChange={(event) =>
          onFilter({ sort: event.target.value as typeof search.sort })
        }
      >
        {(['updated', 'title', 'amount'] as const).map((sort) => (
          <NativeSelectOption key={sort} value={sort}>
            {t(sort)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </form>
  )
}
