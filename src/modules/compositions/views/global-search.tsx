import { useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ClipboardList,
  CornerDownLeft,
  FileText,
  History,
  PackageCheck,
  ReceiptText,
  Search,
  X,
  type LucideIcon,
} from 'lucide-react'
import { money } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Illustration } from '@/shared/ui/illustration'
import { Kbd } from '@/shared/ui/kbd'
import { Label } from '@/shared/ui/label'
import { Switch } from '@/shared/ui/switch'
import { ns } from '../messages'
import { registerCopy } from '../example-utils'

registerCopy({
  gsPlaceholder: [
    'Search records, people and documents',
    'ابحث في السجلات والأشخاص والمستندات',
  ],
  gsAll: ['All', 'الكل'],
  gsRecords: ['Records', 'السجلات'],
  gsPeople: ['People', 'الأشخاص'],
  gsDocuments: ['Documents', 'المستندات'],
  gsMine: ['Only mine', 'الخاصة بي فقط'],
  gsResults: ['Search results', 'نتائج البحث'],
  gsCount_one: [
    '{{count}} result for "{{query}}"',
    'نتيجة واحدة لـ "{{query}}"',
  ],
  gsCount: [
    '{{count}} results for "{{query}}"',
    '{{count}} نتائج لـ "{{query}}"',
  ],
  gsRecent: ['Recent searches', 'عمليات البحث الأخيرة'],
  gsTry: [
    'Try a reference such as PO-2041, a supplier or a person.',
    'جرّب رقمًا مرجعيًا مثل PO-2041 أو موردًا أو شخصًا.',
  ],
  gsNone: ['Nothing matches "{{query}}"', 'لا شيء يطابق "{{query}}"'],
  gsNoneHint: [
    'Check the spelling, search fewer words, or include all types.',
    'تحقق من الإملاء أو ابحث بكلمات أقل أو اشمل كل الأنواع.',
  ],
  gsShowAll: ['Search all types', 'البحث في كل الأنواع'],
  gsOpening: ['Opening {{name}}.', 'جارٍ فتح {{name}}.'],
  gsNavigate: ['to move', 'للتنقل'],
  gsOpen: ['to open', 'للفتح'],
  gsClear: ['Clear search', 'مسح البحث'],
  gsClose: ['to clear', 'للمسح'],
})

type Kind = 'records' | 'people' | 'documents'
interface Hit {
  kind: Kind
  title: string
  reference: string
  detail: string
  icon?: LucideIcon
  mine?: boolean
  amount?: number
}
// Results come from a search endpoint in a product; this index stands in for it.
const index: Hit[] = [
  {
    kind: 'records',
    title: 'Northwind Traders: scanner order',
    reference: 'PO-2041',
    detail: 'Awaiting approval · Operations',
    icon: PackageCheck,
    mine: true,
    amount: 522_445,
  },
  {
    kind: 'records',
    title: 'Analytics platform renewal',
    reference: 'REQ-1212',
    detail: 'Submitted · Engineering',
    icon: ClipboardList,
    amount: 1_850_000,
  },
  {
    kind: 'records',
    title: 'Northwind Traders invoice',
    reference: 'INV-3301',
    detail: 'Overdue 2 days · Adatum Software',
    icon: ReceiptText,
    amount: 522_445,
  },
  {
    kind: 'records',
    title: 'Warehouse scanners',
    reference: 'REQ-1187',
    detail: 'Approved · Operations',
    icon: ClipboardList,
    mine: true,
    amount: 920_000,
  },
  {
    kind: 'records',
    title: 'North region safety supplies',
    reference: 'REQ-1239',
    detail: 'Draft · Operations',
    icon: ClipboardList,
    mine: true,
    amount: 112_000,
  },
  {
    kind: 'people',
    title: 'Lina Farouk',
    reference: 'lina.farouk@example.com',
    detail: 'Procurement lead · Northwind account owner',
  },
  {
    kind: 'people',
    title: 'Omar Haddad',
    reference: 'omar.haddad@example.com',
    detail: 'Head of Procurement',
  },
  {
    kind: 'people',
    title: 'Nadia Karim',
    reference: 'nadia.karim@example.com',
    detail: 'Contracts manager · North region',
  },
  {
    kind: 'documents',
    title: 'Quotation-Northwind.pdf',
    reference: 'PO-2041',
    detail: 'Attached by Lina Farouk',
    icon: FileText,
    mine: true,
  },
  {
    kind: 'documents',
    title: 'Supplier handbook (Arabic)',
    reference: 'DOC-0412',
    detail: 'Policy library',
    icon: FileText,
  },
  {
    kind: 'documents',
    title: 'Northwind framework agreement',
    reference: 'CTR-0088',
    detail: 'Contracts · expires in 4 months',
    icon: FileText,
  },
]
const kinds: Kind[] = ['records', 'people', 'documents']
const kindLabel = {
  records: 'gsRecords',
  people: 'gsPeople',
  documents: 'gsDocuments',
} as const
const recent = ['PO-2041', 'Northwind', 'Lina']

