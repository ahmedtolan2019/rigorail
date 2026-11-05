import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { ns } from './i18n'
import type { RequestRecord } from './schema'
import { categoryIcons } from './categories'

const tone: Record<RequestRecord['status'], string> = {
  draft: 'bg-muted text-muted-foreground [&>i]:bg-muted-foreground/60',
  pending: 'bg-warning/12 text-warning [&>i]:bg-warning',
  approved: 'bg-success/12 text-success [&>i]:bg-success',
}

export function StatusBadge({ status }: { status: RequestRecord['status'] }) {
  const { t } = useTranslation(ns)
  return (
    <Badge
      variant="secondary"
      data-status={status}
      className={cn('gap-1.5 rounded-full border-0 font-medium', tone[status])}
    >
      <i aria-hidden="true" className="size-1.5 rounded-full" />
      {t(status)}
    </Badge>
  )
}

export function CategoryLabel({
  category,
}: {
  category: RequestRecord['category']
}) {
  const { t } = useTranslation(ns)
  const Icon = categoryIcons[category]
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <Icon aria-hidden="true" className="size-3.5" />
      <span className="text-foreground">{t(category)}</span>
    </span>
  )
}

const hues = [
  'bg-chart-1/15 text-chart-1',
  'bg-chart-2/15 text-chart-2',
  'bg-chart-3/20 text-warning',
  'bg-chart-4/15 text-chart-4',
  'bg-chart-5/20 text-foreground',
]
/** Avatar initials with a stable color per person id. */
export function Person({ id, name }: { id: string; name: string }) {
  const hue =
    hues[
      [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % hues.length
    ]
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Avatar className="size-6">
        <AvatarFallback className={cn('text-[0.625rem] font-semibold', hue)}>
          {name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <bdi className="truncate">{name}</bdi>
    </span>
  )
}
