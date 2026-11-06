import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Languages, Moon, Sun } from 'lucide-react'
import type { ApiClient } from '@/shared/api/client'
import { useTheme } from '@/shared/theme/theme-context'
import { Button } from '@/shared/ui/button'
import { BrandMark } from '@/shared/brand/brand-mark'
import { ns } from '../messages'
import { authPaths, safeRedirect } from '../schema'
import { ForgotPassword, ResetPassword } from './recovery'
import { SignIn, type DemoHints } from './sign-in'
import type { AuthPath, Go, Notice } from './navigation'

export interface SignedOutProps {
  api: ApiClient
  appName: string
  /** Why the user is here: the session ended, or they signed out themselves. */
  reason?: 'expired' | 'signed-out'
  /** Demo credentials to show on the sign-in page. Omit outside demo mode. */
  demo?: DemoHints
  /** Starts single sign-on with the return path. Omit when SSO is not offered. */
  sso?: (returnTo: string) => Promise<void>
  /** Called after the backend set the session; the app loads it and opens `returnTo`. */
  onSignedIn: (returnTo: string) => Promise<void>
}

function readLocation() {
  return {
    path: window.location.pathname,
    search: new URLSearchParams(window.location.search),
  }
}

/**
 * The signed-out experience: sign in (with an optional second factor), forgot
 * password and reset password. It renders without the app shell or router so it
 * loads little code; the external backend owns credentials and the session cookie.
 */
export default function SignedOutApp({
  api,
  appName,
  reason,
  demo,
  sso,
  onSignedIn,
}: SignedOutProps) {
  const [location, setLocation] = useState(readLocation)
  const [notice, setNotice] = useState<Notice | undefined>(reason)
  const go = useCallback<Go>((path, search) => {
    // Keep the post-sign-in destination while moving between these screens.
    const next = new URLSearchParams(search)
    const redirect = new URLSearchParams(window.location.search).get('redirect')
    if (redirect && path !== authPaths.reset) next.set('redirect', redirect)
    const query = next.size ? `?${next}` : ''
    window.history.pushState(null, '', path + query)
    setLocation(readLocation())
    setNotice(undefined)
  }, [])
  useEffect(() => {
    // Any protected URL becomes the sign-in page, remembering where the user was going.
    const current = readLocation()
    if (!Object.values(authPaths).includes(current.path as AuthPath)) {
      const target = current.path + window.location.search
      const keep =
        reason !== 'signed-out' && target !== '/'
          ? `?${new URLSearchParams({ redirect: target })}`
          : ''
      window.history.replaceState(null, '', authPaths.signIn + keep)
      setLocation(readLocation())
    }
    const onPop = () => setLocation(readLocation())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [reason])
  const returnTo = safeRedirect(location.search.get('redirect'))
  let screen
  if (location.path === authPaths.forgot)
    screen = (
      <ForgotPassword
        api={api}
        go={go}
        demo={Boolean(demo)}
        initialEmail={location.search.get('email') ?? ''}
      />
    )
  else if (location.path === authPaths.reset)
    screen = (
      <ResetPassword
        api={api}
        go={go}
        token={location.search.get('token') ?? ''}
        onDone={() => {
          go(authPaths.signIn)
          setNotice('reset')
        }}
      />
    )
  else
    screen = (
      <SignIn
        api={api}
        appName={appName}
        notice={notice}
        go={go}
        demo={demo}
        sso={sso && (() => sso(returnTo))}
        onSignedIn={() => onSignedIn(returnTo)}
      />
    )
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
      <div className="flex min-w-0 flex-col px-5 py-5 sm:px-8 sm:py-6">
        <header className="flex items-center justify-between gap-3">
          <Brand name={appName} />
          <Preferences />
        </header>
        <main className="flex flex-1 items-center justify-center py-10">
          <div key={location.path} className="w-full max-w-sm animate-page-in">
            {screen}
          </div>
        </main>
        <footer className="text-center text-xs text-muted-foreground lg:text-start">
          <span dir="ltr">
            © {new Date().getFullYear()} {appName}
          </span>
        </footer>
      </div>
      <BrandPanel />
    </div>
  )
}

function Brand({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-2.5 text-sm font-semibold">
      <BrandMark />
      {name}
    </span>
  )
}

function Preferences() {
  const { t, i18n } = useTranslation(ns)
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  const other = i18n.language === 'ar' ? 'en' : 'ar'
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        lang={other}
        onClick={() => void i18n.changeLanguage(other)}
      >
        <Languages aria-hidden="true" />
        {other === 'ar' ? 'العربية' : 'English'}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label={t(dark ? 'switchToLight' : 'switchToDark')}
        onClick={() => setTheme(dark ? 'light' : 'dark')}
      >
        {dark ? <Sun /> : <Moon />}
      </Button>
    </div>
  )
}

/** Brand-neutral side panel; it inherits the product palette from design tokens. */
function BrandPanel() {
  const { t } = useTranslation(ns)
  return (
    <aside
      aria-hidden="true"
      className="relative hidden overflow-hidden border-s bg-muted/50 lg:flex lg:flex-col lg:justify-end"
    >
      <div className="absolute inset-0 [background-image:radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div className="absolute -top-24 -end-24 size-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute top-1/3 -start-20 size-72 rounded-full bg-chart-2/10 blur-3xl" />
      {/* A stylized product glimpse: neutral cards, no real data. */}
      <div className="absolute inset-x-12 top-16 grid gap-3 xl:inset-x-16">
        <div className="grid grid-cols-3 gap-3">
          {[64, 42, 78].map((value) => (
            <div
              key={value}
              className="grid gap-2 rounded-xl border bg-card/80 p-4 shadow-sm backdrop-blur"
            >
              <span className="h-2 w-12 rounded-full bg-muted" />
              <span className="h-4 w-16 rounded-full bg-foreground/15" />
              <span className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary/60"
                  style={{ width: `${value}%` }}
                />
              </span>
            </div>
          ))}
        </div>
        <div className="grid gap-2.5 rounded-xl border bg-card/80 p-4 shadow-sm backdrop-blur">
          {[0.9, 0.7, 0.8, 0.6].map((width, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="size-6 shrink-0 rounded-full bg-primary/15" />
              <span
                className="h-2 rounded-full bg-foreground/10"
                style={{ width: `${width * 60}%` }}
              />
              <span className="ms-auto h-4 w-12 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
      <div className="relative grid gap-5 p-12 xl:p-16">
        <p className="max-w-md text-2xl font-semibold tracking-tight text-balance">
          {t('tagline')}
        </p>
        <ul className="grid gap-2.5 text-sm text-muted-foreground">
          {(['featureAccess', 'featureLanguages', 'featureSso'] as const).map(
            (key) => (
              <li key={key} className="flex items-center gap-2.5">
                <span className="grid size-5 place-items-center rounded-full bg-primary/12 text-primary">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                {t(key)}
              </li>
            ),
          )}
        </ul>
      </div>
    </aside>
  )
}
