import { z } from 'zod'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
export const reportPresets = [
  '7d',
  '30d',
  '90d',
  'mtd',
  'qtd',
  'ytd',
  '12m',
] as const
export const reportSearch = z.object({
  /** A preset id, or 'custom' with explicit from/to. */
  preset: z.enum([...reportPresets, 'custom']).catch('90d'),
  from: isoDate.optional().catch(undefined),
  to: isoDate.optional().catch(undefined),
  compare: z.boolean().catch(true),
  category: z.array(z.string().max(32)).max(10).catch([]),
  owner: z.array(z.string().max(64)).max(20).catch([]),
  metric: z.enum(['count', 'amount']).catch('count'),
  breakdown: z.enum(['category', 'owner', 'period']).catch('category'),
})
export type ReportSearch = z.infer<typeof reportSearch>
export const defaultReportSearch = reportSearch.parse({})

const totals = z.object({
  count: z.number().int().nonnegative(),
  amountMinor: z.number().int().nonnegative(),
  approvedCount: z.number().int().nonnegative(),
  approvedAmountMinor: z.number().int().nonnegative(),
  /** Approved share of submitted requests, 0..1; null when nothing was submitted. */
  approvalRate: z.number().min(0).max(1).nullable(),
  /** Mean days from creation to approval; null when nothing was approved. */
  cycleDays: z.number().nonnegative().nullable(),
})
const breakdownRow = z.object({
  key: z.string(),
  label: z.string(),
  count: z.number().int().nonnegative(),
  draft: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  approved: z.number().int().nonnegative(),
  amountMinor: z.number().int().nonnegative(),
  approvedAmountMinor: z.number().int().nonnegative(),
})
export type BreakdownRow = z.infer<typeof breakdownRow>

/**
 * Server-side aggregates for the requests dashboard. The browser never downloads
 * raw records to compute reports. Periods are ISO dates for each bucket start;
 * `previous*` series values align by index with the comparison window.
 */
export const requestReportSchema = z.object({
  from: isoDate,
  to: isoDate,
  bucket: z.enum(['day', 'week', 'month']),
  totals,
  previous: totals.nullable(),
  series: z.array(
    z.object({
      period: z.string(),
      created: z.number().int().nonnegative(),
      approved: z.number().int().nonnegative(),
      amountMinor: z.number().int().nonnegative(),
      approvedAmountMinor: z.number().int().nonnegative(),
      previousCreated: z.number().int().nonnegative().nullable(),
      previousAmountMinor: z.number().int().nonnegative().nullable(),
    }),
  ),
  byStatus: z.record(
    z.enum(['draft', 'pending', 'approved']),
    z.number().int(),
  ),
  breakdown: z.object({
    category: z.array(breakdownRow),
    owner: z.array(breakdownRow),
  }),
  /** Filter options for the owner facet, independent of the owner filter. */
  owners: z.array(z.object({ id: z.string(), name: z.string() })),
})
export type RequestReport = z.infer<typeof requestReportSchema>
export interface ReportQuery {
  from: string
  to: string
  compare: boolean
  category: string[]
  owner: string[]
}
