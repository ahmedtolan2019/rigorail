import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog'

const CHIPS = 6
const tones = {
  default: 'bg-primary/10 text-primary',
  warning: 'bg-warning/12 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
}

/**
 * Confirmation for consequential or irreversible actions (approvals, bulk changes,
 * discarding work). Say what happens in the title, what is affected in `details`,
 * and repeat the action in the button. Prefer an Undo toast for small reversible
 * actions such as removing a row the user just added.
 */
export function ConfirmAction({
  title,
  description,
  confirmLabel,
  tone = 'warning',
  icon,
  details,
  chips,
  chipTotal,
  irreversible = false,
  onConfirm,
  children,
}: {
  title: string
  description: ReactNode
  /** Repeat the action and scope, for example "Approve 2 requests". */
  confirmLabel: string
  tone?: keyof typeof tones
  icon?: LucideIcon
  /** What will be affected, shown as a compact summary. */
  details?: [label: string, value: ReactNode][]
  /** Affected items or applied filters, shown as chips (first few, then "+N more"). */
  chips?: string[]
  /** Total behind `chips` when only the first few are listed. */
  chipTotal?: number
  irreversible?: boolean
  onConfirm: () => void
  /** The trigger, usually a Button. */
  children: ReactNode
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const Icon = icon ?? (tone === 'destructive' ? TriangleAlert : CircleAlert)
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="flex gap-4 p-6">
          <span
            aria-hidden="true"
            className={cn(
              'grid size-10 shrink-0 place-items-center rounded-full',
              tones[tone],
            )}
          >
            <Icon className="size-5" />
          </span>
          <div className="grid min-w-0 flex-1 gap-1.5">
            <AlertDialogTitle className="text-base leading-snug">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              {description}
            </AlertDialogDescription>
            {chips && chips.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={title}>
                {chips.slice(0, CHIPS).map((chip) => (
                  <li
                    key={chip}
                    dir="auto"
                    className="rounded-full border bg-muted/60 px-2 py-0.5 text-xs font-medium tabular-nums"
                  >
                    {chip}
                  </li>
                ))}
                {(chipTotal ?? chips.length) > CHIPS && (
                  <li className="rounded-full px-1.5 py-0.5 text-xs text-muted-foreground">
                    {t('moreCount', {
                      count: (chipTotal ?? chips.length) - CHIPS,
                    })}
                  </li>
                )}
              </ul>
            )}
            {details && details.length > 0 && (
              <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">
                {details.map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="truncate text-end font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {irreversible && (
              <p
                className={cn(
                  'mt-1 flex items-center gap-1.5 text-xs font-medium',
                  tone === 'destructive' ? 'text-destructive' : 'text-warning',
                )}
              >
                <TriangleAlert aria-hidden="true" className="size-3.5" />
                {t('cannotUndo')}
              </p>
            )}
          </div>
        </div>
        <AlertDialogFooter className="border-t bg-muted/40 px-6 py-3">
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant={tone === 'destructive' ? 'destructive' : 'default'}
            onClick={() => {
              setOpen(false)
              onConfirm()
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
