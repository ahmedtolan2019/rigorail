import { useState } from 'react'
import { Link, getRouteApi } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Pencil,
  Printer,
  Send,
} from 'lucide-react'
import { useServices } from '@/shared/api/services'
import { useDocumentTitle } from '@/shared/hooks/use-document-title'
import { AccessBoundary } from '@/shared/auth/access'
import { ApiError } from '@/shared/api/client'
import { date, money, relativeDate } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { DetailSkeleton, backLinkClass } from '@/shared/ui/page'
import { Failure } from '@/shared/ui/route-feedback'
import { Spinner } from '@/shared/ui/spinner'
import {
  PrintDocument,
  PrintFields,
  PrintSection,
  PrintSignatures,
} from '@/shared/print/print-document'
import { PrintPreview } from '@/shared/print/print-preview'
import { ConfirmAction } from '@/shared/ui/confirm-action'
import { FileUpload } from '@/shared/uploads/file-upload'
import type { Attachment } from '@/shared/uploads/model'
import { permissions } from '../permissions'
import {
  attachToRequest,
  detailOptions,
  removeRequestAttachment,
  requestKeys,
  runRequestAction,
} from '../queries'
import { requestStatuses, type RequestRecord } from '../schema'
import { ns } from '../i18n'
import { CategoryLabel, Person, StatusBadge } from '../presentation'

