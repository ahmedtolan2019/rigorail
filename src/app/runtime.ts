import { ApiClient } from '@/shared/api/client'
import { parseEnvironment } from '@/shared/config/env'
import { requestPermissions } from '@/modules/requests/public'
export const permissionCatalog = requestPermissions
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
      demo,
    }
  }
  return {
    mode: 'api' as const,
    aiEnabled: env.VITE_ENABLE_AI === 'true',
    api: new ApiClient(env.VITE_API_BASE_URL!),
  }
}
export type Runtime = Awaited<ReturnType<typeof createRuntime>>
