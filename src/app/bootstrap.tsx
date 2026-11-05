import { ApiError } from '@/shared/api/client'
import { Failure } from '@/shared/ui/route-feedback'
import { configureFormatting } from '@/shared/lib/format'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import {
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
import { ServicesContext } from '@/shared/api/services'
import { ThemeProvider } from '@/shared/theme/theme-provider'
import { usePreferences } from '@/shared/preferences/store'
import { createRuntime, permissionCatalog, type Runtime } from './runtime'
import { appConfig } from './config'
import { router } from './router'

function SessionScope({
  runtime,
  session,
  refreshSession,
  switchDemo,
}: {
  runtime: Runtime
  session: Session
  refreshSession: () => Promise<unknown>
  switchDemo: (
    kind: 'persona' | 'workspace' | 'plan' | 'flag',
    value: string,
  ) => void
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: false },
          mutations: { retry: false },
        },
      }),
  )
  useEffect(
    () => () => {
      void client.cancelQueries()
      client.clear()
    },
    [client],
  )
  return (
    <QueryClientProvider client={client}>
      <ServicesContext
        value={{
          api: runtime.api,
          session,
          access: createGrantAdapter(session, permissionCatalog),
          catalog: permissionCatalog,
          mode: runtime.mode,
          aiEnabled: runtime.aiEnabled,
          refreshSession,
          demo:
            runtime.mode === 'demo'
              ? {
                  plan: runtime.demo.plan,
                  setPlan: (value) => switchDemo('plan', value),
                  requestsEnabled: runtime.demo.requestsEnabled,
                  setRequestsEnabled: (value) =>
                    switchDemo('flag', String(value)),
                  persona: runtime.demo.persona,
                  workspace: runtime.demo.workspace,
                  setPersona: (value) => switchDemo('persona', value),
                  setWorkspace: (value) => switchDemo('workspace', value),
                }
              : undefined,
        }}
      >
        <RouterProvider router={router} />
      </ServicesContext>
    </QueryClientProvider>
  )
}
function SessionLoader({ runtime }: { runtime: Runtime }) {
  const { t } = useTranslation()
  const [switching, setSwitching] = useState(false)
  const query = useQuery({
    queryKey: ['session'],
    queryFn: ({ signal }) =>
      runtime.api.request('/session', sessionSchema, { signal }),
    retry: false,
    staleTime: 30_000,
  })
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
  if (query.isPending || switching)
    return (
      <div className="startup" role="status">
        {t('loading')}
      </div>
    )
  const unauthorized =
    query.isError &&
    query.error instanceof ApiError &&
    [401, 403].includes(query.error.status)
  return (
    <>
      {query.isError && (
        <div className="startup">
          <h1>{t('unavailable')}</h1>
          <Failure error={query.error} retry={() => void query.refetch()} />
        </div>
      )}
      {query.data && !unauthorized && (
        <div hidden={query.isError} inert={query.isError}>
          <SessionScope
            key={JSON.stringify([
              query.data.user.id,
              query.data.workspace.id,
              query.data.revision,
            ])}
            runtime={runtime}
            session={query.data}
            refreshSession={() => query.refetch()}
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
      <div className="startup" role="alert">
        <h1>{t('configure')}</h1>
        <p>{t('configureHint')}</p>
        <pre>{state.error}</pre>
      </div>
    )
  if (!state.runtime)
    return (
      <div className="startup" role="status">
        {t('loading')}
      </div>
    )
  return (
    <ThemeProvider defaultTheme="light" storageKey={`${appConfig.id}:theme`}>
      <QueryClientProvider client={client}>
        <SessionLoader runtime={state.runtime} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
