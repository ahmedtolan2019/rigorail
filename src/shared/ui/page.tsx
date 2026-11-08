import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useDocumentTitle } from '@/shared/hooks/use-document-title'
import { Skeleton } from './skeleton'

// Application page primitives shared by modules. Registry components stay in their own files.
export function PageHeader({
  title,
  description,
  titleDir,
  actions,
}: {
  title: ReactNode
  description?: ReactNode
  titleDir?: 'auto'
  actions?: ReactNode
}) {
  useDocumentTitle(typeof title === 'string' ? title : undefined)
  return (
    <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <h1 dir={titleDir}>{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[0.9375rem] text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        // Several actions sit in a row with a gap and wrap on narrow screens.
        <div data-print="hide" className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}

/** Placeholder shaped like a page header plus content, for route-level pending states. */
export function PageSkeleton() {
  const { t } = useTranslation()
  return (
    <div
      role="status"
      aria-label={t('loading')}
      className="animate-in fade-in-0 duration-300"
    >
      <div className="mb-6 flex items-end justify-between gap-6">
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="hidden h-9 w-32 sm:block" />
      </div>
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Skeleton className="h-11 rounded-none" />
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-6 border-t px-4 py-4"
          >
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="ms-auto h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Placeholder for record detail pages: header, main cards and a summary column. */
export function DetailSkeleton() {
  const { t } = useTranslation()
  return (
    <div
      role="status"
      aria-label={t('loading')}
      className="animate-in fade-in-0 duration-300"
    >
      <Skeleton className="mb-5 h-4 w-32" />
      <div className="mb-6 flex flex-col gap-2.5">
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  )
}

export const backLinkClass =
  'mb-5 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground transition-colors hover:text-foreground print:hidden'
export const mutedTextClass = 'text-sm text-muted-foreground'
