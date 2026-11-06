import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ArrowRight,
  Check,
  CircleAlert,
  FileSpreadsheet,
  Upload,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { ConfirmAction } from '@/shared/ui/confirm-action'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'
import { Label } from '@/shared/ui/label'
import { ns } from '../messages'
import { registerCopy } from '../example-utils'

registerCopy({
  imFileReplaced: [
    '{{name}} selected. This example keeps the sample rows; a real import re-reads the file.',
    'تم اختيار {{name}}. يحتفظ هذا المثال بالصفوف التجريبية، والاستيراد الفعلي يعيد قراءة الملف.',
  ],
})

const targets = [
  'supplierName',
  'taxNumber',
  'email',
  'paymentTerms',
  'country',
] as const
type Target = (typeof targets)[number]
const required = new Set<Target>(['supplierName', 'taxNumber', 'paymentTerms'])
const columns = [
  'Vendor',
  'VAT No.',
  'Contact e-mail',
  'Terms (days)',
  'Region',
  'Internal note',
]
// Header names map to fields when they match a known alias; the rest need a person.
const auto: Record<string, Target> = {
  Vendor: 'supplierName',
  'VAT No.': 'taxNumber',
  'Contact e-mail': 'email',
}
const rows = [
  [
    'Northwind Traders',
    '300012345600003',
    'ap@northwind.example',
    '45',
    'SA',
    'Key account',
  ],
  ['Contoso Office', '300098765400003', 'billing@contoso', '30', 'AE', ''],
  [
    'Fabrikam Industrial',
    '3000555',
    'finance@fabrikam.example',
    '60',
    'SA',
    'Check VAT',
  ],
  [
    'Adatum Software',
    '300044455500003',
    'ar@adatum.example',
    'net 45',
    'SA',
    '',
  ],
  [
    'Litware Logistics',
    '300077788800003',
    'accounts@litware.example',
    '30',
    'BH',
    '',
  ],
]
const TOTAL_ROWS = 248
const validators: Record<Target, (value: string) => boolean> = {
  supplierName: (value) => value.trim().length >= 2,
  taxNumber: (value) => /^\d{15}$/.test(value),
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  paymentTerms: (value) => /^\d+$/.test(value),
  country: (value) => /^[A-Z]{2}$/.test(value),
}

