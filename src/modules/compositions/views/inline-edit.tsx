import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, Pencil, X } from 'lucide-react'
import { money, normalizeNumber } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { ns } from '../messages'

type Key =
  'displayName' | 'email' | 'phone' | 'paymentTerms' | 'creditLimit' | 'notes'
type Record_ = Record<Key, string>
const terms = ['net30', 'net45', 'net60'] as const
const initial: Record_ = {
  displayName: 'Northwind Traders',
  email: 'accounts@northwind.example',
  phone: '+966 11 555 0142',
  paymentTerms: 'net45',
  creditLimit: '250000.00',
  notes: '',
}
const fields: {
  key: Key
  kind: 'text' | 'email' | 'tel' | 'terms' | 'money' | 'long'
  ltr?: boolean
}[] = [
  { key: 'displayName', kind: 'text' },
  { key: 'email', kind: 'email', ltr: true },
  { key: 'phone', kind: 'tel', ltr: true },
  { key: 'paymentTerms', kind: 'terms' },
  { key: 'creditLimit', kind: 'money', ltr: true },
  { key: 'notes', kind: 'long' },
]
function validate(key: Key, value: string) {
  if (key === 'displayName')
    return value.trim().length >= 2 ? undefined : 'requiredError'
  if (key === 'email')
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : 'emailError'
  if (key === 'creditLimit')
    return /^\d+(\.\d{1,2})?$/.test(normalizeNumber(value))
      ? undefined
      : 'amountError'
  return undefined
}

export default function InlineEdit() {
  const { t } = useTranslation(ns)
  const [record, setRecord] = useState(initial)
  // One field at a time keeps focus and intent obvious.
  const [editing, setEditing] = useState<Key | null>(null)
  const display = (key: Key, value: string) => {
    if (!value)
      return (
        <span className="text-muted-foreground italic">{t('emptyValue')}</span>
      )
    if (key === 'paymentTerms') return t(value)
    if (key === 'creditLimit')
      return (
        <bdi>{money(Math.round(Number(normalizeNumber(value)) * 100))}</bdi>
      )
    return value
  }
  return (
    <Card className="max-w-2xl overflow-hidden pb-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {record.displayName}
          <Badge
            variant="secondary"
            className="rounded-full border-0 bg-success/12 text-success"
          >
            {t('active')}
          </Badge>
        </CardTitle>
        <CardDescription>
          <span dir="ltr">SUP-0318</span> · {t('inlineEditNote')}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <dl className="divide-y border-t">
          {fields.map((field) => (
            <Row
              key={field.key}
              field={field}
              label={t(field.key)}
              value={record[field.key]}
              display={display(field.key, record[field.key])}
              editing={editing === field.key}
              onEdit={() => setEditing(field.key)}
              onCancel={() => setEditing(null)}
              onSave={(value) => {
                const before = record[field.key]
                setRecord((current) => ({ ...current, [field.key]: value }))
                setEditing(null)
                if (value !== before)
                  toast.success(t('fieldSaved', { field: t(field.key) }), {
                    action: {
                      label: t('undo'),
                      onClick: () =>
                        setRecord((current) => ({
                          ...current,
                          [field.key]: before,
                        })),
                    },
                  })
              }}
            />
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

function Row({
  field,
  label,
  value,
  display,
  editing,
  onEdit,
  onCancel,
  onSave,
}: {
  field: (typeof fields)[number]
  label: string
  value: string
  display: React.ReactNode
  editing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (value: string) => void
}) {
  const { t } = useTranslation(ns)
  const id = useId()
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState<string>()
  const editButton = useRef<HTMLButtonElement>(null)
  const wasEditing = useRef(false)
  useEffect(() => {
    // Return focus to the field's edit button when editing ends.
    if (wasEditing.current && !editing) editButton.current?.focus()
    wasEditing.current = editing
  }, [editing])
  const commit = () => {
    const problem = validate(field.key, draft)
    setError(problem)
    if (!problem)
      onSave(
        field.kind === 'money'
          ? Number(normalizeNumber(draft)).toFixed(2)
          : draft.trim(),
      )
  }
  const cancel = () => {
    setDraft(value)
    setError(undefined)
    onCancel()
  }
  const keys = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      cancel()
    }
    if (
      event.key === 'Enter' &&
      (field.kind !== 'long' || event.metaKey || event.ctrlKey)
    ) {
      event.preventDefault()
      commit()
    }
  }
  return (
    <div
      className={cn(
        'group grid gap-1 px-5 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-start sm:gap-4 2xl:px-6',
        editing && 'bg-muted/40',
      )}
    >
      <dt id={id} className="pt-1.5 text-sm text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0">
        {editing ? (
          <div className="grid gap-2" onKeyDown={keys}>
            {field.kind === 'terms' ? (
              <Select value={draft} onValueChange={setDraft}>
                <SelectTrigger
                  aria-labelledby={id}
                  className="w-full sm:w-56"
                  autoFocus
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term} value={term}>
                      {t(term)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.kind === 'long' ? (
              <Textarea
                autoFocus
                aria-labelledby={id}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
              />
            ) : (
              <Input
                autoFocus
                aria-labelledby={id}
                aria-invalid={!!error}
                type={field.kind === 'money' ? 'text' : field.kind}
                inputMode={field.kind === 'money' ? 'decimal' : undefined}
                dir={field.ltr ? 'ltr' : undefined}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onFocus={(event) => event.target.select()}
              />
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {t(error)}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={commit}>
                <Check data-icon="inline-start" />
                {t('saveField')}
              </Button>
              <Button size="sm" variant="ghost" onClick={cancel}>
                <X data-icon="inline-start" />
                {t('cancel')}
              </Button>
              <span className="ms-auto hidden text-xs text-muted-foreground sm:inline">
                {field.kind === 'long' ? t('saveHintLong') : t('saveHint')}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex min-h-8 items-start gap-2">
            <span
              className={cn(
                'min-w-0 flex-1 pt-1.5 text-sm break-words',
                field.kind === 'long' && 'whitespace-pre-line',
              )}
            >
              <span dir={field.ltr ? 'ltr' : undefined}>{display}</span>
            </span>
            <Button
              ref={editButton}
              size="icon"
              variant="ghost"
              className="size-8 text-muted-foreground opacity-100 transition-opacity focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              onClick={() => {
                setDraft(value)
                onEdit()
              }}
              aria-label={t('editField', { field: label })}
            >
              <Pencil />
            </Button>
          </div>
        )}
      </dd>
    </div>
  )
}
