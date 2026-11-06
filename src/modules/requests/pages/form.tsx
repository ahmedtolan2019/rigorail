import { useState } from 'react'
import {
  getRouteApi,
  useParams,
  useNavigate,
  Link,
  useBlocker,
} from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowLeft, CircleAlert, RotateCw } from 'lucide-react'
import { useServices } from '@/shared/api/services'
import { AccessBoundary } from '@/shared/auth/access'
import { useConfiguration, selectRequestLimit } from '@/shared/config/business'
import { ApiError } from '@/shared/api/client'
import { money, normalizeNumber, getCurrency } from '@/shared/lib/format'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/shared/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Spinner } from '@/shared/ui/spinner'
import { Textarea } from '@/shared/ui/textarea'
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
  FieldGroup,
} from '@/shared/ui/field'
import { Failure } from '@/shared/ui/route-feedback'
import { DetailSkeleton, PageHeader, backLinkClass } from '@/shared/ui/page'
import { permissions } from '../permissions'
import { detailOptions, requestKeys, saveRequest } from '../queries'
import {
  requestCategories,
  requestInput,
  toMinorUnits,
  type RequestRecord,
  type RequestInput,
} from '../schema'
import { AiSuggestion } from '../ai-suggestion'
import { categoryIcons } from '../categories'
import { ns } from '../i18n'

