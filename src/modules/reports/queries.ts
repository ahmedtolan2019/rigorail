import { queryOptions } from '@tanstack/react-query'
import type { ApiClient } from '@/shared/api/client'
import { requestReportSchema, type ReportQuery } from './schema'

export const reportOptions = (
  api: ApiClient,
  scope: string,
  query: ReportQuery,
) =>
  queryOptions({
    queryKey: ['reports', scope, 'requests', query],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        from: query.from,
        to: query.to,
        compare: String(query.compare),
      })
      for (const value of query.category) params.append('category', value)
      for (const value of query.owner) params.append('owner', value)
      return api.request(`/reports/requests?${params}`, requestReportSchema, {
        signal,
      })
    },
  })
