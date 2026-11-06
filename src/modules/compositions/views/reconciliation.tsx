import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Link2, Sparkles, Unlink } from 'lucide-react'
import { date, money } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import { Progress } from '@/shared/ui/progress'
import { ns } from '../messages'

interface Line {
  id: string
  /** Business reference shown to people. */
  ref: string
  day: number
  text: string
  amount: number
}
const day = 86_400_000
// Bank statement lines and book entries for the same account and month.
const statement: Line[] = [
  {
    id: 's1',
    ref: 'TRX 88213',
    day: 1,
    text: 'NORTHWIND TRADERS PAYMT',
    amount: -1_204_000,
  },
  {
    id: 's2',
    ref: 'TRX 88220',
    day: 2,
    text: 'CUSTOMER DEP. ADATUM',
    amount: 3_450_000,
  },
  { id: 's3', ref: 'TRX 88231', day: 3, text: 'BANK FEE OCT', amount: -2_500 },
  {
    id: 's4',
    ref: 'TRX 88240',
    day: 4,
    text: 'CONTOSO OFFICE 2 OF 2',
    amount: -310_000,
  },
  {
    id: 's5',
    ref: 'TRX 88241',
    day: 4,
    text: 'CONTOSO OFFICE 1 OF 2',
    amount: -200_000,
  },
  {
    id: 's6',
    ref: 'TRX 88257',
    day: 6,
    text: 'PAYROLL BATCH 44',
    amount: -8_920_000,
  },
  {
    id: 's7',
    ref: 'TRX 88263',
    day: 7,
    text: 'FABRIKAM REFUND',
    amount: 64_500,
  },
]
const ledger: Line[] = [
  {
    id: 'l1',
    ref: 'JE-4410',
    day: 1,
    text: 'Payment PO-2041 Northwind',
    amount: -1_204_000,
  },
  {
    id: 'l2',
    ref: 'JE-4413',
    day: 2,
    text: 'Receipt INV-3301 Adatum',
    amount: 3_450_000,
  },
  {
    id: 'l3',
    ref: 'JE-4418',
    day: 4,
    text: 'Payment PO-2038 Contoso',
    amount: -510_000,
  },
  {
    id: 'l4',
    ref: 'JE-4425',
    day: 6,
    text: 'Payroll October',
    amount: -8_920_000,
  },
  {
    id: 'l5',
    ref: 'JE-4431',
    day: 7,
    text: 'Refund credit note CN-118',
    amount: 64_000,
  },
]
interface Match {
  statement: string[]
  ledger: string[]
}
const sum = (lines: Line[], ids: Iterable<string>) => {
  const set = new Set(ids)
  return lines
    .filter((line) => set.has(line.id))
    .reduce((total, line) => total + line.amount, 0)
}

