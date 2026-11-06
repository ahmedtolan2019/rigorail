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
  type RequestInput,
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

// Writes live here too, so pages never build endpoints or bodies themselves.
/** Creates a draft, or updates one with the version the user started from. */
export const saveRequest = (
  api: ApiClient,
  values: RequestInput,
  existing?: { id: string; version: number },
) =>
  api.request(
    existing ? `/requests/${encodeURIComponent(existing.id)}` : '/requests',
    requestSchema,
    {
      method: existing ? 'PATCH' : 'POST',
      body: JSON.stringify(
        existing ? { ...values, version: existing.version } : values,
      ),
    },
  )
/** Moves a record through the workflow; `version` guards against stale state. */
export const runRequestAction = (
  api: ApiClient,
  id: string,
  action: 'submit' | 'approve',
  version: number,
) =>
  api.request(`/requests/${encodeURIComponent(id)}/${action}`, requestSchema, {
    method: 'POST',
    body: JSON.stringify({ version }),
  })
/** Attaches a finished upload, or removes an attachment. */
export const attachToRequest = (api: ApiClient, id: string, uploadId: string) =>
  api.request(
    `/requests/${encodeURIComponent(id)}/attachments`,
    requestSchema,
    { method: 'POST', body: JSON.stringify({ uploadId }) },
  )
export const removeRequestAttachment = (
  api: ApiClient,
  id: string,
  attachmentId: string,
) =>
  api.request(
    `/requests/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}`,
    requestSchema,
    { method: 'DELETE' },
  )
