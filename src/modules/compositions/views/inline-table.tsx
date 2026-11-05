import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowRight, Undo2 } from 'lucide-react'
import { money, normalizeNumber } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { ConfirmAction } from '@/shared/ui/confirm-action'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Spinner } from '@/shared/ui/spinner'
import { Switch } from '@/shared/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { ns } from '../messages'

const categories = ['catHardware', 'catSoftware', 'catServices'] as const
type Category = (typeof categories)[number]
interface Product {
  sku: string
  name: string
  category: Category
  /** Price in minor units. */
  price: number
  stock: number
  active: boolean
}
/** Editing works on strings so partial input ("12.") is never lost. */
type Draft = Omit<Product, 'price' | 'stock'> & { price: string; stock: string }
type Field = 'price' | 'stock' | 'category' | 'active'

const saved: Product[] = [
  {
    sku: 'HW-1001',
    name: 'Barcode scanner',
    category: 'catHardware',
    price: 18_900,
    stock: 42,
    active: true,
  },
  {
    sku: 'HW-1002',
    name: 'Thermal label printer',
    category: 'catHardware',
    price: 32_500,
    stock: 8,
    active: true,
  },
  {
    sku: 'HW-1007',
    name: 'Rugged tablet',
    category: 'catHardware',
    price: 89_900,
    stock: 0,
    active: false,
  },
  {
    sku: 'SW-2010',
    name: 'Inventory licence (annual)',
    category: 'catSoftware',
    price: 120_000,
    stock: 250,
    active: true,
  },
  {
    sku: 'SW-2014',
    name: 'Analytics add-on',
    category: 'catSoftware',
    price: 45_000,
    stock: 120,
    active: true,
  },
  {
    sku: 'SV-3001',
    name: 'On-site installation',
    category: 'catServices',
    price: 60_000,
    stock: 15,
    active: true,
  },
  {
    sku: 'SV-3004',
    name: 'Extended support (1 year)',
    category: 'catServices',
    price: 24_000,
    stock: 60,
    active: false,
  },
]
const toDraft = (product: Product): Draft => ({
  ...product,
  price: (product.price / 100).toFixed(2),
  stock: String(product.stock),
})
const fromDraft = (draft: Draft): Product => ({
  ...draft,
  price: Math.round(Number(normalizeNumber(draft.price)) * 100),
  stock: Number(normalizeNumber(draft.stock)),
})
function invalid(draft: Draft, field: 'price' | 'stock') {
  const value = normalizeNumber(draft[field])
  return field === 'price'
    ? !/^\d+(\.\d{1,2})?$/.test(value) || Number(value) <= 0
    : !/^\d+$/.test(value)
}

