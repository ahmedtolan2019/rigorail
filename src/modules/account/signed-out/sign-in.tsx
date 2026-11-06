import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { KeyRound, ShieldCheck } from 'lucide-react'
import type { ApiClient } from '@/shared/api/client'
import { useDocumentTitle } from '@/shared/hooks/use-document-title'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/shared/ui/input-otp'
import { Label } from '@/shared/ui/label'
import { Spinner } from '@/shared/ui/spinner'
import { signIn, verifyMfa } from '../api'
import { PasswordInput } from '../components/password-input'
import { ns } from '../messages'
import { authPaths, signInInput, type SignInInput } from '../schema'
import { AuthHeader, AuthLink, AuthMessage } from './shared'
import { authErrorMessage, type Go, type Notice } from './navigation'

export interface DemoHints {
  password: string
  mfaCode: string
}

export function SignIn({
  api,
  appName,
  notice,
  go,
  demo,
  sso,
  onSignedIn,
}: {
  api: ApiClient
  appName: string
  notice?: Notice
  go: Go
  demo?: DemoHints
  sso?: () => Promise<void>
  onSignedIn: () => Promise<void>
}) {
  const { t } = useTranslation(ns)
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials')
  const [remember, setRemember] = useState(false)
  useDocumentTitle(t(step === 'mfa' ? 'mfaTitle' : 'signIn'))
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInInput),
    defaultValues: { email: '', password: '', remember: false },
  })
  const credentials = useMutation({
    mutationFn: (input: SignInInput) => signIn(api, input),
    onSuccess: async (result, input) => {
      setRemember(input.remember)
      if (result.status === 'mfa_required') setStep('mfa')
      else await onSignedIn()
    },
    onError: () => form.setValue('password', ''),
  })
  const single = useMutation({
    mutationFn: () => sso!(),
    onError: () => undefined,
  })
  if (step === 'mfa')
    return (
      <SecondFactor
        api={api}
        remember={remember}
        onBack={() => {
          credentials.reset()
          setStep('credentials')
        }}
        onSignedIn={onSignedIn}
        demoCode={demo?.mfaCode}
      />
    )
  const errors = form.formState.errors
  const busy =
    credentials.isPending || credentials.isSuccess || single.isPending
  const email = form.watch('email')
  return (
    <div className="grid gap-6">
      <AuthHeader
        title={t('signInTitle', { app: appName })}
        description={t('signInHint')}
      />
      {credentials.isError || single.isError ? (
        <AuthMessage tone="error">
          {authErrorMessage(credentials.error ?? single.error, t)}
        </AuthMessage>
      ) : notice ? (
        <AuthMessage tone={notice === 'expired' ? 'info' : 'success'}>
          {t(
            notice === 'expired'
              ? 'sessionEnded'
              : notice === 'reset'
                ? 'resetDone'
                : 'signedOutNotice',
          )}
        </AuthMessage>
      ) : null}
      <form
        noValidate
        onSubmit={form.handleSubmit((input) => credentials.mutate(input))}
        className="grid gap-5"
      >
        <FieldGroup className="gap-4">
          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor="sign-in-email">{t('email')}</FieldLabel>
            <Input
              id="sign-in-email"
              type="email"
              dir="ltr"
              autoComplete="username"
              autoFocus
              spellCheck={false}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? 'sign-in-email-error' : undefined
              }
              {...form.register('email')}
            />
            {errors.email && (
              <FieldError id="sign-in-email-error">
                {t('emailError')}
              </FieldError>
            )}
          </Field>
          <Field data-invalid={Boolean(errors.password)}>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel htmlFor="sign-in-password">
                {t('password')}
              </FieldLabel>
              <AuthLink
                to={authPaths.forgot}
                search={email ? { email } : undefined}
                go={go}
                className="text-xs"
              >
                {t('forgot')}
              </AuthLink>
            </div>
            <PasswordInput
              id="sign-in-password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? 'sign-in-password-error' : undefined
              }
              {...form.register('password')}
            />
            {errors.password && (
              <FieldError id="sign-in-password-error">
                {t('passwordRequired')}
              </FieldError>
            )}
          </Field>
          <Controller
            control={form.control}
            name="remember"
            render={({ field }) => (
              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="sign-in-remember"
                  checked={field.value}
                  onCheckedChange={(value) => field.onChange(value === true)}
                />
                <Label htmlFor="sign-in-remember" className="font-normal">
                  {t('remember')}
                </Label>
              </div>
            )}
          />
        </FieldGroup>
        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {(credentials.isPending || credentials.isSuccess) && (
            <Spinner data-icon="inline-start" />
          )}
          {t('signIn')}
        </Button>
      </form>
      {sso && (
        <>
          <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
            <span className="h-px flex-1 bg-border" />
            {t('or')}
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={() => single.mutate()}
          >
            {single.isPending ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <KeyRound data-icon="inline-start" />
            )}
            {t('sso')}
          </Button>
        </>
      )}
      {demo && (
        <aside className="grid gap-2 rounded-lg border border-dashed bg-muted/40 p-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium">{t('demoTitle')}</p>
            <Button
              variant="ghost"
              size="sm"
              className="-my-1 h-7 px-2 text-xs"
              onClick={() => {
                form.setValue('email', 'sam.taylor@example.com', {
                  shouldValidate: true,
                })
                form.setValue('password', demo.password, {
                  shouldValidate: true,
                })
              }}
            >
              {t('useDemo')}
            </Button>
          </div>
          <p className="text-muted-foreground">
            {t('demoHint', { code: demo.mfaCode })}
          </p>
          <code
            dir="ltr"
            className="w-fit rounded bg-background px-1.5 py-0.5 font-mono ring-1 ring-border"
          >
            {demo.password}
          </code>
        </aside>
      )}
    </div>
  )
}