// Shared by /requests/new and /requests/$requestId/edit; list search lives on the parent.
const listRoute = getRouteApi('/requests')
export default function RequestForm() {
  const { requestId } = useParams({ strict: false }),
    { api, session } = useServices()
  const query = useQuery({
    ...detailOptions(api, session.workspace.id, requestId ?? ''),
    enabled: Boolean(requestId),
  })
  if (requestId && query.isPending) return <DetailSkeleton />
  if (requestId && query.isError && !query.data)
    return (
      <Failure
        error={query.error}
        retry={() => void query.refetch()}
        layout="page"
      />
    )
  return (
    <>
      {query.isError && (
        <div className="mb-6">
          <Failure error={query.error} retry={() => void query.refetch()} />
        </div>
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
  const { t } = useTranslation(ns),
    services = useServices(),
    client = useQueryClient(),
    navigate = useNavigate()
  const search = listRoute.useSearch()
  const limit = useConfiguration(selectRequestLimit)
  const editable = !record || record.status === 'draft'
  const [serverError, setServerError] = useState<unknown>(null)
  const [confirmReload, setConfirmReload] = useState(false)
  const form = useForm<RequestInput>({
    resolver: zodResolver(requestInput),
    defaultValues: {
      title: record?.title ?? '',
      category: record?.category ?? 'equipment',
      description: record?.description ?? '',
      amount: record ? (record.amountMinor / 100).toFixed(2) : '',
    },
  })
  const [baseVersion] = useState(record?.version)
  const title = useWatch({ control: form.control, name: 'title' })
  const dirty = form.formState.isDirty

  const mutation = useMutation({
    mutationFn: (values: RequestInput) =>
      saveRequest(
        services.api,
        values,
        record && baseVersion !== undefined
          ? { id: record.id, version: baseVersion }
          : undefined,
      ),
  })
  // In-app navigation asks with an accessible dialog; closing the tab uses the browser prompt.
  const blocker = useBlocker({
    shouldBlockFn: () => mutation.isPending || dirty,
    enableBeforeUnload: () => dirty || mutation.isPending,
    withResolver: true,
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
      toast.success(t('saved'))
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
  const locked = !editable || mutation.isPending
  return (
    <>
      <Link className={backLinkClass} to="/requests" search={search}>
        <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
        {t('back')}
      </Link>
      <PageHeader
        title={t(record ? 'edit' : 'newRequest')}
        description={t('formHint')}
      />
      <form
        className="flex max-w-3xl flex-col gap-6"
        noValidate
        onSubmit={form.handleSubmit(save)}
      >
        {serverError !== null && (
          <div className="flex flex-col gap-3">
            <Failure error={serverError} />
            {serverError instanceof ApiError && serverError.status === 409 && (
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                onClick={() => setConfirmReload(true)}
              >
                <RotateCw data-icon="inline-start" />
                {t('reload')}
              </Button>
            )}
          </div>
        )}
        {Object.keys(errors).length > 0 && (
          <Alert variant="destructive" role="alert">
            <CircleAlert />
            <AlertTitle>{t('formErrors')}</AlertTitle>
          </Alert>
        )}
        {!editable && (
          <Alert role="alert">
            <CircleAlert />
            <AlertDescription>{t('conflict')}</AlertDescription>
          </Alert>
        )}
        <Card>
          <CardHeader>
            <CardTitle>{t('basics')}</CardTitle>
            <CardDescription>{t('basicsHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={Boolean(errors.title)}>
                <FieldLabel htmlFor="request-title">{t('title')}</FieldLabel>
                <Input
                  id="request-title"
                  readOnly={locked}
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
              <div className="grid gap-6 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="request-category">
                    {t('category')}
                  </FieldLabel>
                  <Controller
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={locked}
                      >
                        <SelectTrigger
                          id="request-category"
                          className="w-full"
                          onBlur={field.onBlur}
                        >
                          <SelectValue placeholder={t('categoryPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {requestCategories.map((category) => {
                            const Icon = categoryIcons[category]
                            return (
                              <SelectItem key={category} value={category}>
                                <Icon />
                                {t(category)}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field data-invalid={Boolean(errors.amount)}>
                  <FieldLabel htmlFor="request-amount">
                    {t('amount')}
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <InputGroupText>{getCurrency()}</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      id="request-amount"
                      readOnly={locked}
                      inputMode="decimal"
                      dir="ltr"
                      className="tabular-nums"
                      aria-invalid={Boolean(errors.amount)}
                      aria-describedby={
                        errors.amount
                          ? 'amount-hint amount-error'
                          : 'amount-hint'
                      }
                      {...form.register('amount', {
                        setValueAs: normalizeNumber,
                      })}
                    />
                  </InputGroup>
                  <FieldDescription id="amount-hint">
                    {t('amountHint', { currency: getCurrency() })}{' '}
                    {limit.isSuccess &&
                      t('limitHint', { amount: money(limit.data) })}
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
              </div>
            </FieldGroup>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('detailsSection')}</CardTitle>
            <CardDescription>{t('detailsHint')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <Field data-invalid={Boolean(errors.description)}>
              <FieldLabel htmlFor="request-description">
                {t('description')}
              </FieldLabel>
              <Textarea
                id="request-description"
                readOnly={locked}
                dir="auto"
                rows={6}
                aria-invalid={Boolean(errors.description)}
                {...form.register('description')}
              />
              {errors.description && (
                <FieldError>{t('descriptionLong')}</FieldError>
              )}
            </Field>
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
          </CardContent>
        </Card>
        {limit.isError && (
          <Failure error={limit.error} retry={() => void limit.refetch()} />
        )}
        <div className="sticky bottom-0 z-10 -mx-(--page-space) flex flex-wrap items-center justify-between gap-3 border-t bg-background/95 px-(--page-space) py-3 sm:bottom-4 sm:mx-0 sm:rounded-xl sm:border sm:px-4 sm:shadow-lg">
          <span
            role="status"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            {dirty && (
              <>
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-warning"
                />
                {t('unsavedLabel')}
              </>
            )}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/requests" search={search}>
                {t('cancel')}
              </Link>
            </Button>
            <Button
              type="submit"
              disabled={!editable || mutation.isPending || !limit.isSuccess}
            >
              {mutation.isPending && <Spinner data-icon="inline-start" />}
              {t(mutation.isPending ? 'saving' : 'save')}
            </Button>
          </div>
        </div>
      </form>
      <AlertDialog
        open={blocker.status === 'blocked'}
        onOpenChange={(open) => !open && blocker.reset?.()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('leaveTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('unsaved')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>
              {t('stay')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => blocker.proceed?.()}
            >
              {t('leave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmReload} onOpenChange={setConfirmReload}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('reload')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmReload')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('stay')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => window.location.reload()}>
              {t('reload')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
