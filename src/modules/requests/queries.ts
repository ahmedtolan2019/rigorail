import { queryOptions } from '@tanstack/react-query'
import type { ApiClient } from '@/shared/api/client'
import {
  bulkResult,
  ownerSearchSchema,
  requestExportSchema,
  requestListSchema,
  requestSchema,
  toRequestQuery,
  type BulkCommand,
  type RequestFilter,
  type RequestSearch,
} from './schema'
export const requestKeys = {
  all: (scope: string) => ['requests', scope] as const,
  list: (scope: string, search: RequestSearch) =>
    ['requests', scope, 'list', search] as const,
  detail: (scope: string, id: string) =>
    ['requests', scope, 'detail', id] as const,
}
export const listOptions = (
  api: ApiClient,
  scope: string,
  search: RequestSearch,
) =>
  queryOptions({
    queryKey: requestKeys.list(scope, search),
    queryFn: ({ signal }) =>
      api.request(`/requests?${toRequestQuery(search)}`, requestListSchema, {
        signal,
      }),
  })
export const detailOptions = (api: ApiClient, scope: string, id: string) =>
  queryOptions({
    queryKey: requestKeys.detail(scope, id),
    queryFn: ({ signal }) =>
      api.request(`/requests/${encodeURIComponent(id)}`, requestSchema, {
        signal,
      }),
  })
export const runBulkCommand = (api: ApiClient, command: BulkCommand) =>
  api.request('/requests/bulk', bulkResult, {
    method: 'POST',
    body: JSON.stringify(command),
  })
/** All records matching a filter (up to EXPORT_LIMIT), sorted like the list. */
export const fetchExport = (
  api: ApiClient,
  search: RequestFilter & Pick<RequestSearch, 'sort' | 'dir'>,
) =>
  api.request(
    `/requests/export?${toRequestQuery(search)}`,
    requestExportSchema,
    {
      timeoutMs: 60_000,
    },
  )
/** Server-side owner search for the filter panel; counts respect the other filters. */
export const searchOwners = (
  api: ApiClient,
  filter: RequestFilter,
  name: string,
  signal: AbortSignal,
) =>
  api
    .request(
      `/requests/owners?${toRequestQuery({ ...filter, owner: [] })}&name=${encodeURIComponent(name)}`,
      ownerSearchSchema,
      { signal },
    )
    .then(({ items }) =>
      items.map((item) => ({
        value: item.id,
        label: item.name,
        count: item.count,
      })),
    )
