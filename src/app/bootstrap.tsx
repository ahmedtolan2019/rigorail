import { ApiError } from '@/shared/api/client'
import { Failure } from '@/shared/ui/route-feedback'
import { Spinner } from '@/shared/ui/spinner'
import { configureFormatting } from '@/shared/lib/format'
import { useTranslation } from 'react-i18next'
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import {
  createGrantAdapter,
  sessionSchema,
  type Session,
} from '@/shared/auth/model'
import { ServicesContext, type Services } from '@/shared/api/services'
import { SignedOutApp, signOutRequest } from '@/modules/account/public'
import { ThemeProvider } from '@/shared/theme/theme-provider'
import { usePreferences } from '@/shared/preferences/store'
import { reportError } from '@/shared/observability/report'
import { createRuntime, permissionCatalog, type Runtime } from './runtime'
import { appConfig } from './config'
import { router } from './router'
import { ProgressBar } from './route-progress'
import { modules } from './modules'
import { invalidationsFor } from '@/shared/realtime/events'
import { createUploader } from '@/shared/uploads/model'

function SessionScope({
  runtime,
  session,
  refreshSession,
  signOut,
  switchDemo,
}: {
  runtime: Runtime
  session: Session
  refreshSession: () => Promise<unknown>
  signOut: () => Promise<void>
  switchDemo: (
    kind: 'persona' | 'workspace' | 'plan' | 'flag',
    value: string,
  ) => void
}) {
  // A 401 from any request means the backend session ended: reload the session so
  // bootstrap shows sign-in and returns the user here afterwards.
  const refreshRef = useRef(refreshSession)
  useEffect(() => {
    refreshRef.current = refreshSession
  }, [refreshSession])
  const [client] = useState(() => {
    const onError = (source: string) => (error: unknown) => {
      if (error instanceof ApiError && error.status === 401)
        void refreshRef.current()
      else reportError(error, { source })
    }
    return new QueryClient({
      queryCache: new QueryCache({ onError: onError('query') }),
      mutationCache: new MutationCache({ onError: onError('mutation') }),
      defaultOptions: {
        queries: { staleTime: 30_000, retry: false },
        mutations: { retry: false },
      },
    })
  })
  useEffect(
    () => () => {
      void client.cancelQueries()
      client.clear()
    },
    [client],
  )
  // Live updates: a change event refreshes the queries of subscribing modules.
  useEffect(
    () =>
      runtime.events?.((event) => {
        for (const queryKey of invalidationsFor(modules, event))
          void client.invalidateQueries({ queryKey })
      }),
    [runtime, client],
  )
  // Route loaders read the same services from the router context.
  const services = useMemo<Services>(
    () => ({
      api: runtime.api,
      session,
      access: createGrantAdapter(session, permissionCatalog),
      catalog: permissionCatalog,
      mode: runtime.mode,
      aiEnabled: runtime.aiEnabled,
      refreshSession,
      signOut,
      upload: createUploader(
        runtime.api,
        runtime.mode === 'demo' ? runtime.demo.putFile : undefined,
      ),
      demo:
        runtime.mode === 'demo'
          ? {
              plan: runtime.demo.plan,
              setPlan: (value) => switchDemo('plan', value),
              requestsEnabled: runtime.demo.requestsEnabled,
              setRequestsEnabled: (value) => switchDemo('flag', String(value)),
              persona: runtime.demo.persona,
              workspace: runtime.demo.workspace,
              setPersona: (value) => switchDemo('persona', value),
              setWorkspace: (value) => switchDemo('workspace', value),
            }
          : undefined,
    }),
    [runtime, session, refreshSession, signOut, switchDemo],
  )
  return (
    <QueryClientProvider client={client}>
      <ServicesContext value={services}>
        <RouterProvider
          router={router}
          context={{ queryClient: client, services }}
        />
      </ServicesContext>
    </QueryClientProvider>
  )
}
function SessionLoader({ runtime }: { runtime: Runtime }) {
  const { t } = useTranslation()
  const [switching, setSwitching] = useState(false)
  // Set by an explicit sign-out, so sign-in says "signed out" rather than "expired".
  const [signedOut, setSignedOut] = useState(false)
  // Each sign-in starts a fresh session scope (query cache, drafts, router state).
  const [generation, setGeneration] = useState(0)
  const query = useQuery({
    queryKey: ['session'],
    queryFn: ({ signal }) =>
      runtime.api.request('/session', sessionSchema, { signal }),
    retry: false,
    staleTime: 30_000,
  })
  const { refetch } = query
  const refreshSession = useCallback(() => refetch(), [refetch])
  // Other tabs of this app follow sign-in and sign-out immediately.
  const channel = useRef<BroadcastChannel | null>(null)
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const current = new BroadcastChannel(`${appConfig.id}:session`)
    current.onmessage = (event: MessageEvent<'signed-in' | 'signed-out'>) => {
      // A signed-out tab unmounts its scope, so signing in again starts fresh.
      if (event.data === 'signed-out') setSignedOut(true)
      void refetch()
    }
    channel.current = current
    return () => current.close()
  }, [refetch])
  const signOut = useCallback(async () => {
    await signOutRequest(runtime.api)
    setSignedOut(true)
    channel.current?.postMessage('signed-out')
    await refetch()
  }, [runtime, refetch])
  async function switchDemo(
    kind: 'persona' | 'workspace' | 'plan' | 'flag',
    value: string,
  ) {
    if (runtime.mode !== 'demo') return
    setSwitching(true)
    if (kind === 'persona') runtime.demo.setPersona(value)
    else if (kind === 'workspace') runtime.demo.setWorkspace(value)
    else if (kind === 'plan') runtime.demo.setPlan(value)
    else runtime.demo.setRequestsEnabled(value === 'true')
    await query.refetch()
    setSwitching(false)
  }
  if (query.isPending) return <Splash />
  const status = query.error instanceof ApiError ? query.error.status : 0
  if (status === 401) {
    const onSignedIn = async (returnTo: string) => {
      router.history.replace(returnTo)
      setSignedOut(false)
      setGeneration((value) => value + 1)
      await refetch()
      channel.current?.postMessage('signed-in')
    }
    return (
      <Suspense fallback={<Splash />}>
        <SignedOutApp
          api={runtime.api}
          appName={appConfig.name}
          reason={signedOut ? 'signed-out' : query.data ? 'expired' : undefined}
          demo={runtime.mode === 'demo' ? runtime.demo.credentials : undefined}
          sso={
            !appConfig.auth.sso
              ? undefined
              : runtime.mode === 'demo'
                ? async (returnTo) => {
                    await runtime.api.response('/auth/sso/demo', {
                      method: 'POST',
                    })
                    await onSignedIn(returnTo)
                  }
                : async (returnTo) => {
                    // Full-page redirect to the backend, which returns to `returnTo`.
                    window.location.assign(
                      `${runtime.api.baseUrl.replace(/\/$/, '')}/auth/sso/start?${new URLSearchParams({ returnTo })}`,
                    )
                    await new Promise(() => undefined)
                  }
          }
          onSignedIn={onSignedIn}
        />
      </Suspense>
    )
  }
  return (
    <>
      {query.isError && (
        <div className="mx-auto grid min-h-svh max-w-lg content-center gap-4 p-6">
          <h1>{t('unavailable')}</h1>
          <Failure error={query.error} retry={() => void query.refetch()} />
        </div>
      )}
      {switching && (
        <div role="status" aria-label={t('loading')}>
          <ProgressBar className="fixed inset-x-0 top-0 z-50" />
        </div>
      )}
      {/* 403 removes the old workspace; transient failures keep it hidden with drafts. */}
      {query.data && status !== 403 && (
        <div
          hidden={query.isError}
          inert={query.isError || switching}
          aria-busy={switching}
        >
          <SessionScope
            key={JSON.stringify([
              query.data.user.id,
              query.data.workspace.id,
              query.data.revision,
              generation,
            ])}
            runtime={runtime}
            session={query.data}
            refreshSession={refreshSession}
            signOut={signOut}
            switchDemo={(kind, value) => void switchDemo(kind, value)}
          />
        </div>
      )}
    </>
  )
}
export function Bootstrap() {
  const { t } = useTranslation()
  const [state, setState] = useState<{ runtime?: Runtime; error?: string }>({})
  const [client] = useState(() => new QueryClient())
  useEffect(() => {
    configureFormatting(appConfig.currency)
    usePreferences.getState().configure(appConfig.id, appConfig.defaults)
    let active = true
    void createRuntime().then(
      (runtime) => {
        if (active) setState({ runtime })
      },
      (error) => {
        if (active)
          setState({
            error:
              error instanceof Error ? error.message : 'Configuration failed.',
          })
      },
    )
    return () => {
      active = false
    }
  }, [])
  if (state.error)
    return (
      <div
        className="mx-auto grid min-h-svh max-w-xl content-center gap-4 p-6"
        role="alert"
      >
        <h1>{t('configure')}</h1>
        <p className="text-muted-foreground">{t('configureHint')}</p>
        <pre className="rounded-lg border bg-muted p-4 font-mono text-xs wrap-anywhere whitespace-pre-wrap">
          {state.error}
        </pre>
      </div>
    )
  if (!state.runtime) return <Splash />
  return (
    <ThemeProvider defaultTheme="light" storageKey={`${appConfig.id}:theme`}>
      <QueryClientProvider client={client}>
        <SessionLoader runtime={state.runtime} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

/** Branded startup state shown while runtime configuration and the session load. */
function Splash() {
  const { t } = useTranslation()
  return (
    <div
      role="status"
      aria-label={t('loading')}
      className="grid min-h-svh place-items-center bg-background"
    >
      <div className="flex animate-in flex-col items-center gap-4 delay-150 duration-500 fill-mode-backwards fade-in-0">
        <span className="grid size-11 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-sm">
          {appConfig.name.slice(0, 1)}
        </span>
        <Spinner className="size-4 text-muted-foreground" />
      </div>
    </div>
  )
}
