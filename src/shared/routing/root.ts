import { createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import type { Services } from '../api/services'

/**
 * Available to every route `loader`. Loaders should only prefetch queries
 * (`queryClient.prefetchQuery`, which never throws) so navigation preloading on
 * hover makes pages render with data, while pages keep owning errors and access.
 */
export interface RouterContext {
  queryClient: QueryClient
  services: Services
}

// Modules attach their route trees to this root. App composition sets the shell
// and route-level feedback with rootRoute.update(), so modules never import app code.
export const rootRoute = createRootRouteWithContext<RouterContext>()()
