import { queryOptions } from '@tanstack/react-query'
import type { ApiClient } from '@/shared/api/client'
import { requestListSchema, requestSchema, type RequestSearch } from './schema'
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
      api.request(
        `/requests?${new URLSearchParams(Object.entries(search).map(([key, value]) => [key, String(value)]))}`,
        requestListSchema,
        { signal },
      ),
  })
export const detailOptions = (api: ApiClient, scope: string, id: string) =>
  queryOptions({
    queryKey: requestKeys.detail(scope, id),
    queryFn: ({ signal }) =>
      api.request(`/requests/${encodeURIComponent(id)}`, requestSchema, {
        signal,
      }),
  })
