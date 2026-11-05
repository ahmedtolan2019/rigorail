import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { CircleAlert, RotateCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './button'
import { Alert, AlertDescription, AlertTitle } from './alert'
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from './empty'
import { Illustration } from './illustration'
import { errorFeedback } from '../api/error-feedback'
import { reportError } from '../observability/report'

const titles = {
  error: 'error',
  offline: 'offlineTitle',
  'not-found': 'notFound',
  'access-denied': 'denied',
} as const

/**
 * Shows a translated failure category, never raw backend text.
 * `inline` (default) for errors inside a form, card or panel; `page` when the
 * error replaces a page's main content, with an illustration that fits the cause.
 */
export function Failure({
  error,
  retry,
  layout = 'inline',
}: {
  error: unknown
  retry?: () => void
  layout?: 'inline' | 'page'
}) {
  const { t } = useTranslation()
  const feedback = errorFeedback(error)
  const action = retry && feedback.retryable && (
    <Button
      variant="outline"
      size={layout === 'page' ? 'default' : 'sm'}
      className={layout === 'page' ? undefined : 'mt-2'}
      onClick={retry}
    >
      <RotateCw data-icon="inline-start" />
      {t('retry')}
    </Button>
  )
  if (layout === 'page')
    return (
      <Empty role="alert" className="min-h-[55vh]">
        <EmptyHeader>
          <EmptyMedia>
            <Illustration name={feedback.kind} />
          </EmptyMedia>
          <EmptyTitle className="text-base">
            {t(titles[feedback.kind])}
          </EmptyTitle>
          <EmptyDescription>{t(feedback.message)}</EmptyDescription>
        </EmptyHeader>
        {action && <EmptyContent>{action}</EmptyContent>}
      </Empty>
    )
  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertTitle>{t('error')}</AlertTitle>
      <AlertDescription>
        <p>{t(feedback.message)}</p>
        {action}
      </AlertDescription>
    </Alert>
  )
}
export function RouteError({
  error,
  reset,
}: {
  error: unknown
  reset: () => void
}) {
  useEffect(() => reportError(error, { source: 'route' }), [error])
  return <Failure error={error} retry={reset} layout="page" />
}
export function NotFound() {
  const { t } = useTranslation()
  return (
    <Empty className="min-h-[60vh]">
      <EmptyHeader>
        <EmptyMedia>
          <Illustration name="not-found" />
        </EmptyMedia>
        <EmptyTitle className="text-base">{t('notFound')}</EmptyTitle>
        <EmptyDescription>{t('notFoundHint')}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link to="/">{t('home')}</Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}
