import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import type { Resource } from './model'
import { useCapability } from '../capabilities/hooks'
import type { Requirements } from '../capabilities/model'
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '../ui/empty'
import { Button } from '../ui/button'

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
      {!allowed && (
        <Empty role="status">
          <EmptyHeader>
            <EmptyTitle>
              {t(decision.status === 'loading' ? 'loading' : 'denied')}
            </EmptyTitle>
            <EmptyDescription>{t(decision.reason)}</EmptyDescription>
          </EmptyHeader>
          {decision.status === 'error' && (
            <EmptyContent>
              <Button
                onClick={() =>
                  void client.invalidateQueries({ queryKey: ['capabilities'] })
                }
              >
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