export default function InlineTable() {
  const { t } = useTranslation(ns)
  const [base, setBase] = useState(saved)
  const [rows, setRows] = useState(() => saved.map(toDraft))
  const [saving, setSaving] = useState(false)
  const original = new Map(
    base.map((product) => [product.sku, toDraft(product)]),
  )
  const changedFields = (draft: Draft) => {
    const before = original.get(draft.sku)!
    return (['price', 'stock', 'category', 'active'] as Field[]).filter(
      (field) =>
        field === 'price' || field === 'stock'
          ? fromDraft(draft)[field] !== fromDraft(before)[field]
          : draft[field] !== before[field],
    )
  }
  const changed = rows.filter((row) => changedFields(row).length > 0)
  const errors = rows.reduce(
    (sum, row) =>
      sum + Number(invalid(row, 'price')) + Number(invalid(row, 'stock')),
    0,
  )
  const update = (sku: string, patch: Partial<Draft>) =>
    setRows((list) =>
      list.map((row) => (row.sku === sku ? { ...row, ...patch } : row)),
    )
  const revert = (sku: string) => update(sku, original.get(sku)!)

  async function save() {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    const next = rows.map(fromDraft)
    setBase(next)
    setRows(next.map(toDraft))
    setSaving(false)
    toast.success(t('savedRows', { count: changed.length }))
  }

  const describe = (field: Field, draft: Draft) =>
    field === 'price'
      ? money(fromDraft(draft).price)
      : field === 'stock'
        ? draft.stock
        : field === 'category'
          ? t(draft.category)
          : draft.active
            ? t('active')
            : t('inactive')
  const cellClass = (draft: Draft, field: Field) =>
    changedFields(draft).includes(field) && 'bg-warning/8'
  const input =
    'h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-end tabular-nums outline-none transition-colors hover:border-input focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-transparent'

  return (
    <div className="grid gap-3">
      <div className="flex min-h-9 flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {changed.length === 0 ? (
            t('noChanges')
          ) : (
            <span className="font-medium text-foreground">
              {t('changedRows', { count: changed.length })}
            </span>
          )}
          {errors > 0 && (
            <span className="ms-2 font-medium text-destructive">
              {t('invalidCells', { count: errors })}
            </span>
          )}
        </p>
        <div className="ms-auto flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" disabled={changed.length === 0}>
                {t('reviewChanges')}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <p className="border-b px-3 py-2 text-sm font-medium">
                {t('reviewChanges')}
              </p>
              <ul className="max-h-72 divide-y overflow-y-auto">
                {changed.map((row) => (
                  <li key={row.sku} className="grid gap-1 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {row.name}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6"
                        onClick={() => revert(row.sku)}
                        aria-label={t('revertRow', { name: row.name })}
                      >
                        <Undo2 className="size-3.5" />
                      </Button>
                    </div>
                    {changedFields(row).map((field) => (
                      <p
                        key={field}
                        className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
                      >
                        <span className="min-w-14">
                          {t(
                            field === 'active'
                              ? 'active'
                              : field === 'category'
                                ? 'category'
                                : field,
                          )}
                        </span>
                        <bdi className="line-through">
                          {describe(field, original.get(row.sku)!)}
                        </bdi>
                        <ArrowRight className="size-3 rtl:-scale-x-100" />
                        <bdi className="font-medium text-foreground">
                          {describe(field, row)}
                        </bdi>
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
          <ConfirmAction
            tone="destructive"
            title={t('discardRowsTitle', { count: changed.length })}
            description={t('discardRowsHint')}
            chips={changed.map((row) => row.name)}
            confirmLabel={t('discard')}
            onConfirm={() => setRows(base.map(toDraft))}
          >
            <Button
              size="sm"
              variant="outline"
              disabled={changed.length === 0 || saving}
            >
              {t('discard')}
            </Button>
          </ConfirmAction>
          <Button
            size="sm"
            disabled={changed.length === 0 || errors > 0 || saving}
            onClick={() => void save()}
          >
            {saving && <Spinner data-icon="inline-start" />}
            {t('save')}
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table className="min-w-[44rem]">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-28">{t('sku')}</TableHead>
              <TableHead>{t('product')}</TableHead>
              <TableHead className="w-44">{t('category')}</TableHead>
              <TableHead className="w-32 text-end">{t('price')}</TableHead>
              <TableHead className="w-24 text-end">{t('stock')}</TableHead>
              <TableHead className="w-20 text-center">{t('active')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const dirty = changedFields(row).length > 0
              return (
                <TableRow
                  key={row.sku}
                  data-state={dirty ? 'changed' : undefined}
                >
                  <TableCell
                    className={cn(
                      'border-s-2 border-s-transparent text-xs text-muted-foreground tabular-nums',
                      dirty && 'border-s-warning',
                    )}
                  >
                    <span dir="ltr">{row.sku}</span>
                  </TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className={cn('py-1', cellClass(row, 'category'))}>
                    <Select
                      value={row.category}
                      onValueChange={(category) =>
                        update(row.sku, { category: category as Category })
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        className="w-full border-transparent bg-transparent shadow-none hover:border-input dark:bg-transparent"
                        aria-label={`${t('category')}: ${row.name}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {t(category)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  {(['price', 'stock'] as const).map((field) => (
                    <TableCell
                      key={field}
                      className={cn('py-1', cellClass(row, field))}
                    >
                      <input
                        inputMode={field === 'price' ? 'decimal' : 'numeric'}
                        dir="ltr"
                        value={row[field]}
                        aria-label={`${t(field)}: ${row.name}`}
                        aria-invalid={invalid(row, field) || undefined}
                        onChange={(event) =>
                          update(row.sku, { [field]: event.target.value })
                        }
                        onFocus={(event) => event.target.select()}
                        className={input}
                      />
                    </TableCell>
                  ))}
                  <TableCell
                    className={cn('py-1 text-center', cellClass(row, 'active'))}
                  >
                    <Switch
                      checked={row.active}
                      onCheckedChange={(active) => update(row.sku, { active })}
                      aria-label={`${t('active')}: ${row.name}`}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{t('inlineTableNote')}</p>
    </div>
  )
}
