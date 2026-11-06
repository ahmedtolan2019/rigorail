import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import type { Resource } from './model'
import { useCapability } from '../capabilities/hooks'
import type { Requirements } from '../capabilities/model'
import { RotateCw } from 'lucide-react'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '../ui/empty'
import { Button } from '../ui/button'
import { PageSkeleton } from '../ui/page'
import { Illustration } from '../ui/illustration'

export function AccessBoundary({
  action,
  resource,
  children,
  ...requirements
}: Requirements & {
  action: string
  resource?: Resource
  children: ReactNode
}) {
  const decision = useCapability({ ...requirements, action, resource }),
    { t } = useTranslation(),
    client = useQueryClient()
  const [hasAllowed, setHasAllowed] = useState(false)
  useEffect(() => {
    if (decision.status === 'allowed') setHasAllowed(true)
    if (decision.status === 'denied') setHasAllowed(false)
  }, [decision.status])
  const allowed = decision.status === 'allowed'
  const preserve =
    hasAllowed && (decision.status === 'error' || decision.status === 'loading')
  return (
    <>
      {!allowed && decision.status === 'loading' && !preserve && (
        <PageSkeleton />
      )}
      {!allowed && decision.status !== 'loading' && (
        <Empty role="status" className="min-h-[55vh]">
          <EmptyHeader>
            <EmptyMedia>
              <Illustration
                name={decision.status === 'error' ? 'error' : 'access-denied'}
              />
            </EmptyMedia>
            <EmptyTitle>{t('denied')}</EmptyTitle>
            <EmptyDescription>{t(decision.reason)}</EmptyDescription>
          </EmptyHeader>
          {decision.status === 'error' && (
            <EmptyContent>
              <Button
                variant="outline"
                onClick={() =>
                  void client.invalidateQueries({ queryKey: ['capabilities'] })
                }
              >
                <RotateCw data-icon="inline-start" />
                {t('retry')}
              </Button>
            </EmptyContent>
          )}
        </Empty>
      )}
      {(allowed || preserve) && (
        <div hidden={!allowed} inert={!allowed}>
          {children}
        </div>
      )}
    </>
  )
}
