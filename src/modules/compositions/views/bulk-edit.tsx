import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Layers, RotateCcw } from 'lucide-react'
import { money } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import { ConfirmAction } from '@/shared/ui/confirm-action'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { ns } from '../messages'

const fields = {
  owner: [
    'Alex Morgan',
    'Chen Wei',
    'Lina Farouk',
    'Omar Haddad',
    'Priya Nair',
    'Sam Taylor',
  ],
  priority: ['low', 'normal', 'high'],
  costCentre: ['Operations', 'Finance', 'Engineering'],
} as const
type Field = keyof typeof fields
type Row = { ref: string; title: string; amount: number } & {
  [K in Field]: string
}
const initial: Row[] = [
  {
    ref: 'REQ-1239',
    title: 'Site safety supplies',
    amount: 112_000,
    owner: 'Alex Morgan',
    priority: 'high',
    costCentre: 'Operations',
  },
  {
    ref: 'REQ-1230',
    title: 'Printer supplies',
    amount: 200_050,
    owner: 'Lina Farouk',
    priority: 'normal',
    costCentre: 'Operations',
  },
  {
    ref: 'REQ-1212',
    title: 'Analytics renewal',
    amount: 1_850_000,
    owner: 'Priya Nair',
    priority: 'high',
    costCentre: 'Engineering',
  },
  {
    ref: 'REQ-1198',
    title: 'Leadership workshop',
    amount: 640_000,
    owner: 'Omar Haddad',
    priority: 'normal',
    costCentre: 'Operations',
  },
  {
    ref: 'REQ-1187',
    title: 'Warehouse scanners',
    amount: 920_000,
    owner: 'Lina Farouk',
    priority: 'normal',
    costCentre: 'Operations',
  },
  {
    ref: 'REQ-1176',
    title: 'Fleet tyre replacement',
    amount: 384_000,
    owner: 'Chen Wei',
    priority: 'low',
    costCentre: 'Operations',
  },
]
const labelKey: Record<Field, string> = {
  owner: 'ownerLabel',
  priority: 'priority',
  costCentre: 'costCentre',
}