const route = getRouteApi('/requests/$requestId')
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
  const { t } = useTranslation(ns),
    services = useServices(),
    client = useQueryClient()
  const { requestId } = route.useParams(),
    search = route.useSearch()
  const query = useQuery(
    detailOptions(services.api, services.session.workspace.id, requestId),
  )
  useDocumentTitle(query.data?.title, t('navigation'))
  const mutation = useMutation({
    mutationFn: (action: 'submit' | 'approve') =>
      runRequestAction(services.api, requestId, action, query.data!.version),
    onSuccess: async (_, action) => {
      toast.success(t(action === 'approve' ? 'approvalDone' : 'submitted'))
      await client.invalidateQueries({
        queryKey: requestKeys.all(services.session.workspace.id),
      })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 403)
        void services.refreshSession()
    },
  })
  const [printing, setPrinting] = useState(false)
  if (query.isPending) return <DetailSkeleton />
  if (query.isError)
    return (
      <Failure
        error={query.error}
        retry={() => void query.refetch()}
        layout="page"
      />
    )
  const item = query.data
  const can = (action: string) =>
    services.access.decide(action, item).status === 'allowed'
  const next =
    item.status === 'draft'
      ? {
          action: 'submit' as const,
          icon: Send,
          allowed: can(permissions.submit),
        }
      : item.status === 'pending'
        ? {
            action: 'approve' as const,
            icon: CheckCheck,
            allowed: can(permissions.approve),
          }
        : undefined
  return (
    <>
      <Link className={backLinkClass} to="/requests" search={search}>
        <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
        {t('back')}
      </Link>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 dir="auto">{item.title}</h1>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <span
              dir="ltr"
              className="font-medium text-foreground tabular-nums"
            >
              {item.reference}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {t('created_at', { date: relativeDate(item.createdAt) })}
            </span>
          </p>
        </div>
        <div
          className="flex shrink-0 flex-wrap items-center gap-2"
          aria-label={t('actions')}
          role="group"
          data-print="hide"
        >
          <Button variant="ghost" onClick={() => setPrinting(true)}>
            <Printer data-icon="inline-start" />
            {t('common:print')}
          </Button>
          {item.status === 'draft' && can(permissions.edit) && (
            <Button asChild variant="outline">
              <Link
                to="/requests/$requestId/edit"
                params={{ requestId }}
                search={search}
              >
                <Pencil data-icon="inline-start" />
                {t('edit')}
              </Link>
            </Button>
          )}
          {next && (
            // Submitting is routine; approval is final, so it asks first.
            <MaybeConfirm
              confirm={next.action === 'approve'}
              title={t('confirmApprove')}
              description={t('confirmApproveHint')}
              confirmLabel={t('approve')}
              icon={CheckCheck}
              irreversible
              details={[
                [t('reference'), <bdi key="ref">{item.reference}</bdi>],
                [t('title'), <bdi key="title">{item.title}</bdi>],
                [
                  t('amount'),
                  <bdi key="amount">{money(item.amountMinor)}</bdi>,
                ],
              ]}
              onConfirm={() => mutation.mutate(next.action)}
            >
              <Button
                disabled={mutation.isPending || !next.allowed}
                onClick={
                  next.action === 'approve'
                    ? undefined
                    : () => mutation.mutate(next.action)
                }
              >
                {mutation.isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <next.icon data-icon="inline-start" />
                )}
                {t(mutation.isPending ? 'saving' : next.action)}
              </Button>
            </MaybeConfirm>
          )}
        </div>
      </div>
      {next && !next.allowed && (
        <p className="-mt-3 mb-6 text-sm text-muted-foreground lg:text-end">
          {t('deniedHint')}
        </p>
      )}
      {mutation.isError && (
        <div className="mb-6">
          <Failure
            error={mutation.error}
            retry={() => {
              mutation.reset()
              void query.refetch()
            }}
          />
        </div>
      )}
      {printing && (
        <PrintPreview open onOpenChange={setPrinting} title={item.reference}>
          <PrintDocument
            title={item.title}
            subtitle={t('navigation')}
            reference={item.reference}
            status={t(item.status)}
          >
            <PrintFields
              columns={4}
              fields={[
                [t('category'), t(item.category)],
                [t('amount'), money(item.amountMinor)],
                [t('owner'), item.ownerName],
                [t('updated'), date(item.updatedAt)],
              ]}
            />
            <PrintSection title={t('description')}>
              <p className="whitespace-pre-wrap">{item.description}</p>
            </PrintSection>
            {item.attachments.length > 0 && (
              <PrintSection title={t('attachments')}>
                <ul className="list-disc ps-5">
                  {item.attachments.map((file) => (
                    <li key={file.id}>{file.name}</li>
                  ))}
                </ul>
              </PrintSection>
            )}
            <PrintSignatures roles={[t('owner'), t('approve')]} />
          </PrintDocument>
        </PrintPreview>
      )}
      <div className="grid gap-6 lg:grid-cols-3 print:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="flex flex-col gap-6 lg:col-span-2 print:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{t('description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                dir="auto"
                className="leading-relaxed wrap-anywhere whitespace-pre-wrap"
              >
                {item.description || (
                  <span className="text-muted-foreground">
                    {t('noDescription')}
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
          <Attachments item={item} canEdit={can(permissions.edit)} />
          <Card>
            <CardHeader>
              <CardTitle>{t('workflow')}</CardTitle>
              <CardDescription>{t('workflowHint')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Workflow status={item.status} />
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{t('summary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight">
              <bdi>{money(item.amountMinor)}</bdi>
            </p>
            <p className="text-sm text-muted-foreground">{t('amount')}</p>
            <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 border-t pt-5 text-sm [&_dd]:min-w-0 [&_dd]:text-end [&_dt]:text-muted-foreground">
              <dt>{t('category')}</dt>
              <dd>
                <CategoryLabel category={item.category} />
              </dd>
              <dt>{t('owner')}</dt>
              <dd>
                <Person id={item.ownerId} name={item.ownerName} />
              </dd>
              <dt>{t('created')}</dt>
              <dd>
                <time dateTime={item.createdAt}>{date(item.createdAt)}</time>
              </dd>
              <dt>{t('updated')}</dt>
              <dd>
                <time dateTime={item.updatedAt}>{date(item.updatedAt)}</time>
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

const stepKeys = {
  draft: 'stepDraft',
  pending: 'stepPending',
  approved: 'stepApproved',
} as const
function Workflow({ status }: { status: RequestRecord['status'] }) {
  const { t } = useTranslation(ns)
  const current = requestStatuses.indexOf(status)
  return (
    <ol className="flex items-center gap-2">
      {requestStatuses.map((step, index) => {
        const done = index < current || status === 'approved'
        const active = index === current
        return (
          <li
            key={step}
            aria-current={active ? 'step' : undefined}
            className="flex flex-1 items-center gap-2 last:flex-none"
          >
            <span
              className={cn(
                'grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors',
                done && 'border-primary bg-primary text-primary-foreground',
                active &&
                  !done &&
                  'border-primary text-primary ring-4 ring-primary/10',
                !done && !active && 'text-muted-foreground',
              )}
            >
              {done ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span
              className={cn(
                'text-sm whitespace-nowrap',
                active ? 'font-medium' : 'text-muted-foreground',
              )}
            >
              {t(stepKeys[step])}
            </span>
            {index < requestStatuses.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  'mx-1 h-px flex-1',
                  index < current ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function MaybeConfirm({
  confirm,
  children,
  ...props
}: React.ComponentProps<typeof ConfirmAction> & { confirm: boolean }) {
  return confirm ? (
    <ConfirmAction {...props}>{children}</ConfirmAction>
  ) : (
    children
  )
}

/** Files on the record. Uploads go to storage first, then attach by id. */
function Attachments({
  item,
  canEdit,
}: {
  item: RequestRecord
  canEdit: boolean
}) {
  const { t } = useTranslation(ns)
  const services = useServices(),
    client = useQueryClient()
  const scope = services.session.workspace.id
  const settle = async (record: RequestRecord) => {
    client.setQueryData(requestKeys.detail(scope, item.id), record)
    await client.invalidateQueries({
      queryKey: requestKeys.all(scope),
      refetchType: 'none',
    })
  }
  const attach = (file: Attachment) =>
    attachToRequest(services.api, item.id, file.id).then(settle)
  const remove = useMutation({
    mutationFn: (file: Attachment) =>
      removeRequestAttachment(services.api, item.id, file.id),
    onSuccess: async (record, file) => {
      await settle(record)
      toast(t('attachmentRemoved', { name: file.name }))
    },
    onError: () => toast.error(t('common:unavailable')),
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('attachments')}</CardTitle>
        <CardDescription>{t('attachmentsHint')}</CardDescription>
      </CardHeader>
      <CardContent>
        {canEdit ? (
          <FileUpload
            label={t('attachments')}
            value={item.attachments}
            accept={['application/pdf', 'image/*', '.xlsx', '.csv', '.docx']}
            acceptLabel={t('attachmentTypes')}
            onAdd={attach}
            onRemove={(file) => remove.mutate(file)}
          />
        ) : item.attachments.length ? (
          <FileUpload
            label={t('attachments')}
            value={item.attachments}
            readOnly
            onAdd={() => undefined}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{t('noAttachments')}</p>
        )}
      </CardContent>
    </Card>
  )
}
