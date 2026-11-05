import { fromIsoDate, presetRanges, toIsoDate } from '@/shared/lib/date-range'
import type { ReportQuery, ReportSearch } from './schema'

/** Resolves presets to concrete dates; only these fields affect the server query. */
export function resolveReportQuery(search: ReportSearch): ReportQuery {
  const fallback = presetRanges['90d']()
  const range =
    search.preset === 'custom'
      ? {
          from: fromIsoDate(search.from) ?? fallback.from,
          to: fromIsoDate(search.to) ?? fallback.to,
        }
      : presetRanges[search.preset]()
  return {
    from: toIsoDate(range.from),
    to: toIsoDate(range.to),
    compare: search.compare,
    category: search.category,
    owner: search.owner,
  }
}

/** Relative change; null when either side is missing or the base is zero. */
export function change(current: number | null, previous: number | null) {
  return current === null || previous === null || previous === 0
    ? null
    : (current - previous) / previous
}
