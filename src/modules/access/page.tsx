import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CircleCheck, CircleMinus, FileLock2, RefreshCw } from 'lucide-react'
import { Failure } from '@/shared/ui/route-feedback'
import { useCapabilities } from '@/shared/capabilities/hooks'
import { useServices } from '@/shared/api/services'
import { useConfiguration } from '@/shared/config/business'
import { money } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Field, FieldLabel } from '@/shared/ui/field'
import { PageHeader } from '@/shared/ui/page'
import { Progress } from '@/shared/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { ns } from './i18n'

export default function Access() {
  const { t } = useTranslation(ns),
    services = useServices(),
    configuration = useConfiguration((value) => value),
    capabilities = useCapabilities((value) => value),
    client = useQueryClient()
  // Quotas are keyed by the action they limit; show that action's label, not the key.
  const quotaLabel = (key: string) => {
    const definition = services.catalog.find((item) => item.action === key)
    return definition ? t(definition.labelKey) : t('usageQuota')
  }
  const demo = services.demo
  const controls = demo
    ? [
        {
          id: 'persona',
          label: t('persona'),
          value: demo.persona,
          set: demo.setPersona,
          options: ['manager', 'editor', 'viewer'],
        },
        {
          id: 'workspace',
          label: t('activeWorkspace'),
          value: demo.workspace,
          set: demo.setWorkspace,
          options: ['north', 'south'],
        },
        {
          id: 'plan',
          label: t('subscription'),
          value: demo.plan,
          set: demo.setPlan,
          options: ['pro', 'starter', 'none'],
        },
        {
          id: 'flag',
          label: t('requestFlag'),
          value: String(demo.requestsEnabled),
          set: (value: string) => demo.setRequestsEnabled(value === 'true'),
          options: ['true', 'false'],
          labels: { true: t('enabled'), false: t('disabled') } as Record<
            string,
            string
          >,
        },
      ]
    : []
  return (
    <>
      <PageHeader
        title={t('navigation')}
        description={t('accessSubtitle')}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              void services.refreshSession()
              void client.invalidateQueries({ queryKey: ['configuration'] })
              void client
                .invalidateQueries({ queryKey: ['capabilities'] })
                .then(() => toast.success(t('refreshed')))
            }}
          >
            <RefreshCw data-icon="inline-start" />
            {t('refresh')}
          </Button>
        }
      />
      <div className="grid gap-6">
        {demo && (
          <Card>
            <CardHeader>
              <CardTitle>{t('demoControls')}</CardTitle>
              <CardDescription>{t('personaHint')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {controls.map((control) => (
                <Field key={control.id}>
                  <FieldLabel htmlFor={control.id}>{control.label}</FieldLabel>
                  <Select value={control.value} onValueChange={control.set}>
                    <SelectTrigger id={control.id} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {control.options.map((value) => (
                        <SelectItem key={value} value={value}>
                          {control.labels?.[value] ?? t(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ))}
            </CardContent>
          </Card>
        )}
        <Card className="gap-0 pb-0">
          <CardHeader className="border-b pb-6">
            <CardTitle>{t('permissionsTitle')}</CardTitle>
            <CardDescription>{t('permissionsHint')}</CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="ps-6">{t('permission')}</TableHead>
                <TableHead className="pe-6 text-end">{t('decision')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.catalog.map((item) => {
                const decision = item.resource
                  ? 'record'
                  : services.access.decide(item.action).status === 'allowed'
                    ? 'allowed'
                    : 'denied'
                const Icon =
                  decision === 'allowed'
                    ? CircleCheck
                    : decision === 'record'
                      ? FileLock2
                      : CircleMinus
                return (
                  <TableRow key={item.action}>
                    <TableCell className="ps-6 py-3">
                      <span className="block font-medium">
                        {t(item.labelKey)}
                      </span>
                    </TableCell>
                    <TableCell className="pe-6 text-end">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'gap-1 rounded-full border-0',
                          decision === 'allowed' &&
                            'bg-success/12 text-success',
                          decision === 'record' && 'bg-info/12 text-info',
                        )}
                      >
                        <Icon aria-hidden="true" />
                        {t(decision === 'record' ? 'recordRequired' : decision)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('subscription')}</CardTitle>
              <CardDescription>{t('subscriptionHint')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {capabilities.isPending ? (
                <div
                  role="status"
                  aria-label={t('loading')}
                  className="grid gap-3"
                >
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ) : capabilities.isError ? (
                <Failure
                  error={capabilities.error}
                  retry={() => void capabilities.refetch()}
                />
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
                    <p className="text-sm text-muted-foreground">
                      {t('usageUnavailable')}
                    </p>
                  ) : (
                    <ul className="grid gap-4">
                      {Object.entries(capabilities.data.quotas).map(
                        ([key, quota]) => (
                          <li key={key} className="grid gap-2">
                            <span className="flex items-center justify-between gap-3 text-sm">
                              <span className="font-medium">
                                {quotaLabel(key)}
                              </span>
                              <span className="tabular-nums text-muted-foreground">
                                {t('usageCount', {
                                  used: quota.used,
                                  limit:
                                    quota.limit === null
                                      ? t('unlimited')
                                      : quota.limit,
                                })}
                              </span>
                            </span>
                            <Progress
                              aria-label={quotaLabel(key)}
                              value={
                                quota.limit === null
                                  ? 0
                                  : quota.limit === 0
                                    ? 100
                                    : Math.min(
                                        100,
                                        (quota.used / quota.limit) * 100,
                                      )
                              }
                            />
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('configuration')}</CardTitle>
              <CardDescription>{t('configurationHint')}</CardDescription>
            </CardHeader>
            <CardContent>
              {configuration.isPending && (
                <Skeleton
                  role="status"
                  aria-label={t('loading')}
                  className="h-5 w-56"
                />
              )}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
