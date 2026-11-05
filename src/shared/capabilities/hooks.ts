import { useQuery } from '@tanstack/react-query'
import { useServices } from '../api/services'
import type { Decision, Resource } from '../auth/model'
import {
  capabilitySchema,
  evaluateCapability,
  type Capabilities,
  type Requirements,
} from './model'

export function useCapabilities<T>(select: (value: Capabilities) => T) {
  const { api, session } = useServices()
  return useQuery({
    queryKey: [
      'capabilities',
      session.user.id,
      session.workspace.id,
      session.revision,
    ],
    queryFn: ({ signal }) =>
      api.request('/capabilities', capabilitySchema, { signal }),
    select,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: false,
  })
}
export function useCapability(
  requirements: Requirements & { action?: string; resource?: Resource },
): Decision {
  // Selecting a primitive prevents unrelated configuration updates rerendering this consumer.
  const query = useCapabilities((value) => {
    const decision = evaluateCapability(value, requirements)
    return decision.status === 'allowed' ? 'allowed' : decision.reason
  })
  const { access } = useServices()
  if (query.isPending) return { status: 'loading', reason: 'loading' }
  if (query.isError) return { status: 'error', reason: 'unavailable' }
  if (query.data !== 'allowed') return { status: 'denied', reason: query.data }
  return requirements.action
    ? access.decide(requirements.action, requirements.resource)
    : { status: 'allowed' }
}