function SecondFactor({
  api,
  remember,
  onBack,
  onSignedIn,
  demoCode,
}: {
  api: ApiClient
  remember: boolean
  onBack: () => void
  onSignedIn: () => Promise<void>
  demoCode?: string
}) {
  const { t } = useTranslation(ns)
  const [code, setCode] = useState('')
  const [trust, setTrust] = useState(remember)
  const verify = useMutation({
    mutationFn: (value: string) =>
      verifyMfa(api, { code: value, remember: trust }),
    onSuccess: () => onSignedIn(),
    onError: () => setCode(''),
  })
  const busy = verify.isPending || verify.isSuccess
  const expired =
    verify.error &&
    'code' in verify.error &&
    verify.error.code === 'mfa_expired'
  return (
    <div className="grid gap-6">
      <AuthHeader
        icon={<ShieldCheck />}
        title={t('mfaTitle')}
        description={t('mfaHint')}
      />
      {verify.isError && (
        <AuthMessage tone="error">
          {authErrorMessage(verify.error, t)}
        </AuthMessage>
      )}
      <form
        noValidate
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault()
          if (code.length === 6) verify.mutate(code)
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="mfa-code">{t('mfaCode')}</Label>
          {/* Codes are digits read left to right in every language. */}
          <div dir="ltr" className="flex justify-start rtl:justify-end">
            <InputOTP
              id="mfa-code"
              maxLength={6}
              inputMode="numeric"
              pattern="^\d*$"
              autoComplete="one-time-code"
              autoFocus
              disabled={busy || Boolean(expired)}
              value={code}
              onChange={setCode}
              onComplete={(value: string) => verify.mutate(value)}
              aria-invalid={verify.isError}
            >
              <InputOTPGroup className="*:data-[slot=input-otp-slot]:size-11 *:data-[slot=input-otp-slot]:text-base">
                {Array.from({ length: 6 }, (_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    aria-invalid={verify.isError}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          {demoCode && (
            <p className="text-xs text-muted-foreground">
              {t('demoTitle')}:{' '}
              <code dir="ltr" className="font-mono">
                {demoCode}
              </code>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <Checkbox
            id="mfa-trust"
            checked={trust}
            onCheckedChange={(value) => setTrust(value === true)}
          />
          <Label htmlFor="mfa-trust" className="font-normal">
            {t('trustDevice')}
          </Label>
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={busy || code.length < 6 || Boolean(expired)}
        >
          {busy && <Spinner data-icon="inline-start" />}
          {t('verify')}
        </Button>
      </form>
      <Button variant="ghost" className="justify-self-center" onClick={onBack}>
        {t('useAnotherAccount')}
      </Button>
    </div>
  )
}
