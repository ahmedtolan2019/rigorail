import { useId, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CircleCheck, MoreHorizontal, RotateCcw } from 'lucide-react'
import { relativeDate } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Textarea } from '@/shared/ui/textarea'
import { ns } from '../messages'
import { registerCopy } from '../example-utils'

registerCopy({
  ctContext: [
    'Discussion on REQ-1212 · Analytics platform renewal',
    'النقاش على REQ-1212 · تجديد منصة التحليلات',
  ],
  ctOpen_one: ['{{count}} open thread', 'نقاش مفتوح واحد'],
  ctOpen: ['{{count}} open threads', '{{count}} نقاشات مفتوحة'],
  ctNew: ['Start a thread', 'بدء نقاش'],
  ctPlaceholder: [
    'Write a comment. Type @ to mention someone.',
    'اكتب تعليقًا. اكتب @ للإشارة إلى شخص.',
  ],
  ctReplyPlaceholder: [
    'Reply. Type @ to mention someone.',
    'اكتب ردًا. اكتب @ للإشارة إلى شخص.',
  ],
  ctPost: ['Comment', 'تعليق'],
  ctReply: ['Reply', 'رد'],
  ctResolve: ['Resolve', 'حل'],
  ctReopen: ['Reopen', 'إعادة فتح'],
  ctResolvedBy: ['Resolved by {{name}}', 'حلّه {{name}}'],
  ctShowResolved_one: ['Show {{count}} resolved thread', 'عرض نقاش محلول واحد'],
  ctShowResolved: [
    'Show {{count}} resolved threads',
    'عرض {{count}} نقاشات محلولة',
  ],
  ctHideResolved: ['Hide resolved threads', 'إخفاء النقاشات المحلولة'],
  ctEdit: ['Edit', 'تعديل'],
  ctDelete: ['Delete', 'حذف'],
  ctSave: ['Save', 'حفظ'],
  ctEdited: ['edited', 'معدّل'],
  ctDeleted: ['Comment deleted.', 'تم حذف التعليق.'],
  ctActions: ['Comment actions', 'إجراءات التعليق'],
  ctMentionList: ['People to mention', 'أشخاص للإشارة'],
  ctNotified_one: ['{{names}} will be notified.', 'سيتم إشعار {{names}}.'],
  ctNotified: ['{{names}} will be notified.', 'سيتم إشعار {{names}}.'],
  ctMentionHint: [
    '↑↓ to choose, Enter to insert, Esc to close',
    '↑↓ للاختيار، Enter للإدراج، Esc للإغلاق',
  ],
})

const people = [
  { name: 'Lina Farouk', role: 'Procurement lead' },
  { name: 'Omar Haddad', role: 'Head of Procurement' },
  { name: 'Priya Nair', role: 'Head of Engineering' },
  { name: 'Sam Taylor', role: 'Finance director' },
  { name: 'Nadia Karim', role: 'Contracts manager' },
]
const ME = 'Sam Taylor'
interface Comment {
  id: number
  author: string
  text: string
  hours: number
  edited?: boolean
}
interface Thread {
  id: number
  comments: Comment[]
  resolvedBy?: string
}
let nextId = 100
const seed: Thread[] = [
  {
    id: 1,
    comments: [
      {
        id: 1,
        author: 'Priya Nair',
        text: 'The vendor held last year’s price if we sign before the 30th. @Sam Taylor can Finance approve this week?',
        hours: 6,
      },
      {
        id: 2,
        author: ME,
        text: 'Yes, once @Omar Haddad confirms the seat count. 40 seats looks high.',
        hours: 4,
      },
    ],
  },
  {
    id: 2,
    comments: [
      {
        id: 3,
        author: 'Lina Farouk',
        text: 'Attached the comparison with Contoso. Northwind is 8% cheaper.',
        hours: 30,
      },
    ],
  },
  {
    id: 3,
    resolvedBy: 'Priya Nair',
    comments: [
      {
        id: 4,
        author: 'Omar Haddad',
        text: 'Which cost centre should this hit?',
        hours: 50,
      },
      {
        id: 5,
        author: 'Priya Nair',
        text: 'Engineering, platform budget.',
        hours: 49,
      },
    ],
  },
]
const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
const mentioned = (text: string) =>
  people
    .filter((person) => text.includes(`@${person.name}`))
    .map((person) => person.name)

