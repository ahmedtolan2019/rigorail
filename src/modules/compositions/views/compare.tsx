import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowLeftRight, History } from 'lucide-react'
import { date, money } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { ConfirmAction } from '@/shared/ui/confirm-action'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'
import { ns } from '../messages'

interface Version {
  number: number
  author: string
  fields: Record<string, string>
  lines: string[]
}
const initialVersions: Version[] = [
  {
    number: 1,
    author: 'Lina Farouk',
    fields: {
      supplier: 'Northwind Traders',
      paymentTerms: 'net30',
      deliverTo: 'Riyadh HQ',
      amount: '1080000',
      validUntil: '2026-12-31',
    },
    lines: [
      'Barcode scanner × 10',
      'Thermal label printer × 4',
      'Label rolls (box) × 20',
    ],
  },
  {
    number: 2,
    author: 'Omar Haddad',
    fields: {
      supplier: 'Northwind Traders',
      paymentTerms: 'net45',
      deliverTo: 'Riyadh HQ',
      amount: '1204000',
      validUntil: '2026-12-31',
    },
    lines: [
      'Barcode scanner × 12',
      'Thermal label printer × 4',
      'Label rolls (box) × 30',
    ],
  },
  {
    number: 3,
    author: 'Lina Farouk',
    fields: {
      supplier: 'Northwind Traders',
      paymentTerms: 'net45',
      deliverTo: 'Jeddah Distribution Centre',
      amount: '1298500',
      validUntil: '2027-01-15',
    },
    lines: [
      'Barcode scanner × 12',
      'Thermal label printer × 4',
      'Label rolls (box) × 30',
      'Installation and training × 1',
    ],
  },
]
const fieldKeys = [
  'supplier',
  'paymentTerms',
  'deliverTo',
  'amount',
  'validUntil',
] as const
const translated = new Set(['paymentTerms'])

export default function Compare() {
  const { t } = useTranslation(ns)
  const [versions, setVersions] = useState(initialVersions)
  const [left, setLeft] = useState(2)
  const [right, setRight] = useState(3)
  const [onlyChanges, setOnlyChanges] = useState(false)
  const before = versions.find((version) => version.number === left)!
  const after = versions.find((version) => version.number === right)!
  const show = (key: string, value: string) =>
    translated.has(key)
      ? t(value)
      : key === 'amount'
        ? money(Number(value))
        : key === 'validUntil'
          ? date(`${value}T00:00:00Z`)
          : value
  const rows = fieldKeys
    .map((key) => ({
      key,
      from: before.fields[key]!,
      to: after.fields[key]!,
      changed: before.fields[key] !== after.fields[key],
    }))
    .filter((row) => !onlyChanges || row.changed)
  const removed = before.lines.filter((line) => !after.lines.includes(line))
  const added = after.lines.filter((line) => !before.lines.includes(line))
  const kept = onlyChanges
    ? []
    : after.lines.filter((line) => before.lines.includes(line))
  const changes =
    fieldKeys.filter((key) => before.fields[key] !== after.fields[key]).length +
    removed.length +
    added.length

  const picker = (
    value: number,
    onChange: (value: number) => void,
    label: string,
  ) => (
    <Select
      value={String(value)}
      onValueChange={(next) => onChange(Number(next))}
    >
      <SelectTrigger className="w-full sm:w-56" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {versions.map((version) => (
          <SelectItem key={version.number} value={String(version.number)}>
            {t('versionLabel', { number: version.number })} · {version.author}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {picker(left, setLeft, t('before'))}
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          aria-label={t('swapVersions')}
          onClick={() => {
            setLeft(right)
            setRight(left)
          }}
        >
          <ArrowLeftRight />
        </Button>
        {picker(right, setRight, t('after'))}
        <div className="ms-auto flex items-center gap-2">
          <Switch
            id="only-changes"
            checked={onlyChanges}
            onCheckedChange={setOnlyChanges}
          />
          <Label htmlFor="only-changes" className="font-normal">
            {t('onlyChanges')}
          </Label>
        </div>
      </div>
      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex items-center gap-2 border-b px-4 py-2.5">
          <Badge variant="secondary" className="rounded-full">
            {left === right
              ? t('sameVersion')
              : t('changesCount', { count: changes })}
          </Badge>
          <ConfirmAction
            tone="warning"
            icon={History}
            title={t('restoreTitle', { number: left })}
            description={t('restoreHint', { number: left })}
            confirmLabel={t('restoreVersion', { number: left })}
            onConfirm={() => {
              const number = Math.max(...versions.map((v) => v.number)) + 1
              setVersions([
                ...versions,
                {
                  ...before,
                  number,
                  fields: { ...before.fields },
                  lines: [...before.lines],
                },
              ])
              setRight(number)
              toast.success(t('restored', { number: left }))
            }}
          >
            <Button
              size="sm"
              variant="ghost"
              className="ms-auto"
              disabled={left === right}
            >
              <History data-icon="inline-start" />
              {t('restoreVersion', { number: left })}
            </Button>
          </ConfirmAction>
        </div>
        {/* Phones put each field name above its before/after pair. */}
        <div className="grid grid-cols-2 text-sm sm:grid-cols-[minmax(6rem,10rem)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="hidden border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground sm:block">
            {t('fieldLabel')}
          </div>
          <div className="border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
            {t('before')} · {t('versionLabel', { number: left })}
          </div>
          <div className="border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
            {t('after')} · {t('versionLabel', { number: right })}
          </div>
          {rows.map((row) => (
            <div key={row.key} className="contents">
              <div className="col-span-2 px-4 pt-2.5 text-xs font-medium text-muted-foreground sm:col-span-1 sm:border-b sm:pb-2.5 sm:text-sm sm:font-normal">
                {t(row.key)}
              </div>
              <div
                className={cn(
                  'border-b px-4 py-2.5 break-words',
                  row.changed && 'bg-destructive/6',
                )}
              >
                <bdi
                  className={cn(
                    row.changed &&
                      'text-destructive line-through decoration-destructive/50',
                  )}
                >
                  {show(row.key, row.from)}
                </bdi>
              </div>
              <div
                className={cn(
                  'border-b px-4 py-2.5 break-words',
                  row.changed && 'bg-success/8',
                )}
              >
                <bdi className={cn(row.changed && 'font-medium text-success')}>
                  {show(row.key, row.to)}
                </bdi>
              </div>
            </div>
          ))}
          <div className="col-span-2 px-4 pt-2.5 text-xs font-medium text-muted-foreground sm:col-span-1 sm:pb-2.5 sm:text-sm sm:font-normal">
            {t('linesLabel')}
          </div>
          <ul className="grid content-start gap-1 px-4 py-2.5">
            {removed.map((line) => (
              <li
                key={line}
                className="rounded bg-destructive/8 px-1.5 text-destructive line-through decoration-destructive/50"
              >
                <span aria-hidden="true">- </span>
                <span className="sr-only">{t('removed')}: </span>
                {line}
              </li>
            ))}
            {kept.map((line) => (
              <li key={line} className="px-1.5 text-muted-foreground">
                {line}
              </li>
            ))}
          </ul>
          <ul className="grid content-start gap-1 px-4 py-2.5">
            {added.map((line) => (
              <li
                key={line}
                className="rounded bg-success/10 px-1.5 font-medium text-success"
              >
                <span aria-hidden="true">+ </span>
                <span className="sr-only">{t('added')}: </span>
                {line}
              </li>
            ))}
            {kept.map((line) => (
              <li key={line} className="px-1.5 text-muted-foreground">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  )
}
