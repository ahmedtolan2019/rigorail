import { Failure } from '@/shared/ui/route-feedback'
import { LoadingState } from '@/shared/ui/loading-state'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useCapabilities } from '@/shared/capabilities/hooks'
import { useServices } from '@/shared/api/services'
import { useConfiguration } from '@/shared/config/business'
import { Field, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select'
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '@/shared/ui/table'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { money } from '@/shared/lib/format'
export default function Access() {
  const { t } = useTranslation(),
    services = useServices(),
    configuration = useConfiguration((value) => value),
    capabilities = useCapabilities((value) => value),
    client = useQueryClient()
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{t('access')}</h1>
          <p>{t('accessSubtitle')}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            void services.refreshSession()
            void client.invalidateQueries({ queryKey: ['configuration'] })
            void client.invalidateQueries({ queryKey: ['capabilities'] })
          }}
        >
          {t('refresh')}
        </Button>
      </div>
      {services.demo && (
        <section className="settings-form">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="persona">{t('persona')}</FieldLabel>
              <NativeSelect
                id="persona"
                value={services.demo.persona}
                onChange={(event) =>
                  services.demo?.setPersona(event.target.value)
                }
              >
                {['manager', 'editor', 'viewer'].map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {t(value)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="workspace">
                {t('activeWorkspace')}
              </FieldLabel>
              <NativeSelect
                id="workspace"
                value={services.demo.workspace}
                onChange={(event) =>
                  services.demo?.setWorkspace(event.target.value)
                }
              >
                {['north', 'south'].map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {t(value)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="plan">{t('subscription')}</FieldLabel>
              <NativeSelect
                id="plan"
                value={services.demo.plan}
                onChange={(event) => services.demo?.setPlan(event.target.value)}
              >
                {['pro', 'starter', 'none'].map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {t(value)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="flag">{t('requestFlag')}</FieldLabel>
              <NativeSelect
                id="flag"
                value={String(services.demo.requestsEnabled)}
                onChange={(event) =>
                  services.demo?.setRequestsEnabled(
                    event.target.value === 'true',
                  )
                }
              >
                <NativeSelectOption value="true">
                  {t('enabled')}
                </NativeSelectOption>
                <NativeSelectOption value="false">
                  {t('disabled')}
                </NativeSelectOption>
              </NativeSelect>
            </Field>
          </FieldGroup>
          <p className="muted">{t('personaHint')}</p>
        </section>
      )}
      <div className="data-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('permission')}</TableHead>
              <TableHead>{t('decision')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.catalog.map((item) => (
              <TableRow key={item.action}>
                <TableCell>
                  <strong>{t(item.labelKey)}</strong>
                  <code className="permission-code" dir="ltr">
                    {item.action}
                  </code>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {item.resource
                      ? t('recordRequired')
                      : services.access.decide(item.action).status === 'allowed'
                        ? t('allowed')
                        : t('denied')}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <section className="description">
        <h2>{t('subscription')}</h2>
        <p>{t('subscriptionHint')}</p>
        {capabilities.isPending ? (
          <p role="status">{t('loading')}</p>
        ) : capabilities.isError ? (
          <p role="alert">{t('unavailable')}</p>
        ) : (
          <>
            <p>
              {t('planLabel', {
                plan: t(capabilities.data.subscription.plan),
                status: t(
                  capabilities.data.subscription.status === 'cancelled'
                    ? 'cancelledSubscription'
                    : capabilities.data.subscription.status,
                ),
              })}
            </p>
            {Object.keys(capabilities.data.quotas).length === 0 ? (
              <p>{t('usageUnavailable')}</p>
            ) : (
              <ul>
                {Object.entries(capabilities.data.quotas).map(
                  ([key, quota]) => (
                    <li key={key}>
                      <code dir="ltr">{key}</code>:{' '}
                      {t('usageCount', {
                        used: quota.used,
                        limit:
                          quota.limit === null ? t('unlimited') : quota.limit,
                      })}
                    </li>
                  ),
                )}
              </ul>
            )}
          </>
        )}
      </section>
      <section className="description">
        <h2>{t('configuration')}</h2>
        <p>{t('configurationHint')}</p>
        {configuration.isPending && <LoadingState />}
        {configuration.isError && (
          <Failure
            error={configuration.error}
            retry={() => void configuration.refetch()}
          />
        )}
        {configuration.data && (
          <p>
            {t('limitHint', {
              amount: money(configuration.data.limits.requestAmountMinor),
            })}
          </p>
        )}
      </section>
    </>
  )
}