export default function BulkEdit() {
  const { t } = useTranslation(ns)
  const [rows, setRows] = useState(initial)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initial.slice(0, 4).map((row) => row.ref)),
  )
  // Only fields the person touches are applied; untouched fields keep each record's value.
  const [edits, setEdits] = useState<Partial<Record<Field, string>>>({})
  const picked = rows.filter((row) => selected.has(row.ref))
  const valuesOf = (field: Field) => [
    ...new Set(picked.map((row) => row[field])),
  ]
  const show = (field: Field, value: string) =>
    field === 'priority' ? t(value) : value
  // Count records each edit really changes, so the summary never overstates impact.
  const impact = (Object.keys(edits) as Field[]).map((field) => ({
    field,
    value: edits[field]!,
    changes: picked.filter((row) => row[field] !== edits[field]).length,
  }))
  const changing = impact.filter((entry) => entry.changes > 0)
  // Records that at least one edit really changes; the rest are left untouched.
  const affected = picked.filter((row) =>
    changing.some((entry) => row[entry.field] !== entry.value),
  )
  const apply = () => {
    const before = rows
    const refs = new Set(affected.map((row) => row.ref))
    setRows((list) =>
      list.map((row) => (refs.has(row.ref) ? { ...row, ...edits } : row)),
    )
    setEdits({})
    toast.success(t('bulkApplied', { count: affected.length }), {
      action: { label: t('undo'), onClick: () => setRows(before) },
    })
  }
  const allSelected = selected.size === rows.length

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-4">
      <Card className="min-w-0 gap-0 overflow-hidden py-0">
        <div className="flex items-center gap-3 border-b px-4 py-2.5">
          <Checkbox
            checked={
              allSelected ? true : selected.size > 0 ? 'indeterminate' : false
            }
            onCheckedChange={(on) =>
              setSelected(on ? new Set(rows.map((row) => row.ref)) : new Set())
            }
            aria-label={t('selectAllRecords')}
          />
          <span className="text-sm font-medium">
            {t('selectedCount', { count: selected.size })}
          </span>
        </div>
        <ul className="divide-y">
          {rows.map((row) => {
            const on = selected.has(row.ref)
            return (
              <li key={row.ref}>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40',
                    on && 'bg-primary/5 hover:bg-primary/5',
                  )}
                >
                  <Checkbox
                    checked={on}
                    onCheckedChange={(next) =>
                      setSelected((current) => {
                        const set = new Set(current)
                        if (next) set.add(row.ref)
                        else set.delete(row.ref)
                        return set
                      })
                    }
                  />
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate text-sm font-medium">
                      {row.title}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      <span dir="ltr">{row.ref}</span> · {row.owner} ·{' '}
                      {row.costCentre}
                    </span>
                  </span>
                  <Badge
                    variant="secondary"
                    className="hidden rounded-full sm:inline-flex"
                  >
                    {t(row.priority)}
                  </Badge>
                  <bdi className="w-24 text-end text-sm tabular-nums">
                    {money(row.amount)}
                  </bdi>
                </label>
              </li>
            )
          })}
        </ul>
      </Card>
      <Card className="gap-4 px-5 py-4 lg:sticky lg:top-20 lg:self-start">
        <div className="flex items-center gap-2">
          <Layers aria-hidden="true" className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">
            {t('editRecords', { count: picked.length })}
          </h3>
        </div>
        {picked.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
            {t('selectToEdit')}
          </p>
        ) : (
          <>
            {(Object.keys(fields) as Field[]).map((field) => {
              const values = valuesOf(field)
              const mixed = values.length > 1
              const edited = edits[field] !== undefined
              return (
                <div key={field} className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <label id={`bulk-${field}`} className="text-sm font-medium">
                      {t(labelKey[field])}
                    </label>
                    {edited && (
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          setEdits((current) => {
                            const next = { ...current }
                            delete next[field]
                            return next
                          })
                        }
                      >
                        <RotateCcw className="size-3" />
                        {t('keepCurrent')}
                      </button>
                    )}
                  </div>
                  <Select
                    value={edits[field] ?? (mixed ? '' : values[0])}
                    onValueChange={(value) =>
                      setEdits((current) => ({ ...current, [field]: value }))
                    }
                  >
                    <SelectTrigger
                      aria-labelledby={`bulk-${field}`}
                      className={cn(
                        'w-full',
                        edited && 'border-primary ring-3 ring-primary/15',
                      )}
                    >
                      <SelectValue
                        placeholder={t('mixedValues', { count: values.length })}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {fields[field].map((value) => (
                        <SelectItem key={value} value={value}>
                          {show(field, value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mixed && !edited && (
                    <p className="text-xs text-muted-foreground">
                      {values.map((value) => show(field, value)).join(', ')}
                    </p>
                  )}
                </div>
              )
            })}
            <div className="grid gap-1 rounded-lg border bg-muted/40 px-3 py-2.5 text-xs">
              {changing.length === 0 ? (
                <p className="text-muted-foreground">{t('noFieldChanges')}</p>
              ) : (
                changing.map((entry) => (
                  <p key={entry.field}>
                    {t('willChange', {
                      field: t(labelKey[entry.field]),
                      value: show(entry.field, entry.value),
                      count: entry.changes,
                    })}
                  </p>
                ))
              )}
            </div>
            <ConfirmAction
              tone="warning"
              title={t('bulkEditTitle', { count: affected.length })}
              description={t('bulkEditHint')}
              chips={affected.map((row) => row.ref)}
              details={changing.map((entry) => [
                t(labelKey[entry.field]),
                show(entry.field, entry.value),
              ])}
              confirmLabel={t('applyTo', { count: affected.length })}
              onConfirm={apply}
            >
              <Button disabled={changing.length === 0}>
                {t('applyTo', { count: affected.length })}
              </Button>
            </ConfirmAction>
          </>
        )}
      </Card>
    </div>
  )
}
