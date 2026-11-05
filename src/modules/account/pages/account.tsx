import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { LogOut, Monitor, Smartphone, Tablet } from 'lucide-react'
import { ApiError } from '@/shared/api/client'
import { useServices } from '@/shared/api/services'
import { relativeDate } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { ConfirmAction } from '@/shared/ui/confirm-action'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page'
import { Failure } from '@/shared/ui/route-feedback'
import { Skeleton } from '@/shared/ui/skeleton'
import { Spinner } from '@/shared/ui/spinner'
import {
  accountKeys,
  accountOptions,
  changePassword,
  revokeOtherSessions,
  revokeSession,
  sessionsOptions,
  updateProfile,
} from '../api'
import { PasswordInput, PasswordRules } from '../components/password-input'
import { ns } from '../messages'
import {
  passwordChangeInput,
  profileInput,
  type Account,
  type AccountSession,
  type PasswordChangeInput,
} from '../schema'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

export default function AccountPage() {
  const { t } = useTranslation(ns)
  const { api, session } = useServices()
  const account = useQuery(accountOptions(api, session.user.id))
  return (
    <div className="max-w-3xl">
      <PageHeader title={t('navigation')} description={t('accountSubtitle')} />
      <div className="grid gap-4">
        {account.isPending ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : account.isError ? (
          <Failure error={account.error} retry={() => void account.refetch()} />
        ) : (
          <>
            <Profile account={account.data} />
            <Security account={account.data} />
          </>
        )}
        <Devices />
        <SignOutCard />
      </div>
    </div>
  )
}

function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string
  hint?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4 [.border-b]:pb-4">
        <CardTitle>{title}</CardTitle>
        {hint && <CardDescription>{hint}</CardDescription>}
        {action && <CardAction className="self-center">{action}</CardAction>}
      </CardHeader>
      {children}
    </Card>
  )
}

/** One label/value row with an optional action, matching the appearance settings list. */
function Row({
  title,
  hint,
  children,
}: {
  title: ReactNode
  hint?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8 sm:px-6">
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function Profile({ account }: { account: Account }) {
  const { t } = useTranslation(ns)
  const { api, session, refreshSession } = useServices()
  const client = useQueryClient()
  const form = useForm<{ name: string }>({
    resolver: zodResolver(profileInput),
    values: { name: account.name },
  })
  const save = useMutation({
    mutationFn: ({ name }: { name: string }) => updateProfile(api, name),
    onSuccess: async (next) => {
      client.setQueryData(accountKeys.profile(session.user.id), next)
      form.reset({ name: next.name })
      toast.success(t('profileSaved'))
      // The session carries the display name used by the account menu.
      await refreshSession()
    },
    onError: (error) => {
      if (error instanceof ApiError && error.fields.name)
        form.setError('name', { type: 'server' })
    },
  })
  const error = form.formState.errors.name
  return (
    <Section title={t('profile')} hint={t('profileHint')}>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => save.mutate(values))}
        className="grid gap-5 px-5 py-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-6 sm:px-6"
      >
        <Avatar className="size-14 rounded-xl">
          <AvatarFallback className="rounded-xl bg-primary/10 text-base font-semibold text-primary">
            {initials(account.name)}
          </AvatarFallback>
        </Avatar>
        <FieldGroup className="gap-4">
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="account-name">{t('displayName')}</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="account-name"
                dir="auto"
                autoComplete="name"
                className="max-w-sm"
                aria-invalid={Boolean(error)}
                {...form.register('name')}
              />
              <Button
                type="submit"
                variant="outline"
                disabled={!form.formState.isDirty || save.isPending}
              >
                {save.isPending && <Spinner data-icon="inline-start" />}
                {t('saveProfile')}
              </Button>
            </div>
            {error && <FieldError>{t('nameError')}</FieldError>}
          </Field>
          <Field>
            <FieldLabel htmlFor="account-email">{t('email')}</FieldLabel>
            <Input
              id="account-email"
              dir="ltr"
              value={account.email}
              readOnly
              className="max-w-sm bg-muted/50"
            />
            <FieldDescription>{t('emailManaged')}</FieldDescription>
          </Field>
          {save.isError && !error && <Failure error={save.error} />}
        </FieldGroup>
      </form>
    </Section>
  )
}

