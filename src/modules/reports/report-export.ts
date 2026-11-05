import type { TFunction } from 'i18next'
import { exportCsv } from '@/shared/export/csv'
import type { ExportKind } from '@/shared/export/export-menu'
import type { ExportDocument, ExportSheet } from '@/shared/export/model'
import { exportXlsx } from '@/shared/export/xlsx'
import { change } from './range'
import { breakdownRows, type Breakdown, type TableRow } from './report-data'
import type { RequestReport } from './schema'

const major = (minor: number) => minor / 100
function breakdownSheet(
  name: string,
  group: string,
  rows: TableRow[],
  t: TFunction,
): ExportSheet<TableRow> {
  return {
    name,
    rows,
    totalsLabel: t('common:total'),
    columns: [
      { header: group, value: (row) => row.label, width: 24 },
      {
        header: t('requests'),
        value: (row) => row.count,
        format: 'integer',
        total: 'sum',
      },
      {
        header: t('approved'),
        value: (row) => row.approved,
        format: 'integer',
        total: 'sum',
      },
      {
        header: t('pending'),
        value: (row) => row.pending,
        format: 'integer',
        total: 'sum',
      },
      {
        header: t('requestedAmount'),
        value: (row) => major(row.amountMinor),
        format: 'money',
        total: 'sum',
      },
      {
        header: t('approvedAmount'),
        value: (row) => major(row.approvedAmountMinor),
        format: 'money',
        total: 'sum',
      },
      {
        header: t('approvalRate'),
        value: (row) => {
          const submitted = row.count - (row.draft ?? 0)
          return submitted ? row.approved / submitted : null
        },
        format: 'percent',
      },
    ],
  }
}

/**
 * Workbook with one sheet per view: summary with period-over-period change, the
 * trend series and both breakdowns. CSV exports the breakdown currently shown.
 */
export async function exportReport({
  kind,
  report,
  breakdown,
  document,
  t,
  label,
}: {
  kind: ExportKind
  report: RequestReport
  breakdown: Breakdown
  document: ExportDocument
  t: TFunction
  label: (row: { key: string; label: string }) => string
}) {
  const group = (key: Breakdown) =>
    t(key === 'period' ? 'period' : key === 'owner' ? 'owner' : 'category')
  if (kind === 'csv') {
    exportCsv(
      document,
      breakdownSheet(
        t('breakdown'),
        group(breakdown),
        breakdownRows(report, breakdown, label),
        t,
      ),
    )
    return
  }
  type Metric = {
    label: string
    current: number | null
    previous: number | null
    format: 'integer' | 'money' | 'percent' | 'number'
  }
  const { totals, previous } = report
  const metrics: Metric[] = [
    {
      label: t('totalRequests'),
      current: totals.count,
      previous: previous?.count ?? null,
      format: 'integer',
    },
    {
      label: t('requestedAmount'),
      current: major(totals.amountMinor),
      previous: previous ? major(previous.amountMinor) : null,
      format: 'money',
    },
    {
      label: t('approvedAmount'),
      current: major(totals.approvedAmountMinor),
      previous: previous ? major(previous.approvedAmountMinor) : null,
      format: 'money',
    },
    {
      label: t('approvalRate'),
      current: totals.approvalRate,
      previous: previous?.approvalRate ?? null,
      format: 'percent',
    },
    {
      label: `${t('cycleTime')} (${t('day')})`,
      current: totals.cycleDays,
      previous: previous?.cycleDays ?? null,
      format: 'number',
    },
  ]
  // Mixed formats per row: write each value with its own format column.
  const summary: ExportSheet<Metric> = {
    name: t('summary'),
    rows: metrics,
    columns: [
      { header: t('metric'), value: (row) => row.label, width: 28 },
      {
        header: t('current'),
        value: (row) => row.current,
        format: (row) => row.format,
      },
      {
        header: t('previousPeriod'),
        value: (row) => row.previous,
        format: (row) => row.format,
      },
      {
        header: t('change'),
        value: (row) => change(row.current, row.previous),
        format: 'percent',
      },
    ],
  }
  const trend: ExportSheet<RequestReport['series'][number]> = {
    name: t('trend'),
    rows: report.series,
    totalsLabel: t('common:total'),
    columns: [
      {
        header: t('period'),
        value: (row) => new Date(`${row.period}T00:00:00`),
        format: 'date',
      },
      {
        header: t('created'),
        value: (row) => row.created,
        format: 'integer',
        total: 'sum',
      },
      {
        header: t('approved'),
        value: (row) => row.approved,
        format: 'integer',
        total: 'sum',
      },
      {
        header: t('requestedAmount'),
        value: (row) => major(row.amountMinor),
        format: 'money',
        total: 'sum',
      },
      {
        header: t('approvedAmount'),
        value: (row) => major(row.approvedAmountMinor),
        format: 'money',
        total: 'sum',
      },
      ...(report.previous
        ? ([
            {
              header: `${t('created')} · ${t('previousPeriod')}`,
              value: (row) => row.previousCreated,
              format: 'integer',
              total: 'sum',
            },
            {
              header: `${t('requestedAmount')} · ${t('previousPeriod')}`,
              value: (row) =>
                row.previousAmountMinor === null
                  ? null
                  : major(row.previousAmountMinor),
              format: 'money',
              total: 'sum',
            },
          ] satisfies ExportSheet<RequestReport['series'][number]>['columns'])
        : []),
    ],
  }
  await exportXlsx(document, [
    summary,
    trend,
    breakdownSheet(
      t('byCategoryTab'),
      group('category'),
      breakdownRows(report, 'category', label),
      t,
    ),
    breakdownSheet(
      t('byOwnerTab'),
      group('owner'),
      breakdownRows(report, 'owner', label),
      t,
    ),
  ] as ExportSheet<unknown>[])
}
