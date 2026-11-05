import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { AuthPath, Go } from './navigation'

export function AuthHeader({
  icon,
  title,
  description,
}: {
  icon?: ReactNode
  title: string
  description: ReactNode
}) {
  return (
    <header className="grid gap-1.5">
      {icon && (
        <span className="mb-3 grid size-11 place-items-center rounded-xl border bg-card text-primary shadow-xs [&_svg]:size-5">
          {icon}
        </span>
      )}
      <h1 className="text-2xl font-semibold tracking-tight text-balance">
        {title}
      </h1>
      <p className="text-sm text-pretty text-muted-foreground">{description}</p>
    </header>
  )
}

const tones = {
  info: { icon: Info, className: 'border-info/25 bg-info/8 text-info' },
  success: {
    icon: CircleCheck,
    className: 'border-success/25 bg-success/8 text-success',
  },
  error: {
    icon: CircleAlert,
    className: 'border-destructive/25 bg-destructive/8 text-destructive',
  },
}

/** Inline banner for notices and form-level errors; announced to screen readers. */
export function AuthMessage({
  tone,
  children,
}: {
  tone: keyof typeof tones
  children: ReactNode
}) {
  const { icon: Icon, className } = tones[tone]
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex animate-in items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm duration-300 fade-in-0 slide-in-from-top-1',
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p className="text-foreground">{children}</p>
    </div>
  )
}

/** Text-style link that navigates within the signed-out screens. */
export function AuthLink({
  to,
  search,
  go,
  children,
  className,
}: {
  to: AuthPath
  search?: Record<string, string>
  go: Go
  children: ReactNode
  className?: string
}) {
  const href = search ? `${to}?${new URLSearchParams(search)}` : to
  return (
    <a
      href={href}
      onClick={(event) => {
        if (
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.button !== 0
        )
          return
        event.preventDefault()
        go(to, search)
      }}
      className={cn(
        'rounded-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50',
        className,
      )}
    >
      {children}
    </a>
  )
}