export default function ImportMapping() {
  const { t } = useTranslation(ns)
  const picker = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('suppliers-2026-q4.csv')
  const [mapping, setMapping] = useState<Record<string, Target | 'skip' | ''>>(
    () =>
      Object.fromEntries(columns.map((column) => [column, auto[column] ?? ''])),
  )
  const [skipInvalid, setSkipInvalid] = useState(true)
  const used = new Set(Object.values(mapping))
  const missing = [...required].filter((target) => !used.has(target))
  const unmapped = columns.filter((column) => mapping[column] === '')
  const invalidCell = (row: string[], index: number) => {
    const target = mapping[columns[index]!]
    return !!target && target !== 'skip' && !validators[target](row[index]!)
  }
  const invalidRows = rows.filter((row) =>
    row.some((_, index) => invalidCell(row, index)),
  ).length
  // The preview shows 5 rows; scale the error rate to the file for the summary.
  const estimatedInvalid = Math.round((invalidRows / rows.length) * TOTAL_ROWS)
  const ready = missing.length === 0 && unmapped.length === 0
  const importCount = skipInvalid ? TOTAL_ROWS - estimatedInvalid : TOTAL_ROWS

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:gap-4">
      <Card className="flex-row items-center gap-3 px-5 py-3.5">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-success/12 text-success"
        >
          <FileSpreadsheet className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p dir="ltr" className="truncate text-start text-sm font-medium">
            {fileName}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('fileSummary', { rows: TOTAL_ROWS, columns: columns.length })}
          </p>
        </div>
        <input
          ref={picker}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            setFileName(file.name)
            toast(t('imFileReplaced', { name: file.name }))
            event.target.value = ''
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => picker.current?.click()}
        >
          <Upload data-icon="inline-start" />
          {t('replaceFile')}
        </Button>
      </Card>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 xl:grid-cols-[minmax(0,1fr)_17rem] lg:gap-4">
        <Card className="min-w-0 gap-0 overflow-hidden py-0">
          <div className="border-b px-5 py-3.5">
            <h3 className="text-sm font-semibold">{t('mapColumns')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('mapColumnsHint')}
            </p>
          </div>
          <ul className="divide-y">
            {columns.map((column, index) => {
              const value = mapping[column]
              return (
                <li
                  key={column}
                  className="grid items-center gap-2 px-5 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto_14rem] sm:gap-4"
                >
                  <div className="min-w-0">
                    <p
                      dir="ltr"
                      className="truncate text-start text-sm font-medium"
                    >
                      {column}
                    </p>
                    <p
                      dir="ltr"
                      className="truncate text-start text-xs text-muted-foreground"
                    >
                      {rows
                        .slice(0, 3)
                        .map((row) => row[index] || '-')
                        .join(', ')}
                    </p>
                  </div>
                  <ArrowRight
                    aria-hidden="true"
                    className="hidden size-4 text-muted-foreground sm:block rtl:-scale-x-100"
                  />
                  <div className="flex items-center gap-2">
                    <Select
                      value={value || undefined}
                      onValueChange={(next) =>
                        setMapping((current) => ({
                          ...current,
                          [column]: next as Target | 'skip',
                        }))
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        className={cn(
                          'w-full',
                          value === '' && 'border-warning',
                        )}
                        aria-label={t('mapTo', { column })}
                      >
                        <SelectValue placeholder={t('chooseField')} />
                      </SelectTrigger>
                      <SelectContent>
                        {targets.map((target) => (
                          <SelectItem
                            key={target}
                            value={target}
                            disabled={used.has(target) && value !== target}
                          >
                            {t(target)}
                            {required.has(target) && (
                              <span className="text-muted-foreground"> *</span>
                            )}
                          </SelectItem>
                        ))}
                        <SelectSeparator />
                        <SelectItem value="skip">{t('skipColumn')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {auto[column] && value === auto[column] && (
                      <Badge
                        variant="secondary"
                        className="shrink-0 rounded-full border-0 bg-info/12 text-info"
                      >
                        {t('autoMatched')}
                      </Badge>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
        <Card className="gap-4 px-5 py-4 xl:self-start">
          <h3 className="text-sm font-semibold">{t('requiredFields')}</h3>
          <ul className="grid gap-2 text-sm">
            {targets.map((target) => {
              const done = used.has(target)
              return (
                <li key={target} className="flex items-center gap-2">
                  <span
                    className={cn(
                      'grid size-4.5 place-items-center rounded-full border',
                      done
                        ? 'border-success bg-success text-white'
                        : 'text-transparent',
                    )}
                  >
                    <Check className="size-3" />
                  </span>
                  <span
                    className={cn(
                      !done && required.has(target) && 'font-medium',
                    )}
                  >
                    {t(target)}
                  </span>
                  {required.has(target) && !done && (
                    <span className="ms-auto text-xs text-warning">
                      {t('requiredLabel')}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
          <div className="flex items-start gap-2 border-t pt-4">
            <Switch
              id="skip-invalid"
              checked={skipInvalid}
              onCheckedChange={setSkipInvalid}
            />
            <Label htmlFor="skip-invalid" className="grid gap-0.5 font-normal">
              <span className="font-medium">{t('skipInvalid')}</span>
              <span className="text-xs text-muted-foreground">
                {t('skipInvalidHint')}
              </span>
            </Label>
          </div>
          <ConfirmAction
            tone="default"
            icon={Upload}
            title={t('importTitle', { count: importCount })}
            description={t('importHint')}
            details={[
              [t('rowsToImport'), String(importCount)],
              [
                t('rowsWithErrors'),
                skipInvalid
                  ? t('skippedCount', { count: estimatedInvalid })
                  : String(estimatedInvalid),
              ],
            ]}
            confirmLabel={t('importRows', { count: importCount })}
            onConfirm={() =>
              toast.success(t('importStarted', { count: importCount }))
            }
          >
            <Button disabled={!ready || (!skipInvalid && estimatedInvalid > 0)}>
              {t('importRows', { count: importCount })}
            </Button>
          </ConfirmAction>
          {!ready && (
            <p className="-mt-2 text-xs text-muted-foreground">
              {missing.length > 0
                ? t('mapRequiredFirst')
                : t('mapEveryColumn', { count: unmapped.length })}
            </p>
          )}
        </Card>
      </div>
      <Card className="min-w-0 gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap items-center gap-2 border-b px-5 py-3">
          <h3 className="text-sm font-semibold">
            {t('previewRows', { count: rows.length })}
          </h3>
          {invalidRows > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-destructive">
              <CircleAlert className="size-3.5" />
              {t('previewErrors', { count: invalidRows })}
            </span>
          )}
        </div>
        {/* Focusable so keyboard users can scroll the wide preview. */}
        <div
          className="overflow-x-auto rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          tabIndex={0}
          role="region"
          aria-label={t('import-mapping')}
        >
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                {columns.map((column) =>
                  mapping[column] === 'skip' ? null : (
                    <th
                      key={column}
                      className="px-4 py-2 text-start font-medium"
                    >
                      {mapping[column] ? (
                        t(mapping[column])
                      ) : (
                        <span dir="ltr">{column}</span>
                      )}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, index) =>
                    mapping[columns[index]!] === 'skip' ? null : (
                      <td
                        key={index}
                        dir="ltr"
                        className={cn(
                          'px-4 py-2 text-start whitespace-nowrap',
                          invalidCell(row, index) &&
                            'bg-destructive/8 text-destructive underline decoration-destructive/40 decoration-wavy',
                        )}
                      >
                        {cell || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
