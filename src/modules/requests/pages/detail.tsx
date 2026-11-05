import { useState } from 'react'
import { Link, useParams, useSearch } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useServices } from '@/shared/api/services'
import { AccessBoundary } from '@/shared/auth/access'
import { ApiError } from '@/shared/api/client'
import { money, date } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Failure } from '@/shared/ui/route-feedback'
import { permissions } from '../permissions'
import { detailOptions, requestKeys } from '../queries'
import { requestSchema, requestSearch } from '../schema'
export default function RequestDetail() {
  return (
    <AccessBoundary
      flag="requests"
      entitlement="requests"
      action={permissions.read}
    >
      <Detail />
    </AccessBoundary>
  )
}
function Detail() {
  const { t } = useTranslation(),
    services = useServices(),
    client = useQueryClient()
  const { requestId = '' } = useParams({ strict: false }),
    search = requestSearch.parse(useSearch({ strict: false }))
  const query = useQuery(
    detailOptions(services.api, services.session.workspace.id, requestId),
  )
  const [notice, setNotice] = useState('')
  const mutation = useMutation({
    mutationFn: (action: 'submit' | 'approve') =>
      services.api.request(
        `/requests/${encodeURIComponent(requestId)}/${action}`,
        requestSchema,
        {
          method: 'POST',
          body: JSON.stringify({ version: query.data?.version }),
        },
      ),
    onSuccess: async (_, action) => {
      setNotice(action === 'approve' ? 'approvalDone' : 'submitted')
      await client.invalidateQueries({
        queryKey: requestKeys.all(services.session.workspace.id),
      })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 403)
        void services.refreshSession()
    },
  })
  if (query.isPending) return <p role="status">{t('loading')}</p>
  if (query.isError)
    return <Failure error={query.error} retry={() => void query.refetch()} />
  const item = query.data
  return (
    <>
      <Link className="back-link" to="/requests" search={search}>
        {t('back')}
      </Link>
      <div className="page-heading">
        <div>
          <h1 dir="auto">{item.title}</h1>
          <p>{t('details')}</p>
        </div>
        <Badge variant="secondary" data-status={item.status}>
          {t(item.status)}
        </Badge>
      </div>
      <dl className="detail-grid">
        <div>
          <dt>{t('owner')}</dt>
          <dd>
            <bdi>{item.ownerName}</bdi>
          </dd>
        </div>
        <div>
          <dt>{t('amount')}</dt>
          <dd>
            <bdi>{money(item.amountMinor)}</bdi>
          </dd>
        </div>
        <div>
          <dt>{t('updated')}</dt>
          <dd>{date(item.updatedAt)}</dd>
        </div>
        <div>
          <dt>{t('status')}</dt>
          <dd>{t(item.status)}</dd>
        </div>
      </dl>
      <section className="description">
        <h2>{t('description')}</h2>
        <p dir="auto">{item.description || t('noDescription')}</p>
      </section>
      {mutation.isError && (
        <Failure
          error={mutation.error}
          retry={() => {
            mutation.reset()
            void query.refetch()
          }}
        />
      )}
      <p role="status">{notice ? t(notice) : ''}</p>
      <div className="action-row" aria-label={t('actions')}>
        {item.status === 'draft' &&
          services.access.decide(permissions.edit, item).status ===
            'allowed' && (
            <Button asChild variant="outline">
              <Link
                to="/requests/$requestId/edit"
                params={{ requestId }}
                search={search}
              >
                {t('edit')}
              </Link>
            </Button>
          )}
        {item.status === 'draft' && (
          <Button
            disabled={
              mutation.isPending ||
              services.access.decide(permissions.submit, item).status !==
                'allowed'
            }
            onClick={() => mutation.mutate('submit')}
          >
            {t(mutation.isPending ? 'saving' : 'submit')}
          </Button>
        )}
        {item.status === 'pending' && (
          <Button
            disabled={
              mutation.isPending ||
              services.access.decide(permissions.approve, item).status !==
                'allowed'
            }
            onClick={() => mutation.mutate('approve')}
          >
            {t(mutation.isPending ? 'saving' : 'approve')}
          </Button>
        )}
      </div>
      {((item.status === 'draft' &&
        services.access.decide(permissions.submit, item).status !==
          'allowed') ||
        (item.status === 'pending' &&
          services.access.decide(permissions.approve, item).status !==
            'allowed')) && <p className="muted">{t('deniedHint')}</p>}
      <p className="muted">{t('version', { version: item.version })}</p>
    </>
  )
}
