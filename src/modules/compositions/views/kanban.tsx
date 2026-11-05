import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { GripVertical, MoreHorizontal, TriangleAlert } from 'lucide-react'
import { compactMoney } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { ns } from '../messages'

const stages = ['backlog', 'doing', 'review', 'done'] as const
type Stage = (typeof stages)[number]
const stageLabel = {
  backlog: 'stageBacklog',
  doing: 'stageDoing',
  review: 'stageReview',
  done: 'stageDone',
} as const
const WIP_LIMIT = 3
interface Card {
  ref: string
  title: string
  owner: string
  amount: number
  priority: 'low' | 'normal' | 'high'
  stage: Stage
}
const initial: Card[] = [
  {
    ref: 'REQ-1240',
    title: 'Office equipment',
    owner: 'Sam Taylor',
    amount: 125_000,
    priority: 'normal',
    stage: 'backlog',
  },
  {
    ref: 'REQ-1236',
    title: 'Translation services',
    owner: 'Nadia Karim',
    amount: 310_000,
    priority: 'low',
    stage: 'backlog',
  },
  {
    ref: 'REQ-1239',
    title: 'Site safety supplies',
    owner: 'Alex Morgan',
    amount: 112_000,
    priority: 'high',
    stage: 'doing',
  },
  {
    ref: 'REQ-1230',
    title: 'Printer supplies',
    owner: 'Lina Farouk',
    amount: 200_050,
    priority: 'normal',
    stage: 'doing',
  },
  {
    ref: 'REQ-1212',
    title: 'Analytics renewal',
    owner: 'Priya Nair',
    amount: 1_850_000,
    priority: 'high',
    stage: 'doing',
  },
  {
    ref: 'REQ-1198',
    title: 'Leadership workshop',
    owner: 'Omar Haddad',
    amount: 640_000,
    priority: 'normal',
    stage: 'review',
  },
  {
    ref: 'REQ-1187',
    title: 'Warehouse scanners',
    owner: 'Chen Wei',
    amount: 920_000,
    priority: 'normal',
    stage: 'done',
  },
]
const priorityTone = {
  low: 'bg-muted text-muted-foreground',
  normal: 'bg-info/12 text-info',
  high: 'bg-destructive/10 text-destructive',
}

export default function Kanban() {
  const { t } = useTranslation(ns)
  const [cards, setCards] = useState(initial)
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<Stage | null>(null)
  const move = (ref: string, stage: Stage) => {
    const card = cards.find((item) => item.ref === ref)
    if (!card || card.stage === stage) return
    setCards((list) =>
      list.map((item) => (item.ref === ref ? { ...item, stage } : item)),
    )
    toast(t('movedTo', { ref, stage: t(stageLabel[stage]) }))
  }
  return (
    // Horizontal scroll on small screens keeps each column readable.
    <div className="-mx-(--page-space) overflow-x-auto px-(--page-space) pb-2 lg:mx-0 lg:px-0">
      <div className="grid min-w-[44rem] grid-cols-4 gap-3">
        {stages.map((stage) => {
          const items = cards.filter((card) => card.stage === stage)
          const overLimit = stage === 'doing' && items.length > WIP_LIMIT
          return (
            <section
              key={stage}
              aria-label={t(stageLabel[stage])}
              onDragOver={(event) => {
                event.preventDefault()
                setOver(stage)
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(event) => {
                event.preventDefault()
                setOver(null)
                const ref = event.dataTransfer.getData('text/plain')
                if (ref) move(ref, stage)
              }}
              className={cn(
                'flex min-h-80 flex-col gap-2 rounded-xl border bg-muted/40 p-2 transition-colors',
                over === stage && 'border-primary bg-primary/5',
              )}
            >
              <header className="flex items-center gap-2 px-1.5 py-1 whitespace-nowrap">
                <h3 className="truncate text-sm font-semibold">
                  {t(stageLabel[stage])}
                </h3>
                {stage === 'doing' ? (
                  // Work-in-progress limit shown as count/limit; warns when exceeded.
                  <span
                    title={t('wipLimit', { count: WIP_LIMIT })}
                    className={cn(
                      'flex shrink-0 items-center gap-1 rounded-full bg-background px-1.5 text-xs tabular-nums',
                      overLimit
                        ? 'font-medium text-warning'
                        : 'text-muted-foreground',
                    )}
                  >
                    {overLimit && <TriangleAlert className="size-3" />}
                    {items.length}/{WIP_LIMIT}
                    <span className="sr-only">
                      {t('wipLimit', { count: WIP_LIMIT })}
                    </span>
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-background px-1.5 text-xs text-muted-foreground tabular-nums">
                    {items.length}
                  </span>
                )}
              </header>
              <ul className="grid gap-2">
                {items.map((card) => (
                  <li
                    key={card.ref}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', card.ref)
                      event.dataTransfer.effectAllowed = 'move'
                      setDragging(card.ref)
                    }}
                    onDragEnd={() => setDragging(null)}
                    className={cn(
                      'group grid animate-in cursor-grab gap-2 rounded-lg border bg-card p-3 shadow-xs transition-[opacity,box-shadow] duration-200 fade-in-0 hover:shadow-sm active:cursor-grabbing',
                      dragging === card.ref && 'opacity-50',
                    )}
                  >
                    <div className="flex items-start gap-1.5">
                      <GripVertical
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground/50"
                      />
                      <p className="min-w-0 flex-1 text-sm leading-snug font-medium">
                        {card.title}
                      </p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="-me-1.5 -mt-1 size-7 text-muted-foreground"
                            aria-label={`${t('moveCard')}: ${card.title}`}
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('moveCard')}</DropdownMenuLabel>
                          {stages
                            .filter((target) => target !== card.stage)
                            .map((target) => (
                              <DropdownMenuItem
                                key={target}
                                onClick={() => move(card.ref, target)}
                              >
                                {t(stageLabel[target])}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 ps-5.5">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'rounded-full border-0 px-1.5',
                          priorityTone[card.priority],
                        )}
                      >
                        {t(card.priority)}
                      </Badge>
                      <Avatar className="ms-auto size-5" title={card.owner}>
                        <AvatarFallback className="bg-primary/10 text-[0.5625rem] font-semibold text-primary">
                          {card.owner
                            .split(' ')
                            .map((part) => part[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex items-center gap-2 ps-5.5 text-xs text-muted-foreground">
                      <span
                        dir="ltr"
                        className="whitespace-nowrap tabular-nums"
                      >
                        {card.ref}
                      </span>
                      <bdi className="ms-auto font-medium whitespace-nowrap text-foreground tabular-nums">
                        {compactMoney(card.amount)}
                      </bdi>
                    </div>
                  </li>
                ))}
              </ul>
              {items.length === 0 && (
                <p className="grid flex-1 place-items-center rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  {t('dropHere')}
                </p>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
