import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Archive,
  AtSign,
  CheckCheck,
  CircleDollarSign,
  MessageSquare,
  Stamp,
  type LucideIcon,
} from 'lucide-react'
import { relativeDate } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import { Illustration } from '@/shared/ui/illustration'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { ns } from '../messages'

type Kind = 'approval' | 'mention' | 'budget' | 'comment'
interface Notice {
  id: string
  kind: Kind
  who: string
  ref: string
  /** Hours ago. */
  at: number
  unread: boolean
}
const kinds: Record<Kind, { icon: LucideIcon; key: string; tone: string }> = {
  approval: {
    icon: Stamp,
    key: 'notifApproval',
    tone: 'bg-primary/10 text-primary',
  },
  mention: { icon: AtSign, key: 'notifMention', tone: 'bg-info/12 text-info' },
  budget: {
    icon: CircleDollarSign,
    key: 'notifBudget',
    tone: 'bg-warning/12 text-warning',
  },
  comment: {
    icon: MessageSquare,
    key: 'notifComment',
    tone: 'bg-muted text-muted-foreground',
  },
}
const seed: Notice[] = [
  {
    id: 'n1',
    kind: 'approval',
    who: 'Priya Nair',
    ref: 'REQ-1212',
    at: 0.3,
    unread: true,
  },
  {
    id: 'n2',
    kind: 'mention',
    who: 'Omar Haddad',
    ref: 'REQ-1198',
    at: 1.5,
    unread: true,
  },
  {
    id: 'n3',
    kind: 'comment',
    who: 'Lina Farouk',
    ref: 'REQ-1187',
    at: 4,
    unread: false,
  },
  {
    id: 'n4',
    kind: 'budget',
    who: 'Finance',
    ref: 'Operations',
    at: 9,
    unread: true,
  },
  {
    id: 'n5',
    kind: 'approval',
    who: 'Alex Morgan',
    ref: 'REQ-1239',
    at: 27,
    unread: false,
  },
  {
    id: 'n6',
    kind: 'comment',
    who: 'Sam Taylor',
    ref: 'REQ-1240',
    at: 30,
    unread: true,
  },
  {
    id: 'n7',
    kind: 'mention',
    who: 'Chen Wei',
    ref: 'REQ-1176',
    at: 75,
    unread: false,
  },
  {
    id: 'n8',
    kind: 'approval',
    who: 'Nadia Karim',
    ref: 'REQ-1236',
    at: 98,
    unread: false,
  },
]
const hour = 3_600_000

function dayGroup(hoursAgo: number) {
  const then = new Date(Date.now() - hoursAgo * hour)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (then >= today) return 'today'
  return then >= new Date(today.getTime() - 24 * hour) ? 'yesterday' : 'earlier'
}

