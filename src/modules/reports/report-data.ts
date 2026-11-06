import type { RequestReport, ReportSearch } from './schema'

export interface TableRow {
  key: string
  label: string
  count: number
  approved: number
  pending: number | null
  draft: number | null
  amountMinor: number
  approvedAmountMinor: number
}
export type Breakdown = ReportSearch['breakdown']

/** Rows for each breakdown, shared by the table and the export. */
export function breakdownRows(
  report: RequestReport,
  breakdown: Breakdown,
  label: (row: { key: string; label: string }) => string,
): TableRow[] {
  if (breakdown === 'period')
    return report.series.map((item) => ({
      key: item.period,
      label: label({ key: item.period, label: item.period }),
      count: item.created,
      approved: item.approved,
      pending: null,
      draft: null,
      amountMinor: item.amountMinor,
      approvedAmountMinor: item.approvedAmountMinor,
    }))
  // Groups without records add noise; empty periods stay because zero is a value.
  return report.breakdown[breakdown]
    .filter((row) => row.count > 0)
    .map((row) => ({
      ...row,
      label: label(row),
    }))
}
