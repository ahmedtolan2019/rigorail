import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  CheckCheck,
  CirclePlus,
  MessageSquare,
  PencilLine,
  Send,
  type LucideIcon,
} from 'lucide-react'
import { money, relativeDate } from '@/shared/lib/format'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Textarea } from '@/shared/ui/textarea'
import { ns } from '../messages'

type Entry =
  | {
      id: string
      kind: 'event'
      actor: string
      at: number
      icon: LucideIcon
      text: string
    }
  | { id: string; kind: 'comment'; actor: string; at: number; text: string }
const hour = 3_600_000
const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

export default function ActivityTimeline() {
  const { t } = useTranslation(ns)
  const now = Date.now()
  const [entries, setEntries] = useState<Entry[]>(() => [
    {
      id: '1',
      kind: 'event',
      actor: 'Sam Taylor',
      at: now - 52 * hour,
      icon: CirclePlus,
      text: t('eventCreated'),
    },
    {
      id: '2',
      kind: 'event',
      actor: 'Sam Taylor',
      at: now - 50 * hour,
      icon: PencilLine,
      text: t('eventAmount', { from: money(110000), to: money(125000) }),
    },
    {
      id: '3',
      kind: 'event',
      actor: 'Sam Taylor',
      at: now - 49 * hour,
      icon: Send,
      text: t('eventSubmitted'),
    },
    {
      id: '4',
      kind: 'comment',
      actor: 'Alex Morgan',
      at: now - 26 * hour,
      text: 'Can we split the monitors into a separate order? The vendor has a 2-week lead time on those.',
    },
    {
      id: '5',
      kind: 'comment',
      actor: 'Sam Taylor',
      at: now - 24 * hour,
      text: 'Done. The monitors are now on REQ-1213.',
    },
    {
      id: '6',
      kind: 'event',
      actor: 'Alex Morgan',
      at: now - 3 * hour,
      icon: CheckCheck,
      text: t('eventApproved'),
    },
  ])
  const [draft, setDraft] = useState('')
  return (
    <Card className="max-w-2xl">
      <CardContent>
        <ol className="relative grid gap-5 before:absolute before:inset-y-2 before:start-[0.9375rem] before:w-px before:bg-border">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="relative flex animate-in gap-3 duration-300 fade-in-0"
            >
              {entry.kind === 'event' ? (
                <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full border bg-card text-muted-foreground">
                  <entry.icon aria-hidden="true" className="size-4" />
                </span>
              ) : (
                <Avatar className="z-10 size-8 ring-4 ring-card">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {initials(entry.actor)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="min-w-0 flex-1 pt-1.5">
                <p className="text-sm">
                  <bdi className="font-medium">{entry.actor}</bdi>{' '}
                  <span className="text-muted-foreground">
                    {entry.kind === 'event' ? entry.text : t('commented')}
                  </span>{' '}
                  <time
                    dateTime={new Date(entry.at).toISOString()}
                    className="text-xs text-muted-foreground"
                  >
                    · {relativeDate(new Date(entry.at).toISOString())}
                  </time>
                </p>
                {entry.kind === 'comment' && (
                  <p
                    dir="auto"
                    className="mt-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm leading-relaxed wrap-anywhere"
                  >
                    {entry.text}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
        <form
          className="mt-6 grid gap-2 border-t pt-5"
          onSubmit={(event) => {
            event.preventDefault()
            if (!draft.trim()) return
            setEntries((list) => [
              ...list,
              {
                id: crypto.randomUUID(),
                kind: 'comment',
                actor: 'Sam Taylor',
                at: Date.now(),
                text: draft.trim(),
              },
            ])
            setDraft('')
            toast.success(t('comment'))
          }}
        >
          <label
            htmlFor="activity-comment"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <MessageSquare
              aria-hidden="true"
              className="size-4 text-muted-foreground"
            />
            {t('addComment')}
          </label>
          <Textarea
            id="activity-comment"
            dir="auto"
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey))
                event.currentTarget.form?.requestSubmit()
            }}
            placeholder={t('commentPlaceholder')}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground" dir="ltr">
              ⌘ / Ctrl + Enter
            </span>
            <Button type="submit" size="sm" disabled={!draft.trim()}>
              <Send />
              {t('comment')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