export default function InboxView() {
  const { t } = useTranslation(ns)
  const [items, setItems] = useState(seed)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const visible = items.filter((item) => filter === 'all' || item.unread)
  const unread = items.filter((item) => item.unread).length
  const allSelected =
    visible.length > 0 && visible.every((item) => selected.has(item.id))

  const markRead = (ids: Set<string>) =>
    setItems((list) =>
      list.map((item) =>
        ids.has(item.id) ? { ...item, unread: false } : item,
      ),
    )
  const archive = (ids: Set<string>) => {
    const before = items
    setItems((list) => list.filter((item) => !ids.has(item.id)))
    setSelected(new Set())
    // Reversible and low risk: an Undo toast instead of a confirmation.
    toast(t('archivedCount', { count: ids.size }), {
      action: { label: t('undo'), onClick: () => setItems(before) },
    })
  }
  const toggle = (id: string, on: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  const groups = (['today', 'yesterday', 'earlier'] as const)
    .map((group) => ({
      group,
      items: visible.filter((item) => dayGroup(item.at) === group),
    }))
    .filter((entry) => entry.items.length > 0)

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex min-h-14 flex-wrap items-center gap-2 border-b px-4 py-2.5">
        <Checkbox
          checked={
            allSelected ? true : selected.size > 0 ? 'indeterminate' : false
          }
          onCheckedChange={(on) =>
            setSelected(
              on ? new Set(visible.map((item) => item.id)) : new Set(),
            )
          }
          aria-label={t('selectAllNotifications')}
          disabled={visible.length === 0}
        />
        {selected.size > 0 ? (
          <div className="flex animate-in items-center gap-2 duration-150 fade-in-0">
            <span className="text-sm font-medium tabular-nums">
              {t('selectedCount', { count: selected.size })}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => markRead(selected)}
            >
              <CheckCheck data-icon="inline-start" />
              {t('markRead')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => archive(selected)}
            >
              <Archive data-icon="inline-start" />
              {t('archive')}
            </Button>
          </div>
        ) : (
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={filter}
            onValueChange={(value) =>
              value && setFilter(value as typeof filter)
            }
            aria-label={t('inboxFilter')}
          >
            <ToggleGroupItem value="all" className="px-3">
              {t('inboxAll')}
            </ToggleGroupItem>
            <ToggleGroupItem value="unread" className="gap-1.5 px-3">
              {t('inboxUnread')}
              {unread > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-[0.6875rem] leading-4 font-semibold text-primary-foreground tabular-nums">
                  {unread}
                </span>
              )}
            </ToggleGroupItem>
          </ToggleGroup>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="ms-auto"
          disabled={unread === 0}
          onClick={() => markRead(new Set(items.map((item) => item.id)))}
        >
          {t('markAllRead')}
        </Button>
      </div>
      {groups.length === 0 ? (
        <div className="grid place-items-center gap-1 px-6 py-12 text-center">
          <Illustration name="empty" className="size-28 sm:size-32" />
          <p className="font-medium">{t('inboxEmpty')}</p>
          <p className="text-sm text-muted-foreground">{t('inboxEmptyHint')}</p>
        </div>
      ) : (
        groups.map(({ group, items: entries }) => (
          <section key={group} aria-labelledby={`inbox-${group}`}>
            <h3
              id={`inbox-${group}`}
              className="border-b bg-muted/40 px-4 py-1.5 text-xs font-medium text-muted-foreground"
            >
              {t(group)}
            </h3>
            <ul className="divide-y">
              {entries.map((item) => {
                const kind = kinds[item.kind]
                return (
                  <li
                    key={item.id}
                    className={cn(
                      'group relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40',
                      selected.has(item.id) &&
                        'bg-primary/5 hover:bg-primary/5',
                    )}
                  >
                    <Checkbox
                      className="relative z-10 mt-2"
                      checked={selected.has(item.id)}
                      onCheckedChange={(on) => toggle(item.id, on === true)}
                      aria-label={t('selectNotification', { ref: item.ref })}
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        'grid size-8 shrink-0 place-items-center rounded-full',
                        kind.tone,
                      )}
                    >
                      <kind.icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {/* The whole row opens the notification; the checkbox sits above it. */}
                      <button
                        type="button"
                        onClick={() => markRead(new Set([item.id]))}
                        className="text-start text-sm after:absolute after:inset-0 focus-visible:outline-none after:focus-visible:ring-2 after:focus-visible:ring-ring after:focus-visible:ring-inset"
                      >
                        <span
                          className={cn(
                            item.unread
                              ? 'font-semibold'
                              : 'text-foreground/80',
                          )}
                        >
                          {t(kind.key, { who: item.who, ref: item.ref })}
                        </span>
                      </button>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {relativeDate(
                          new Date(Date.now() - item.at * hour).toISOString(),
                        )}
                      </p>
                    </div>
                    {item.unread && (
                      <span className="mt-2 size-2 shrink-0 rounded-full bg-primary">
                        <span className="sr-only">{t('inboxUnread')}</span>
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}
    </Card>
  )
}
