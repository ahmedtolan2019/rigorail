import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, KeyRound, LinkIcon, MailCheck } from 'lucide-react'
import { ApiError, type ApiClient } from '@/shared/api/client'
import { useDocumentTitle } from '@/shared/hooks/use-document-title'
import { withBase } from '@/shared/routing/base'
import { Button } from '@/shared/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Spinner } from '@/shared/ui/spinner'
import { toast } from 'sonner'
import { requestPasswordReset, resetPassword } from '../api'
import { PasswordInput, PasswordRules } from '../components/password-input'
import { ns } from '../messages'
import { authPaths, forgotInput, resetInput, type ResetInput } from '../schema'
import { AuthHeader, AuthLink, AuthMessage } from './shared'
import { authErrorMessage, type Go } from './navigation'

function BackToSignIn({ go }: { go: Go }) {
  const { t } = useTranslation(ns)
  return (
    <AuthLink
      to={authPaths.signIn}
      go={go}
      className="inline-flex items-center gap-1.5 justify-self-center text-sm"
    >
      <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
      {t('backToSignIn')}
    </AuthLink>
  )
}

export function ForgotPassword({
  api,
  go,
  initialEmail,
  demo,
}: {
  api: ApiClient
  go: Go
  initialEmail: string
  demo: boolean
}) {
  const { t } = useTranslation(ns)
  useDocumentTitle(t('forgotTitle'))
  const form = useForm<{ email: string }>({
    resolver: zodResolver(forgotInput),
    defaultValues: { email: initialEmail },
  })
  const [sentTo, setSentTo] = useState<string | null>(null)
  const send = useMutation({
    mutationFn: (email: string) => requestPasswordReset(api, email),
    onSuccess: (_, email) => {
      if (sentTo) toast.success(t('resent'))
      setSentTo(email)
    },
  })
  if (sentTo)
    return (
      <div className="grid gap-6">
        <AuthHeader
          icon={<MailCheck />}
          title={t('checkEmailTitle')}
          // First-strong isolates keep the address readable inside Arabic text.
          description={t('checkEmailHint', { email: `⁨${sentTo}⁩` })}
        />
        {send.isError && (
          <AuthMessage tone="error">
            {authErrorMessage(send.error, t)}
          </AuthMessage>
        )}
        <div className="grid gap-2">
          {demo && (
            <Button asChild size="lg" className="w-full">
              <a
                href={withBase(`${authPaths.reset}?token=demo`)}
                onClick={(event) => {
                  event.preventDefault()
                  go(authPaths.reset, { token: 'demo' })
                }}
              >
                <LinkIcon data-icon="inline-start" />
                {t('demoResetLink')}
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            disabled={send.isPending}
            onClick={() => send.mutate(sentTo)}
          >
            {send.isPending && <Spinner data-icon="inline-start" />}
            {t('resend')}
          </Button>
        </div>
        <BackToSignIn go={go} />
      </div>
    )
  const errors = form.formState.errors
  return (
    <div className="grid gap-6">
      <AuthHeader
        icon={<KeyRound />}
        title={t('forgotTitle')}
        description={t('forgotHint')}
      />
      {send.isError && (
        <AuthMessage tone="error">
          {authErrorMessage(send.error, t)}
        </AuthMessage>
      )}
      <form
        noValidate
        className="grid gap-5"
        onSubmit={form.handleSubmit(({ email }) => send.mutate(email))}
      >
        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="forgot-email">{t('email')}</FieldLabel>
          <Input
            id="forgot-email"
            type="email"
            dir="ltr"
            autoComplete="username"
            autoFocus
            spellCheck={false}
            aria-invalid={Boolean(errors.email)}
            {...form.register('email')}
          />
          {errors.email && <FieldError>{t('emailError')}</FieldError>}
        </Field>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={send.isPending}
        >
          {send.isPending && <Spinner data-icon="inline-start" />}
          {t('sendLink')}
        </Button>
      </form>
      <BackToSignIn go={go} />
    </div>
  )
}

export function ResetPassword({
  api,
  go,
  token,
  onDone,
}: {
  api: ApiClient
  go: Go
  token: string
  onDone: () => void
}) {
  const { t } = useTranslation(ns)
  const form = useForm<ResetInput>({
    resolver: zodResolver(resetInput),
    mode: 'onTouched',
    defaultValues: { token, password: '', confirm: '' },
  })
  const reset = useMutation({
    mutationFn: (input: ResetInput) => resetPassword(api, input),
    onSuccess: onDone,
    onError: (error) => {
      if (error instanceof ApiError && error.fields.password)
        form.setError('password', { type: 'server' })
    },
  })
  const expired =
    !token || (reset.error instanceof ApiError && reset.error.status === 410)
  useDocumentTitle(t(expired ? 'expiredTitle' : 'resetTitle'))
  if (expired)
    return (
      <div className="grid gap-6">
        <AuthHeader
          icon={<LinkIcon />}
          title={t('expiredTitle')}
          description={t('expiredHint')}
        />
        <Button
          size="lg"
          className="w-full"
          onClick={() => go(authPaths.forgot)}
        >
          {t('requestNewLink')}
        </Button>
        <BackToSignIn go={go} />
      </div>
    )
  const errors = form.formState.errors
  const password = form.watch('password')
  return (
    <div className="grid gap-6">
      <AuthHeader
        icon={<KeyRound />}
        title={t('resetTitle')}
        description={t('resetHint')}
      />
      {reset.isError && !errors.password && (
        <AuthMessage tone="error">
          {authErrorMessage(reset.error, t)}
        </AuthMessage>
      )}
      <form
        noValidate
        className="grid gap-5"
        onSubmit={form.handleSubmit((input) => reset.mutate(input))}
      >
        {/* Lets password managers attach the new password to the right account. */}
        <input
          type="text"
          name="username"
          autoComplete="username"
          hidden
          readOnly
        />
        <FieldGroup className="gap-4">
          <Field data-invalid={Boolean(errors.password)}>
            <FieldLabel htmlFor="reset-password">{t('newPassword')}</FieldLabel>
            <PasswordInput
              id="reset-password"
              autoComplete="new-password"
              autoFocus
              aria-invalid={Boolean(errors.password)}
              aria-describedby="reset-rules"
              {...form.register('password')}
            />
            <PasswordRules id="reset-rules" value={password} />
            {errors.password && <FieldError>{t('policyError')}</FieldError>}
          </Field>
          <Field data-invalid={Boolean(errors.confirm)}>
            <FieldLabel htmlFor="reset-confirm">
              {t('confirmPassword')}
            </FieldLabel>
            <PasswordInput
              id="reset-confirm"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirm)}
              {...form.register('confirm')}
            />
            {errors.confirm && <FieldError>{t('confirmError')}</FieldError>}
          </Field>
        </FieldGroup>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={reset.isPending}
        >
          {reset.isPending && <Spinner data-icon="inline-start" />}
          {t('updatePassword')}
        </Button>
      </form>
      <BackToSignIn go={go} />
    </div>
  )
}