export default function Reconciliation() {
  const { t } = useTranslation(ns)
  const [matches, setMatches] = useState<Match[]>([])
  const [pickedBank, setPickedBank] = useState<Set<string>>(new Set())
  const [pickedBook, setPickedBook] = useState<Set<string>>(new Set())
  const matchedBank = new Set(matches.flatMap((match) => match.statement))
  const matchedBook = new Set(matches.flatMap((match) => match.ledger))
  const openBank = statement.filter((line) => !matchedBank.has(line.id))
  const openBook = ledger.filter((line) => !matchedBook.has(line.id))
  const difference = sum(statement, pickedBank) - sum(ledger, pickedBook)
  const canMatch =
    pickedBank.size > 0 && pickedBook.size > 0 && difference === 0
  // One-to-one exact matches on amount are safe to suggest; everything else needs a person.
  const suggestions = openBank.flatMap((line) => {
    const twin = openBook.filter((entry) => entry.amount === line.amount)
    return twin.length === 1
      ? [{ statement: [line.id], ledger: [twin[0]!.id] }]
      : []
  })
  const reconciled = matchedBank.size
  const add = (next: Match[]) => {
    setMatches((current) => [...current, ...next])
    setPickedBank(new Set())
    setPickedBook(new Set())
  }
  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }
  const label = (lines: Line[], ids: string[]) =>
    ids.map((id) => lines.find((line) => line.id === id)!.ref).join(' + ')

  const column = (
    title: string,
    lines: Line[],
    picked: Set<string>,
    onPick: (id: string) => void,
  ) => (
    <Card className="min-w-0 gap-0 overflow-hidden py-0">
      <div className="flex items-baseline gap-2 border-b px-4 py-2.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">
          {t('openCount', { count: lines.length })}
        </span>
        <bdi className="ms-auto text-xs text-muted-foreground tabular-nums">
          {money(
            sum(
              lines,
              lines.map((line) => line.id),
            ),
          )}
        </bdi>
      </div>
      {lines.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          {t('allMatched')}
        </p>
      ) : (
        <ul className="divide-y">
          {lines.map((line) => {
            const on = picked.has(line.id)
            return (
              <li key={line.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40',
                    on && 'bg-primary/5 hover:bg-primary/5',
                  )}
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={on}
                    onCheckedChange={() => onPick(line.id)}
                  />
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate text-sm font-medium" dir="auto">
                      {line.text}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      <span dir="ltr">{line.ref}</span> ·{' '}
                      {date(
                        new Date(
                          Date.now() - (10 - line.day) * day,
                        ).toISOString(),
                      )}
                    </span>
                  </span>
                  <bdi
                    className={cn(
                      'text-sm font-medium tabular-nums',
                      line.amount > 0 && 'text-success',
                    )}
                  >
                    {money(line.amount)}
                  </bdi>
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )

  return (
    <div className="grid gap-3 lg:gap-4">
      <Card className="gap-3 px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="min-w-48 flex-1">
            <p className="text-sm font-medium">
              {t('reconciledOf', { done: reconciled, total: statement.length })}
            </p>
            <Progress
              value={(reconciled / statement.length) * 100}
              className="mt-2 h-1.5"
              aria-label={t('reconciledOf', {
                done: reconciled,
                total: statement.length,
              })}
            />
          </div>
          {/* Only offered while there is something safe to accept. */}
          {suggestions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                add(suggestions)
                toast.success(
                  t('suggestionsAccepted', { count: suggestions.length }),
                  {
                    action: {
                      label: t('undo'),
                      onClick: () =>
                        setMatches((current) =>
                          current.slice(0, current.length - suggestions.length),
                        ),
                    },
                  },
                )
              }}
            >
              <Sparkles data-icon="inline-start" />
              {t('acceptSuggestions', { count: suggestions.length })}
            </Button>
          )}
        </div>
      </Card>
      <div className="grid gap-3 md:grid-cols-2 lg:gap-4">
        {column(t('bankStatement'), openBank, pickedBank, (id) =>
          setPickedBank((set) => toggle(set, id)),
        )}
        {column(t('bookEntries'), openBook, pickedBook, (id) =>
          setPickedBook((set) => toggle(set, id)),
        )}
      </div>
      {/* The match bar explains why matching is blocked instead of only disabling it. */}
      <div
        className={cn(
          'sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-xl border bg-card/95 px-4 py-3 shadow-lg backdrop-blur transition-opacity supports-[backdrop-filter]:bg-card/80',
          pickedBank.size + pickedBook.size === 0 &&
            'pointer-events-none opacity-0',
        )}
        aria-hidden={pickedBank.size + pickedBook.size === 0}
      >
        <p className="text-sm">
          {t('selectedSides', { bank: pickedBank.size, book: pickedBook.size })}
        </p>
        <p
          className={cn(
            'text-sm font-medium tabular-nums',
            difference === 0 ? 'text-success' : 'text-warning',
          )}
        >
          {t('difference')}: <bdi>{money(difference)}</bdi>
        </p>
        <Button
          size="sm"
          className="ms-auto"
          disabled={!canMatch}
          onClick={() => {
            add([{ statement: [...pickedBank], ledger: [...pickedBook] }])
            toast.success(t('matched'))
          }}
        >
          <Link2 data-icon="inline-start" />
          {t('match')}
        </Button>
      </div>
      {matches.length > 0 && (
        <Card className="gap-0 py-0">
          <h3 className="border-b px-4 py-2.5 text-sm font-semibold">
            {t('matchedPairs', { count: matches.length })}
          </h3>
          <ul className="divide-y">
            {matches.map((match, index) => (
              <li
                key={index}
                className="flex items-center gap-3 px-4 py-2 text-sm"
              >
                <span dir="ltr" className="min-w-0 flex-1 truncate text-start">
                  {label(statement, match.statement)}
                  <span className="mx-2 text-muted-foreground">=</span>
                  {label(ledger, match.ledger)}
                </span>
                <bdi className="tabular-nums text-muted-foreground">
                  {money(sum(statement, match.statement))}
                </bdi>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  aria-label={`${t('unmatch')}: ${label(statement, match.statement)}`}
                  onClick={() =>
                    setMatches((current) =>
                      current.filter((_, position) => position !== index),
                    )
                  }
                >
                  <Unlink className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
