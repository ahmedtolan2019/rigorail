import { useRef, useState } from 'react'
import { useFieldArray, useForm, useWatch, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Plus, Redo2, Trash2, Undo2, type LucideIcon } from 'lucide-react'
import { money, normalizeNumber } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardFooter } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Kbd } from '@/shared/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'
import { ns } from '../messages'

const decimal = z.string().regex(/^\d+(\.\d{1,2})?$/)
const schema = z.object({
  lines: z
    .array(
      z.object({
        item: z.string().trim().min(2),
        quantity: z.string().regex(/^[1-9]\d{0,4}$/),
        price: decimal,
        discount: decimal.refine((value) => Number(value) <= 100),
      }),
    )
    .min(1),
})
type Values = z.infer<typeof schema>
type Line = Values['lines'][number]
const TAX = 0.15
const blank: Line = { item: '', quantity: '1', price: '0', discount: '0' }
const lineTotal = (line: Partial<Line>) =>
  Math.round(
    Number(line.quantity || 0) *
      Number(line.price || 0) *
      100 *
      (1 - Number(line.discount || 0) / 100),
  )
const columns = ['item', 'quantity', 'price', 'discount'] as const

export default function LineItems() {
  const { t } = useTranslation(ns)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      lines: [
        { item: 'Laptop 14"', quantity: '4', price: '1180', discount: '5' },
        { item: 'USB-C dock', quantity: '4', price: '189.5', discount: '0' },
        { item: 'Monitor 27"', quantity: '2', price: '329', discount: '10' },
      ],
    },
  })
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'lines',
  })
  // Undo history of committed snapshots: a cell edit commits when the cell loses
  // focus, adding or removing a line commits immediately. Refs avoid re-rendering
  // the table on every keystroke; `version` refreshes the toolbar state.
  const history = useRef({
    past: [] as Line[][],
    future: [] as Line[][],
    committed: snapshot(form.getValues('lines')),
  })
  const [, setVersion] = useState(0)
  function commit() {
    const current = snapshot(form.getValues('lines'))
    const state = history.current
    if (JSON.stringify(current) === JSON.stringify(state.committed)) return
    state.past = [...state.past, state.committed].slice(-100)
    state.future = []
    state.committed = current
    setVersion((value) => value + 1)
  }
  function restore(lines: Line[]) {
    replace(lines)
    history.current.committed = lines
    setVersion((value) => value + 1)
  }
  function undo() {
    commit() // an edit still in progress becomes the step being undone
    const state = history.current
    const previous = state.past.at(-1)
    if (!previous) return
    state.past = state.past.slice(0, -1)
    state.future = [state.committed, ...state.future]
    restore(previous)
  }
  function redo() {
    const state = history.current
    const [next, ...rest] = state.future
    if (!next) return
    state.future = rest
    state.past = [...state.past, state.committed]
    restore(next)
  }
  const canUndo =
    history.current.past.length > 0 ||
    JSON.stringify(form.getValues('lines')) !==
      JSON.stringify(history.current.committed)
  const canRedo = history.current.future.length > 0
  const errors = form.formState.errors.lines
  // Enter moves down a column like a spreadsheet; on the last row it adds a line.
  function onKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    row: number,
    column: number,
  ) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    if (row === fields.length - 1) {
      append(blank, { focusName: `lines.${row + 1}.${columns[column]}` })
      queueMicrotask(commit)
    } else form.setFocus(`lines.${row + 1}.${columns[column]!}`)
  }
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <form
        noValidate
        onKeyDown={(event) => {
          const mod = event.metaKey || event.ctrlKey
          const key = event.key.toLowerCase()
          if (mod && key === 'z') {
            event.preventDefault()
            if (event.shiftKey) redo()
            else undo()
          } else if (event.ctrlKey && key === 'y') {
            event.preventDefault()
            redo()
          }
        }}
        onSubmit={form.handleSubmit(() => {
          toast.success(t('savedDraft'))
          form.reset(form.getValues())
        })}
      >
        <CardContent className="relative overflow-x-auto px-0">
          <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground [&_th]:h-10 [&_th]:border-b [&_th]:bg-muted [&_th]:px-3 [&_th]:font-semibold">
                <th className="w-10 ps-4 text-start">#</th>
                <th className="text-start">{t('item')}</th>
                <th className="w-20 text-end">{t('quantity')}</th>
                <th className="w-32 text-end">{t('unitPrice')}</th>
                <th className="w-24 text-end">{t('discount')} %</th>
                <th className="w-32 text-end">{t('lineTotal')}</th>
                <th className="w-12 pe-4">
                  <span className="sr-only">{t('removeLine')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, row) => (
                <tr
                  key={field.id}
                  className="group animate-in duration-200 fade-in-0"
                >
                  <td className="border-b ps-4 text-xs text-muted-foreground tabular-nums">
                    {row + 1}
                  </td>
                  {columns.map((column, index) => {
                    const invalid = Boolean(errors?.[row]?.[column])
                    return (
                      <td key={column} className="border-b px-1.5 py-1.5">
                        <Input
                          aria-label={`${t(column === 'price' ? 'unitPrice' : column)} ${row + 1}`}
                          aria-invalid={invalid}
                          dir={column === 'item' ? 'auto' : 'ltr'}
                          inputMode={column === 'item' ? 'text' : 'decimal'}
                          className={cn(
                            'h-8 border-transparent bg-transparent shadow-none hover:border-input focus-visible:bg-background dark:bg-transparent dark:focus-visible:bg-input/30',
                            column !== 'item' && 'text-end tabular-nums',
                          )}
                          onKeyDown={(event) => onKeyDown(event, row, index)}
                          {...withCommit(
                            form.register(`lines.${row}.${column}`, {
                              setValueAs:
                                column === 'item' ? undefined : normalizeNumber,
                            }),
                            commit,
                          )}
                        />
                      </td>
                    )
                  })}
                  <td className="border-b px-3 text-end font-medium tabular-nums">
                    <LineTotal control={form.control} row={row} />
                  </td>
                  <td className="border-b pe-4 text-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground opacity-60 group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
                      aria-label={`${t('removeLine')} ${row + 1}`}
                      disabled={fields.length === 1}
                      onClick={() => {
                        // Small and recoverable: remove now, offer Undo instead of a dialog.
                        remove(row)
                        queueMicrotask(commit)
                        toast(t('lineRemoved'), {
                          action: { label: t('undo'), onClick: undo },
                        })
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-2">
            <div className="flex items-center gap-1.5">
              <HistoryButton
                label={t('undo')}
                shortcut="⌘Z"
                icon={Undo2}
                disabled={!canUndo}
                onClick={undo}
              />
              <HistoryButton
                label={t('redo')}
                shortcut="⇧⌘Z"
                icon={Redo2}
                disabled={!canRedo}
                onClick={redo}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => {
                  append(blank, { focusName: `lines.${fields.length}.item` })
                  queueMicrotask(commit)
                }}
              >
                <Plus />
                {t('addLine')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t('linesHint')}</p>
            {errors && (
              <p role="alert" className="text-sm text-destructive">
                {t('lineError')}
              </p>
            )}
          </div>
          <Totals control={form.control} />
        </div>
        <CardFooter className="justify-end border-t py-3">
          <Button type="submit" disabled={!form.formState.isDirty}>
            {t('saveDraft')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

/** Subscribes to one row only, so typing re-renders the total cell, not the table. */
function LineTotal({
  control,
  row,
}: {
  control: Control<Values>
  row: number
}) {
  const line = useWatch({ control, name: `lines.${row}` })
  return <bdi>{money(lineTotal(line ?? {}))}</bdi>
}

function Totals({ control }: { control: Control<Values> }) {
  const { t } = useTranslation(ns)
  const lines = useWatch({ control, name: 'lines' }) ?? []
  const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0)
  const tax = Math.round(subtotal * TAX)
  return (
    <dl className="grid w-full max-w-xs grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-sm sm:ms-auto">
      <dt className="text-muted-foreground">{t('subtotal')}</dt>
      <dd className="text-end tabular-nums">
        <bdi>{money(subtotal)}</bdi>
      </dd>
      <dt className="text-muted-foreground">{t('tax')}</dt>
      <dd className="text-end tabular-nums">
        <bdi>{money(tax)}</bdi>
      </dd>
      <dt className="mt-1 border-t pt-2 font-semibold">{t('grandTotal')}</dt>
      <dd className="mt-1 border-t pt-2 text-end text-base font-semibold tabular-nums">
        <bdi>{money(subtotal + tax)}</bdi>
      </dd>
    </dl>
  )
}

const snapshot = (lines: Line[]) => lines.map((line) => ({ ...line }))

/** Adds a history commit to a registered field's blur handler. */
function withCommit<
  T extends { onBlur: (event: React.FocusEvent<HTMLInputElement>) => unknown },
>(field: T, commit: () => void): T {
  return {
    ...field,
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
      void field.onBlur(event)
      commit()
    },
  }
}

function HistoryButton({
  label,
  shortcut,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string
  shortcut: string
  icon: LucideIcon
  disabled: boolean
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          aria-label={label}
          aria-keyshortcuts={
            shortcut === '⌘Z' ? 'Meta+Z Control+Z' : 'Meta+Shift+Z Control+Y'
          }
          disabled={disabled}
          onClick={onClick}
        >
          <Icon className="rtl:-scale-x-100" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label} <Kbd dir="ltr">{shortcut}</Kbd>
      </TooltipContent>
    </Tooltip>
  )
}
