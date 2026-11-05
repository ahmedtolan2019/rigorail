import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from './button'
import { Alert, AlertDescription, AlertTitle } from './alert'
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from './empty'
import { errorFeedback } from '../api/error-feedback'
export function Failure({
  error,
  retry,
}: {
  error: unknown
  retry?: () => void
}) {
  const { t } = useTranslation()
  const feedback = errorFeedback(error)
  return (
    <Alert variant="destructive">
      <AlertTitle>{t('error')}</AlertTitle>
      <AlertDescription>
        <p>{t(feedback.message)}</p>
        {retry && feedback.retryable && (
          <Button variant="outline" onClick={retry}>
            {t('retry')}
          </Button>
        )}
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
  return <Failure error={error} retry={reset} />
}
export function NotFound() {
  const { t } = useTranslation()
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{t('notFound')}</EmptyTitle>
        <EmptyDescription>{t('notFoundHint')}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link
            to="/requests"
            search={{ q: '', status: 'all', page: 1, sort: 'updated' }}
          >
            {t('home')}
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}
