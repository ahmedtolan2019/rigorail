import {
  downloadBlob,
  safeFileName,
  type ExportDocument,
  type ExportSheet,
  type ExportValue,
} from './model'

function cell(value: ExportValue) {
  if (value === null || value === undefined) return ''
  const text = value instanceof Date ? value.toISOString() : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * RFC 4180 CSV with a UTF-8 byte order mark so Excel opens Arabic correctly.
 * Values stay raw (numbers unformatted, dates ISO) so other tools can parse them.
 */
export function exportCsv<Row>(
  document: ExportDocument,
  sheet: ExportSheet<Row>,
) {
  const lines = [
    sheet.columns.map((column) => cell(column.header)).join(','),
    ...sheet.rows.map((row) =>
      sheet.columns.map((column) => cell(column.value(row))).join(','),
    ),
  ]
  downloadBlob(
    new Blob(['﻿' + lines.join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    }),
    `${safeFileName(document.fileName)}.csv`,
  )
}