function Security({ account }: { account: Account }) {
  const { t } = useTranslation(ns)
  return (
    <Section title={t('security')} hint={t('securityHint')}>
      <div className="divide-y">
        <Row
          title={t('password')}
          hint={
            account.passwordManaged
              ? t('passwordSso')
              : account.passwordChangedAt
                ? t('passwordChanged', {
                    when: relativeDate(account.passwordChangedAt),
                  })
                : t('passwordNever')
          }
        >
          {!account.passwordManaged && <ChangePassword />}
        </Row>
        <Row
          title={
            <span className="flex items-center gap-2">
              {t('mfa')}
              <Badge
                variant="secondary"
                className={cn(
                  'rounded-full border-0',
                  account.mfaEnabled
                    ? 'bg-success/12 text-success'
                    : 'text-muted-foreground',
                )}
              >
                {t(account.mfaEnabled ? 'mfaOn' : 'mfaOff')}
              </Badge>
            </span>
          }
          hint={t('mfaManaged')}
        />
      </div>
    </Section>
  )
}

function ChangePassword() {
  const { t } = useTranslation(ns)
  const { api } = useServices()
  const [open, setOpen] = useState(false)
  const form = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeInput),
    mode: 'onTouched',
    defaultValues: { current: '', password: '', confirm: '' },
  })
  const change = useMutation({
    mutationFn: (input: PasswordChangeInput) => changePassword(api, input),
    onSuccess: () => {
      toast.success(t('passwordUpdated'))
      setOpen(false)
      form.reset()
    },
    onError: (error) => {
      if (error instanceof ApiError && error.fields.current)
        form.setError('current', { type: 'server' })
      if (error instanceof ApiError && error.fields.password)
        form.setError('password', { type: 'server' })
    },
  })
  const errors = form.formState.errors
  const fieldError = errors.current || errors.password
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          form.reset()
          change.reset()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">{t('changePassword')}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('changePassword')}</DialogTitle>
          <DialogDescription>{t('changePasswordHint')}</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          id="change-password"
          onSubmit={form.handleSubmit((input) => change.mutate(input))}
        >
          <input
            type="text"
            name="username"
            autoComplete="username"
            hidden
            readOnly
          />
          <FieldGroup className="gap-4">
            <Field data-invalid={Boolean(errors.current)}>
              <FieldLabel htmlFor="password-current">
                {t('currentPassword')}
              </FieldLabel>
              <PasswordInput
                id="password-current"
                autoComplete="current-password"
                autoFocus
                aria-invalid={Boolean(errors.current)}
                {...form.register('current')}
              />
              {errors.current && (
                <FieldError>
                  {t(
                    errors.current.type === 'server'
                      ? 'currentIncorrect'
                      : 'passwordRequired',
                  )}
                </FieldError>
              )}
            </Field>
            <Field data-invalid={Boolean(errors.password)}>
              <FieldLabel htmlFor="password-new">{t('newPassword')}</FieldLabel>
              <PasswordInput
                id="password-new"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby="password-rules"
                {...form.register('password')}
              />
              <PasswordRules
                id="password-rules"
                value={form.watch('password')}
              />
              {errors.password && <FieldError>{t('policyError')}</FieldError>}
            </Field>
            <Field data-invalid={Boolean(errors.confirm)}>
              <FieldLabel htmlFor="password-confirm">
                {t('confirmPassword')}
              </FieldLabel>
              <PasswordInput
                id="password-confirm"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirm)}
                {...form.register('confirm')}
              />
              {errors.confirm && <FieldError>{t('confirmError')}</FieldError>}
            </Field>
            {change.isError && !fieldError && <Failure error={change.error} />}
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            form="change-password"
            disabled={change.isPending}
          >
            {change.isPending && <Spinner data-icon="inline-start" />}
            {t('updatePassword')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const deviceIcons = { desktop: Monitor, mobile: Smartphone, tablet: Tablet }

function Devices() {
  const { t } = useTranslation(ns)
  const { api, session } = useServices()
  const client = useQueryClient()
  const sessions = useQuery(sessionsOptions(api, session.user.id))
  const refresh = () =>
    client.invalidateQueries({
      queryKey: accountKeys.sessions(session.user.id),
    })
  const others = sessions.data?.items.filter((item) => !item.current) ?? []
  const revokeOthers = useMutation({
    mutationFn: () => revokeOtherSessions(api),
    onSuccess: () => toast.success(t('revokedOthers')),
    onError: () => toast.error(t('unavailable')),
    onSettled: refresh,
  })
  return (
    <Section
      title={t('sessions')}
      hint={t('sessionsHint')}
      action={
        others.length > 0 && (
          <ConfirmAction
            tone="destructive"
            icon={LogOut}
            title={t('revokeOthersTitle')}
            description={t('revokeOthersHint')}
            chips={others.map((item) => item.client)}
            confirmLabel={t('revokeOthersConfirm', { count: others.length })}
            onConfirm={() => revokeOthers.mutate()}
          >
            <Button
              variant="outline"
              size="sm"
              disabled={revokeOthers.isPending}
            >
              {revokeOthers.isPending && <Spinner data-icon="inline-start" />}
              {t('revokeOthers')}
            </Button>
          </ConfirmAction>
        )
      }
    >
      {sessions.isPending ? (
        <div className="grid gap-3 p-5 sm:px-6">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-10" />
          ))}
        </div>
      ) : sessions.isError ? (
        <div className="p-5 sm:px-6">
          <Failure
            error={sessions.error}
            retry={() => void sessions.refetch()}
          />
        </div>
      ) : (
        <ul className="divide-y">
          {sessions.data.items.map((item) => (
            <DeviceRow key={item.id} item={item} onRevoked={refresh} />
          ))}
          {others.length === 0 && (
            <li className="px-5 py-3 text-sm text-muted-foreground sm:px-6">
              {t('noOtherSessions')}
            </li>
          )}
        </ul>
      )}
    </Section>
  )
}