/** Wraps every case-insensitive occurrence of the query in <mark>. */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const parts = text.split(
    new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
  )
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="rounded-sm bg-warning/25 px-0.5 text-inherit"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  )
}

export default function GlobalSearch() {
  const { t } = useTranslation(ns)
  const [query, setQuery] = useState('north')
  const [kind, setKind] = useState<Kind | 'all'>('all')
  const [mine, setMine] = useState(false)
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const listId = useId()
  const term = query.trim()
  const matches = useMemo(
    () =>
      term
        ? index.filter((hit) =>
            `${hit.title} ${hit.reference} ${hit.detail}`
              .toLowerCase()
              .includes(term.toLowerCase()),
          )
        : [],
    [term],
  )
  const scoped = matches.filter(
    (hit) => (kind === 'all' || hit.kind === kind) && (!mine || hit.mine),
  )
  // Grouped order is also keyboard order.
  const ordered = kinds.flatMap((group) =>
    scoped.filter((hit) => hit.kind === group),
  )
  const current = Math.min(active, Math.max(ordered.length - 1, 0))
  const open = (hit: Hit) =>
    toast(
      t('gsOpening', {
        name: hit.reference.includes('@') ? hit.title : hit.reference,
      }),
    )
  const optionId = (position: number) => `${listId}-${position}`

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex items-center gap-2 border-b px-4">
        <Search
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
        <input
          ref={input}
          role="combobox"
          aria-expanded={ordered.length > 0}
          aria-controls={listId}
          aria-activedescendant={ordered.length ? optionId(current) : undefined}
          aria-label={t('gsPlaceholder')}
          placeholder={t('gsPlaceholder')}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown')
              setActive((value) => Math.min(value + 1, ordered.length - 1))
            else if (event.key === 'ArrowUp')
              setActive((value) => Math.max(value - 1, 0))
            else if (event.key === 'Enter' && ordered[current])
              open(ordered[current])
            else if (event.key === 'Escape') setQuery('')
            else return
            event.preventDefault()
          }}
          className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            aria-label={t('gsClear')}
            onClick={() => {
              setQuery('')
              input.current?.focus()
            }}
          >
            <X />
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-4 py-2">
        <div
          role="group"
          aria-label={t('gsResults')}
          className="flex flex-wrap gap-1"
        >
          {(['all', ...kinds] as const).map((value) => {
            const count =
              value === 'all'
                ? matches.length
                : matches.filter((hit) => hit.kind === value).length
            return (
              <button
                key={value}
                type="button"
                aria-pressed={kind === value}
                onClick={() => {
                  setKind(value)
                  setActive(0)
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  kind === value
                    ? 'border-primary bg-primary/10 text-primary hover:bg-primary/10'
                    : 'text-muted-foreground',
                )}
              >
                {t(value === 'all' ? 'gsAll' : kindLabel[value])}
                {term && (
                  <span className="tabular-nums opacity-70">{count}</span>
                )}
              </button>
            )
          })}
        </div>
        <div className="ms-auto flex items-center gap-2">
          <Switch id="search-mine" checked={mine} onCheckedChange={setMine} />
          <Label htmlFor="search-mine" className="text-xs font-normal">
            {t('gsMine')}
          </Label>
        </div>
      </div>

      {!term ? (
        <div className="grid gap-3 px-4 py-5">
          <p className="text-xs font-medium text-muted-foreground">
            {t('gsRecent')}
          </p>
          <ul className="flex flex-wrap gap-2">
            {recent.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => setQuery(item)}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm hover:bg-muted"
                >
                  <History
                    aria-hidden="true"
                    className="size-3.5 text-muted-foreground"
                  />
                  <span dir="auto">{item}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">{t('gsTry')}</p>
        </div>
      ) : ordered.length === 0 ? (
        <div className="grid place-items-center gap-1 px-6 py-10 text-center">
          <Illustration name="no-results" className="size-28 sm:size-28" />
          <p className="font-medium">{t('gsNone', { query: term })}</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {t('gsNoneHint')}
          </p>
          {(kind !== 'all' || mine) && matches.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => {
                setKind('all')
                setMine(false)
              }}
            >
              {t('gsShowAll')}
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="sr-only" aria-live="polite">
            {t('gsCount', { count: ordered.length, query: term })}
          </p>
          <div
            id={listId}
            role="listbox"
            aria-label={t('gsResults')}
            className="max-h-[32rem] overflow-y-auto py-1"
          >
            {kinds.map((group) => {
              const hits = ordered.filter((hit) => hit.kind === group)
              if (!hits.length) return null
              return (
                <div key={group} role="group" aria-label={t(kindLabel[group])}>
                  <p className="px-4 pt-3 pb-1 text-xs font-medium text-muted-foreground">
                    {t(kindLabel[group])} · {hits.length}
                  </p>
                  {hits.map((hit) => {
                    const position = ordered.indexOf(hit)
                    const selected = position === current
                    return (
                      <div
                        key={hit.title + hit.reference}
                        id={optionId(position)}
                        role="option"
                        aria-selected={selected}
                        onMouseMove={() => setActive(position)}
                        onClick={() => open(hit)}
                        className={cn(
                          'mx-1 flex cursor-pointer items-center gap-3 rounded-md px-3 py-2',
                          selected && 'bg-accent',
                        )}
                      >
                        {hit.kind === 'people' ? (
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                              {hit.title
                                .split(' ')
                                .map((part) => part[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <span
                            aria-hidden="true"
                            className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"
                          >
                            {hit.icon && <hit.icon className="size-4" />}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-sm font-medium"
                            dir="auto"
                          >
                            <Highlight text={hit.title} query={term} />
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            <span dir="ltr">
                              <Highlight text={hit.reference} query={term} />
                            </span>{' '}
                            · <Highlight text={hit.detail} query={term} />
                          </p>
                        </div>
                        {hit.amount !== undefined && (
                          <bdi className="hidden shrink-0 text-sm tabular-nums sm:block">
                            {money(hit.amount)}
                          </bdi>
                        )}
                        {selected && (
                          <CornerDownLeft
                            aria-hidden="true"
                            className="hidden size-4 shrink-0 text-muted-foreground sm:block rtl:-scale-x-100"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </>
      )}
      <div className="hidden items-center gap-1.5 border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground sm:flex">
        <Kbd>↑</Kbd>
        <Kbd>↓</Kbd>
        {t('gsNavigate')}
        <Kbd className="ms-3">↵</Kbd>
        {t('gsOpen')}
        <Kbd className="ms-3">Esc</Kbd>
        {t('gsClose')}
      </div>
    </Card>
  )
}