/** Renders known @mentions as chips; everything else stays plain text. */
function Rich({ text }: { text: string }) {
  const pattern = new RegExp(
    `(@(?:${people.map((person) => person.name).join('|')}))`,
    'g',
  )
  return (
    <>
      {text.split(pattern).map((part, index) =>
        part.startsWith('@') &&
        people.some((person) => `@${person.name}` === part) ? (
          <span
            key={index}
            className="rounded bg-primary/10 px-1 font-medium text-primary"
          >
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  )
}

/** Textarea with an @mention picker. Mentions are inserted as "@Full Name ". */
function Composer({
  placeholder,
  submitLabel,
  initial = '',
  autoFocus,
  onSubmit,
  onCancel,
}: {
  placeholder: string
  submitLabel: string
  initial?: string
  autoFocus?: boolean
  onSubmit: (text: string) => void
  onCancel?: () => void
}) {
  const { t } = useTranslation(ns)
  const [text, setText] = useState(initial)
  const [mention, setMention] = useState<{
    start: number
    query: string
  } | null>(null)
  const [active, setActive] = useState(0)
  const field = useRef<HTMLTextAreaElement>(null)
  const listId = useId()
  const options = mention
    ? people.filter((person) =>
        person.name.toLowerCase().includes(mention.query.toLowerCase()),
      )
    : []
  const detect = (value: string, caret: number) => {
    // An "@" at the start or after whitespace opens the picker until a space ends the query.
    const match = /(^|\s)@([^\s@]*)$/.exec(value.slice(0, caret))
    setMention(
      match ? { start: caret - match[2]!.length - 1, query: match[2]! } : null,
    )
    setActive(0)
  }
  const insert = (name: string) => {
    if (!mention) return
    const caret = field.current?.selectionStart ?? text.length
    const next = `${text.slice(0, mention.start)}@${name} ${text.slice(caret)}`
    setText(next)
    setMention(null)
    requestAnimationFrame(() => {
      const position = mention.start + name.length + 2
      field.current?.focus()
      field.current?.setSelectionRange(position, position)
    })
  }
  const submit = () => {
    if (!text.trim()) return
    onSubmit(text.trim())
    setText('')
  }
  const notify = mentioned(text)
  return (
    <div className="relative grid gap-2">
      <Textarea
        ref={field}
        rows={2}
        autoFocus={autoFocus}
        value={text}
        placeholder={placeholder}
        aria-label={placeholder}
        aria-autocomplete="list"
        aria-controls={options.length ? listId : undefined}
        aria-activedescendant={
          options.length ? `${listId}-${active}` : undefined
        }
        onChange={(event) => {
          setText(event.target.value)
          detect(event.target.value, event.target.selectionStart)
        }}
        onKeyDown={(event) => {
          if (options.length) {
            if (event.key === 'ArrowDown')
              setActive((value) => (value + 1) % options.length)
            else if (event.key === 'ArrowUp')
              setActive(
                (value) => (value - 1 + options.length) % options.length,
              )
            else if (event.key === 'Enter' || event.key === 'Tab')
              insert(options[active]!.name)
            else if (event.key === 'Escape') setMention(null)
            else return
            event.preventDefault()
            return
          }
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault()
            submit()
          }
          if (event.key === 'Escape' && onCancel) onCancel()
        }}
      />
      {options.length > 0 && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border bg-popover shadow-lg">
          <ul
            id={listId}
            role="listbox"
            aria-label={t('ctMentionList')}
            className="max-h-56 overflow-y-auto p-1"
          >
            {options.map((person, index) => (
              <li
                key={person.name}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                onMouseDown={(event) => {
                  event.preventDefault()
                  insert(person.name)
                }}
                onMouseMove={() => setActive(index)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                  index === active && 'bg-accent',
                )}
              >
                <Avatar className="size-6">
                  <AvatarFallback className="text-[0.625rem] font-semibold">
                    {initials(person.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{person.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {person.role}
                </span>
              </li>
            ))}
          </ul>
          <p className="border-t px-3 py-1.5 text-[0.6875rem] text-muted-foreground">
            {t('ctMentionHint')}
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {notify.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {t('ctNotified', {
              count: notify.length,
              names: notify.join(', '),
            })}
          </p>
        )}
        <div className="ms-auto flex gap-2">
          {onCancel && (
            <Button size="sm" variant="ghost" onClick={onCancel}>
              {t('cancel')}
            </Button>
          )}
          <Button size="sm" disabled={!text.trim()} onClick={submit}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function CommentsThread() {
  const { t } = useTranslation(ns)
  const [threads, setThreads] = useState(seed)
  const [showResolved, setShowResolved] = useState(false)
  const [replying, setReplying] = useState<number | null>(null)
  const [editing, setEditing] = useState<number | null>(null)
  const open = threads.filter((thread) => !thread.resolvedBy)
  const resolved = threads.filter((thread) => thread.resolvedBy)
  const update = (id: number, change: (thread: Thread) => Thread | null) =>
    setThreads((list) =>
      list.flatMap((thread) =>
        thread.id === id ? (change(thread) ?? []) : [thread],
      ),
    )

  const renderThread = (thread: Thread): ReactNode => (
    <Card
      key={thread.id}
      className={cn(
        'animate-in gap-0 py-0 duration-200 fade-in-0',
        thread.resolvedBy && 'bg-muted/30',
      )}
    >
      <ol className="divide-y">
        {thread.comments.map((comment) => (
          <li key={comment.id} className="flex gap-3 px-4 py-3">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {initials(comment.author)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  {comment.author === ME ? t('you') : comment.author}
                </p>
                <p className="text-xs text-muted-foreground">
                  {relativeDate(
                    new Date(
                      Date.now() - comment.hours * 3_600_000,
                    ).toISOString(),
                  )}
                  {comment.edited && ` · ${t('ctEdited')}`}
                </p>
                {/* Only the author can change a comment; the backend enforces this too. */}
                {comment.author === ME && editing !== comment.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="ms-auto -my-1 size-7 text-muted-foreground"
                        aria-label={t('ctActions')}
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(comment.id)}>
                        {t('ctEdit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          const before = threads
                          update(thread.id, (current) => {
                            const comments = current.comments.filter(
                              (item) => item.id !== comment.id,
                            )
                            return comments.length
                              ? { ...current, comments }
                              : null
                          })
                          toast(t('ctDeleted'), {
                            action: {
                              label: t('undo'),
                              onClick: () => setThreads(before),
                            },
                          })
                        }}
                      >
                        {t('ctDelete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {editing === comment.id ? (
                <div className="mt-2">
                  <Composer
                    autoFocus
                    initial={comment.text}
                    placeholder={t('ctPlaceholder')}
                    submitLabel={t('ctSave')}
                    onCancel={() => setEditing(null)}
                    onSubmit={(text) => {
                      update(thread.id, (current) => ({
                        ...current,
                        comments: current.comments.map((item) =>
                          item.id === comment.id
                            ? { ...item, text, edited: true }
                            : item,
                        ),
                      }))
                      setEditing(null)
                    }}
                  />
                </div>
              ) : (
                <p
                  dir="auto"
                  className="mt-0.5 text-start text-sm leading-relaxed break-words whitespace-pre-wrap"
                >
                  <Rich text={comment.text} />
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
      {replying === thread.id && (
        <div className="border-t px-4 py-3">
          <Composer
            autoFocus
            placeholder={t('ctReplyPlaceholder')}
            submitLabel={t('ctReply')}
            onCancel={() => setReplying(null)}
            onSubmit={(text) => {
              update(thread.id, (current) => ({
                ...current,
                comments: [
                  ...current.comments,
                  { id: nextId++, author: ME, text, hours: 0 },
                ],
              }))
              setReplying(null)
            }}
          />
        </div>
      )}
      <div className="flex items-center gap-2 border-t px-4 py-2">
        {thread.resolvedBy ? (
          <>
            <span className="flex items-center gap-1.5 text-xs text-success">
              <CircleCheck className="size-3.5" />
              {t('ctResolvedBy', { name: thread.resolvedBy })}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="ms-auto"
              onClick={() =>
                update(thread.id, (current) => ({
                  ...current,
                  resolvedBy: undefined,
                }))
              }
            >
              <RotateCcw data-icon="inline-start" />
              {t('ctReopen')}
            </Button>
          </>
        ) : (
          <>
            {replying !== thread.id && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReplying(thread.id)}
              >
                {t('ctReply')}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="ms-auto"
              onClick={() =>
                update(thread.id, (current) => ({ ...current, resolvedBy: ME }))
              }
            >
              <CircleCheck data-icon="inline-start" />
              {t('ctResolve')}
            </Button>
          </>
        )}
      </div>
    </Card>
  )

  return (
    <div className="grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-sm font-medium">{t('ctContext')}</p>
        <p className="text-xs text-muted-foreground">
          {t('ctOpen', { count: open.length })}
        </p>
      </div>
      <Card className="gap-2 px-4 py-3">
        <p className="text-sm font-medium">{t('ctNew')}</p>
        <Composer
          placeholder={t('ctPlaceholder')}
          submitLabel={t('ctPost')}
          onSubmit={(text) =>
            setThreads((list) => [
              {
                id: nextId++,
                comments: [{ id: nextId++, author: ME, text, hours: 0 }],
              },
              ...list,
            ])
          }
        />
      </Card>
      {open.map(renderThread)}
      {resolved.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="justify-self-start"
          onClick={() => setShowResolved((value) => !value)}
        >
          {showResolved
            ? t('ctHideResolved')
            : t('ctShowResolved', { count: resolved.length })}
        </Button>
      )}
      {showResolved && resolved.map(renderThread)}
    </div>
  )
}
