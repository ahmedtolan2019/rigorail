import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronRight,
  ChevronsDownUp,
  Search,
  UserRoundPlus,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { ns } from '../messages'

interface Person {
  name: string
  role: string
  team: string
  vacancy?: boolean
  reports?: Person[]
}
const org: Person = {
  name: 'Alex Morgan',
  role: 'Chief Operating Officer',
  team: 'Executive',
  reports: [
    {
      name: 'Omar Haddad',
      role: 'Head of Procurement',
      team: 'Procurement',
      reports: [
        {
          name: 'Lina Farouk',
          role: 'Procurement lead',
          team: 'Procurement',
          reports: [
            { name: 'Yusuf Rahman', role: 'Buyer', team: 'Procurement' },
            { name: 'Grace Okafor', role: 'Buyer', team: 'Procurement' },
          ],
        },
        { name: 'Nadia Karim', role: 'Contracts manager', team: 'Procurement' },
        {
          name: '',
          role: 'Supplier risk analyst',
          team: 'Procurement',
          vacancy: true,
        },
      ],
    },
    {
      name: 'Sam Taylor',
      role: 'Finance director',
      team: 'Finance',
      reports: [
        {
          name: 'Chen Wei',
          role: 'Financial controller',
          team: 'Finance',
          reports: [
            { name: 'Maria Lopez', role: 'Accounts payable', team: 'Finance' },
            {
              name: 'Hassan Ali',
              role: 'Accounts receivable',
              team: 'Finance',
            },
          ],
        },
        { name: 'Ivy Chen', role: 'FP&A analyst', team: 'Finance' },
      ],
    },
    {
      name: 'Priya Nair',
      role: 'Head of Engineering',
      team: 'Engineering',
      reports: [
        { name: 'Tom Becker', role: 'Platform lead', team: 'Engineering' },
        { name: 'Aisha Noor', role: 'Data lead', team: 'Engineering' },
      ],
    },
  ],
}
const keyOf = (person: Person) => person.name || `vacancy:${person.role}`
const count = (person: Person): number =>
  (person.reports ?? []).reduce((sum, report) => sum + 1 + count(report), 0)
const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')

export default function OrgChart() {
  const { t } = useTranslation(ns)
  const [open, setOpen] = useState<Set<string>>(
    () => new Set([keyOf(org), 'Omar Haddad']),
  )
  const [selected, setSelected] = useState('Lina Farouk')
  const [query, setQuery] = useState('')
  const search = query.trim().toLowerCase()
  // Matches and every manager above them stay visible while searching.
  const { visible, path } = useMemo(() => {
    const keep = new Set<string>()
    const chain: string[] = []
    const walk = (person: Person, trail: string[]): boolean => {
      const key = keyOf(person)
      const self =
        !search ||
        `${person.name} ${person.role}`.toLowerCase().includes(search)
      const child = (person.reports ?? [])
        .map((report) => walk(report, [...trail, key]))
        .some(Boolean)
      if (person.name === selected) chain.push(...trail, key)
      if (self || child) keep.add(key)
      return self || child
    }
    walk(org, [])
    return { visible: keep, path: chain }
  }, [search, selected])
  const find = (person: Person): Person | undefined =>
    person.name === selected
      ? person
      : (person.reports ?? []).map(find).find(Boolean)
  const current = find(org) ?? org

  const node = (person: Person, depth: number) => {
    const key = keyOf(person)
    if (!visible.has(key)) return null
    const children = person.reports ?? []
    const expanded = !!search || open.has(key)
    const highlight =
      search && `${person.name} ${person.role}`.toLowerCase().includes(search)
    return (
      <li
        key={key}
        role="treeitem"
        aria-expanded={children.length ? expanded : undefined}
        aria-selected={person.name === selected}
      >
        <div
          className="relative flex items-center gap-1 py-0.5"
          style={{ paddingInlineStart: `${depth * 1.5}rem` }}
        >
          {children.length > 0 ? (
            <Button
              size="icon"
              variant="ghost"
              className="size-6 shrink-0"
              aria-label={t(expanded ? 'collapseTeam' : 'expandTeam', {
                name: person.name,
              })}
              onClick={() =>
                setOpen((set) => {
                  const next = new Set(set)
                  if (next.has(key)) next.delete(key)
                  else next.add(key)
                  return next
                })
              }
            >
              <ChevronRight
                className={cn(
                  'size-3.5 transition-transform rtl:-scale-x-100',
                  expanded && 'rotate-90 rtl:-rotate-90',
                )}
              />
            </Button>
          ) : (
            <span className="size-6 shrink-0" />
          )}
          <button
            type="button"
            disabled={person.vacancy}
            onClick={() => setSelected(person.name)}
            className={cn(
              'flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-start transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-default',
              person.name === selected &&
                'border-primary/30 bg-primary/5 hover:bg-primary/5',
              highlight && 'bg-warning/10',
            )}
          >
            {person.vacancy ? (
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-dashed text-muted-foreground">
                <UserRoundPlus className="size-3.5" />
              </span>
            ) : (
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initials(person.name)}
                </AvatarFallback>
              </Avatar>
            )}
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  'block truncate text-sm font-medium',
                  person.vacancy && 'text-muted-foreground italic',
                )}
              >
                {person.vacancy ? t('openPosition') : person.name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {person.role}
              </span>
            </span>
            {children.length > 0 && (
              <span className="shrink-0 rounded-full bg-muted px-1.5 text-[0.6875rem] text-muted-foreground tabular-nums">
                {count(person)}
              </span>
            )}
          </button>
        </div>
        {children.length > 0 && expanded && (
          // A vertical guide under the parent's chevron; logical start keeps it right in RTL.
          <ul
            role="group"
            className="relative before:absolute before:start-(--guide) before:top-0 before:bottom-4 before:w-px before:bg-border"
            style={
              { '--guide': `${depth * 1.5 + 0.75}rem` } as React.CSSProperties
            }
          >
            {children.map((child) => node(child, depth + 1))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-4">
      <Card className="min-w-0 gap-3 px-3 py-3 sm:px-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('searchPeople')}
              aria-label={t('searchPeople')}
              className="h-8 ps-8"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(new Set([keyOf(org)]))}
          >
            <ChevronsDownUp data-icon="inline-start" />
            {t('collapseAll')}
          </Button>
        </div>
        {visible.size === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('noPeopleFound')}
          </p>
        ) : (
          <ul role="tree" aria-label={t('orgChart')}>
            {node(org, 0)}
          </ul>
        )}
      </Card>
      <Card className="gap-3 px-5 py-4 lg:sticky lg:top-20 lg:self-start">
        <nav
          aria-label={t('reportingLine')}
          className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
        >
          {path.slice(0, -1).map((name) => (
            <span key={name} className="flex items-center gap-1">
              <button
                type="button"
                className="hover:text-foreground hover:underline"
                onClick={() => setSelected(name)}
              >
                {name}
              </button>
              <ChevronRight
                aria-hidden="true"
                className="size-3 rtl:-scale-x-100"
              />
            </span>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Avatar className="size-11">
            <AvatarFallback className="bg-primary/10 font-semibold text-primary">
              {initials(current.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold">{current.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {current.role}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 border-t pt-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">{t('team')}</dt>
            <dd className="font-medium">{current.team}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t('directReports')}
            </dt>
            <dd className="font-medium tabular-nums">
              {current.reports?.length ?? 0}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">{t('totalOrg')}</dt>
            <dd className="font-medium">
              {t('peopleCount', { count: count(current) })}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}
