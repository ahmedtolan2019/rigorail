import {
  createRoute,
  lazyRouteComponent,
  stripSearchParams,
  type SearchSchemaInput,
} from '@tanstack/react-router'
import { rootRoute } from '@/shared/routing/root'
// Queries and their schemas load with the route, not at startup.
const queries = () => import('./queries')
import {
  defaultRequestSearch,
  requestSearch,
  type RequestSearch,
} from './schema'

// The parent route owns list search state, so detail and form pages inherit it
// and can return to the same filtered list.
const requests = createRoute({
  getParentRoute: () => rootRoute,
  path: 'requests',
  // Partial input lets links set only the filters they care about.
  validateSearch: (
    search: Partial<RequestSearch> & SearchSchemaInput,
  ): RequestSearch => requestSearch.parse(search),
  // Keep shareable URLs short: default filter values are omitted.
  search: { middlewares: [stripSearchParams(defaultRequestSearch)] },
})
// Loaders only prefetch: hovering a link warms the cache, pages still own errors.
const list = createRoute({
  getParentRoute: () => requests,
  path: '/',
  loaderDeps: ({ search }) => search,
  loader: async ({ context: { queryClient, services }, deps }) =>
    queryClient.prefetchQuery(
      (await queries()).listOptions(services.api, services.session.workspace.id, deps),
    ),
  component: lazyRouteComponent(() => import('./pages/list')),
})
const create = createRoute({
  getParentRoute: () => requests,
  path: 'new',
  component: lazyRouteComponent(() => import('./pages/form')),
})
const detail = createRoute({
  getParentRoute: () => requests,
  path: '$requestId',
  loader: async ({ context: { queryClient, services }, params }) =>
    queryClient.prefetchQuery(
      (await queries()).detailOptions(
        services.api,
        services.session.workspace.id,
        params.requestId,
      ),
    ),
  component: lazyRouteComponent(() => import('./pages/detail')),
})
const edit = createRoute({
  getParentRoute: () => requests,
  path: '$requestId/edit',
  component: lazyRouteComponent(() => import('./pages/form')),
})
export const requestRoutes = [
  requests.addChildren([list, create, detail, edit]),
] as const
