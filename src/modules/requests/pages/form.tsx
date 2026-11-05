import { useState } from 'react'
import {
  useParams,
  useNavigate,
  useSearch,
  Link,
  useBlocker,
} from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useServices } from '@/shared/api/services'
import { AccessBoundary } from '@/shared/auth/access'
import { useConfiguration, selectRequestLimit } from '@/shared/config/business'
import { ApiError } from '@/shared/api/client'
import { money, normalizeNumber, getCurrency } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
  FieldGroup,
} from '@/shared/ui/field'
import { Failure } from '@/shared/ui/route-feedback'
import { permissions } from '../permissions'
import { detailOptions, requestKeys } from '../queries'
import {
  requestInput,
  requestSchema,
  requestSearch,
  toMinorUnits,
  type RequestRecord,
  type RequestInput,
} from '../schema'
import { AiSuggestion } from '../ai-suggestion'
export default function RequestForm() {
  const { requestId } = useParams({ strict: false }),
    { api, session } = useServices(),
    { t } = useTranslation()
  const query = useQuery({
    ...detailOptions(api, session.workspace.id, requestId ?? ''),
    enabled: Boolean(requestId),
  })
  if (requestId && query.isPending) return <p role="status">{t('loading')}</p>
  if (requestId && query.isError && !query.data)
    return <Failure error={query.error} retry={() => void query.refetch()} />
  return (
    <>
      {query.isError && (
        <Failure error={query.error} retry={() => void query.refetch()} />
      )}
      <AccessBoundary
        flag="requests"
        entitlement="requests"
        action={requestId ? permissions.edit : permissions.create}
        resource={query.data}
        quota={requestId ? undefined : 'requests.create'}
      >
        <FormContent key={requestId ?? 'new'} record={query.data} />
      </AccessBoundary>
    </>
  )
}
function FormContent({ record }: { record?: RequestRecord }) {
  const { t } = useTranslation(),
    services = useServices(),
    client = useQueryClient(),
    navigate = useNavigate()
  const search = requestSearch.parse(useSearch({ strict: false }))
  const limit = useConfiguration(selectRequestLimit)
  const editable = !record || record.status === 'draft'
  const [serverError, setServerError] = useState<unknown>(null)
  const form = useForm<RequestInput>({
    resolver: zodResolver(requestInput),
    defaultValues: {
      title: record?.title ?? '',
      description: record?.description ?? '',
      amount: record ? (record.amountMinor / 100).toFixed(2) : '',
    },
  })
  const [baseVersion] = useState(record?.version)
  const title = useWatch({ control: form.control, name: 'title' })
  const dirty = form.formState.isDirty

  const mutation = useMutation({
    mutationFn: (values: RequestInput) =>
      services.api.request(
        record ? `/requests/${encodeURIComponent(record.id)}` : '/requests',
        requestSchema,
        {
          method: record ? 'PATCH' : 'POST',
          body: JSON.stringify({
            ...values,
            ...(record ? { version: baseVersion } : {}),
          }),
        },
      ),
  })
  useBlocker({
    shouldBlockFn: () =>
      mutation.isPending || (dirty && !window.confirm(t('unsaved'))),
    enableBeforeUnload: dirty || mutation.isPending,
  })
  async function save(values: RequestInput) {
    setServerError(null)
    if (!editable) {
      setServerError(new ApiError('Record changed', 409, 'conflict'))
      return
    }
    if (!limit.isSuccess) {
      setServerError(new Error('Configuration unavailable'))
      return
    }
    if (toMinorUnits(values.amount) > limit.data) {
      form.setError('amount', { message: 'limit' }, { shouldFocus: true })
      return
    }
    try {
      const result = await mutation.mutateAsync(values)
      form.reset(values)
      await client.invalidateQueries({
        queryKey: requestKeys.all(services.session.workspace.id),
      })
      await client.invalidateQueries({ queryKey: ['configuration'] })
      await client.invalidateQueries({ queryKey: ['capabilities'] })
      await navigate({
        to: '/requests/$requestId',
        params: { requestId: result.id },
        search,
        ignoreBlocker: true,
      })
    } catch (error) {
      setServerError(error)
      if (error instanceof ApiError && error.fields.amount)
        form.setError('amount', { message: 'limit' }, { shouldFocus: true })
      if (error instanceof ApiError && error.status === 403)
        void services.refreshSession()
    }
  }
  const errors = form.formState.errors
  return (
    <>
      <Link className="back-link" to="/requests" search={search}>
        {t('back')}
      </Link>
      <div className="page-heading">
        <div>
          <h1>{t(record ? 'edit' : 'newRequest')}</h1>
          <p>{t('formHint')}</p>
        </div>
      </div>
      <form
        className="request-form"
        noValidate
        onSubmit={form.handleSubmit(save)}
      >
        {serverError !== null && <Failure error={serverError} />}
        {serverError instanceof ApiError && serverError.status === 409 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (window.confirm(t('confirmReload'))) window.location.reload()
            }}
          >
            {t('reload')}
          </Button>
        )}
        {Object.keys(errors).length > 0 && (
          <p role="alert">{t('formErrors')}</p>
        )}
        {!editable && <p role="alert">{t('conflict')}</p>}
        <FieldGroup>
          <Field data-invalid={Boolean(errors.title)}>
            <FieldLabel htmlFor="request-title">{t('title')}</FieldLabel>
            <Input
              id="request-title"
              readOnly={!editable || mutation.isPending}
              dir="auto"
              autoComplete="off"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'title-error' : undefined}
              {...form.register('title')}
            />
            {errors.title && (
              <FieldError id="title-error">{t('requiredTitle')}</FieldError>
            )}
          </Field>
          <Field data-invalid={Boolean(errors.amount)}>
            <FieldLabel htmlFor="request-amount">{t('amount')}</FieldLabel>
            <Input
              id="request-amount"
              readOnly={!editable || mutation.isPending}
              inputMode="decimal"
              dir="ltr"
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={
                errors.amount ? 'amount-hint amount-error' : 'amount-hint'
              }
              {...form.register('amount', { setValueAs: normalizeNumber })}
            />
            <FieldDescription id="amount-hint">
              {t('amountHint', { currency: getCurrency() })}{' '}
              {limit.isSuccess && t('limitHint', { amount: money(limit.data) })}
            </FieldDescription>
            {errors.amount && (
              <FieldError id="amount-error">
                {t(
                  errors.amount.message === 'limit'
                    ? 'limitError'
                    : 'invalidAmount',
                )}
              </FieldError>
            )}
          </Field>
          <Field data-invalid={Boolean(errors.description)}>
            <FieldLabel htmlFor="request-description">
              {t('description')}
            </FieldLabel>
            <Textarea
              id="request-description"
              readOnly={!editable || mutation.isPending}
              dir="auto"
              rows={5}
              aria-invalid={Boolean(errors.description)}
              {...form.register('description')}
            />
            {errors.description && (
              <FieldError>{t('descriptionLong')}</FieldError>
            )}
          </Field>
        </FieldGroup>
        {editable && !mutation.isPending && (
          <AiSuggestion
            title={title}
            onApply={(text) =>
              form.setValue('description', text, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        )}
        {limit.isError && (
          <Failure error={limit.error} retry={() => void limit.refetch()} />
        )}
        <div className="form-footer">
          <div className="action-row">
            <Button
              type="submit"
              disabled={!editable || mutation.isPending || !limit.isSuccess}
            >
              {t(mutation.isPending ? 'saving' : 'save')}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/requests" search={search}>
                {t('cancel')}
              </Link>
            </Button>
          </div>
          <span role="status" className="muted">
            {dirty ? t('unsavedLabel') : ''}
          </span>
        </div>
      </form>
    </>
  )
}
