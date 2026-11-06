import { ApiClient } from '@/shared/api/client'
import { parseEnvironment } from '@/shared/config/env'
import { withRequestHeaders } from '@/shared/api/headers'
import { appConfig } from './config'
import { serverSentEvents } from '@/shared/realtime/events'
import { permissionCatalog } from './modules'
export { permissionCatalog }
export async function createRuntime() {
  const env = parseEnvironment(import.meta.env)
  // Keep this condition statically replaceable so API builds omit the demo module.
  if (import.meta.env.VITE_APP_MODE === 'demo') {
    const { createDemoTransport } = await import('./demo/transport')
    const demo = createDemoTransport(permissionCatalog)
    return {
      mode: 'demo' as const,
      aiEnabled: true,
      api: new ApiClient('http://demo.local', demo.transport),
      events: demo.events,
      demo,
    }
  }
  return {
    mode: 'api' as const,
    aiEnabled: env.VITE_ENABLE_AI === 'true',
    events: appConfig.api.events
      ? serverSentEvents(
          env.VITE_API_BASE_URL!.replace(/\/$/, '') + appConfig.api.events,
        )
      : undefined,
    api: new ApiClient(
      env.VITE_API_BASE_URL!,
      withRequestHeaders((request) => fetch(request), appConfig.api),
    ),
  }
}
export type Runtime = Awaited<ReturnType<typeof createRuntime>>