function DeviceRow({
  item,
  onRevoked,
}: {
  item: AccountSession
  onRevoked: () => void
}) {
  const { t } = useTranslation(ns)
  const { api } = useServices()
  const revoke = useMutation({
    mutationFn: () => revokeSession(api, item.id),
    onSuccess: () => toast.success(t('revoked')),
    onError: () => toast.error(t('unavailable')),
    onSettled: onRevoked,
  })
  const Icon = deviceIcons[item.device]
  return (
    <li className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          <span className="truncate" dir="auto">
            {item.client}
          </span>
          {item.current && (
            <Badge
              variant="secondary"
              className="shrink-0 rounded-full border-0 bg-success/12 text-success"
            >
              {t('thisDevice')}
            </Badge>
          )}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          <span dir="auto">{item.location ?? t('unknownLocation')}</span> ·{' '}
          {item.current
            ? t('activeNow')
            : t('lastActive', { when: relativeDate(item.lastActiveAt) })}
        </p>
      </div>
      {!item.current && (
        <ConfirmAction
          tone="destructive"
          icon={LogOut}
          title={t('revokeTitle', { client: item.client })}
          description={t('revokeHint')}
          confirmLabel={t('revoke')}
          onConfirm={() => revoke.mutate()}
        >
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            disabled={revoke.isPending}
            aria-label={t('revokeLabel', { client: item.client })}
          >
            {revoke.isPending && <Spinner data-icon="inline-start" />}
            {t('revoke')}
          </Button>
        </ConfirmAction>
      )}
    </li>
  )
}

function SignOutCard() {
  const { t } = useTranslation(ns)
  const { signOut } = useServices()
  const [pending, setPending] = useState(false)
  return (
    <Card className="py-0">
      <Row title={t('signOut')} hint={t('signOutHint')}>
        <Button
          variant="outline"
          disabled={pending}
          onClick={async () => {
            setPending(true)
            try {
              await signOut()
            } catch {
              toast.error(t('signOutFailed'))
              setPending(false)
            }
          }}
        >
          {pending ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <LogOut data-icon="inline-start" />
          )}
          {t('signOut')}
        </Button>
      </Row>
    </Card>
  )
}
