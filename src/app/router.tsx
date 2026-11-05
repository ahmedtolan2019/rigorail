import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router'
import { LoadingState } from '@/shared/ui/loading-state'
import { Shell } from './shell'
import { RouteError, NotFound } from '@/shared/ui/route-feedback'
import {
  requestSearch,
  loadRequestList,
  loadRequestDetail,
  loadRequestForm,
} from '@/modules/requests/public'
import { loadAppearance } from '@/modules/appearance/public'
import { loadAccess } from '@/modules/access/public'
import { loadCatalog } from '@/modules/catalog/public'
const root = createRootRoute({
  component: Shell,
  errorComponent: RouteError,
  notFoundComponent: NotFound,
})
const index = createRoute({
  getParentRoute: () => root,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/requests', search: requestSearch.parse({}) })
  },
})
const list = createRoute({
  getParentRoute: () => root,
  path: '/requests',
  validateSearch: (search) => requestSearch.parse(search),
  component: lazyRouteComponent(loadRequestList),
})
const create = createRoute({
  getParentRoute: () => root,
  path: '/requests/new',
  validateSearch: (search) => requestSearch.parse(search),
  component: lazyRouteComponent(loadRequestForm),
})
const detail = createRoute({
  getParentRoute: () => root,
  path: '/requests/$requestId',
  validateSearch: (search) => requestSearch.parse(search),
  component: lazyRouteComponent(loadRequestDetail),
})
const edit = createRoute({
  getParentRoute: () => root,
  path: '/requests/$requestId/edit',
  validateSearch: (search) => requestSearch.parse(search),
  component: lazyRouteComponent(loadRequestForm),
})
const appearance = createRoute({
  getParentRoute: () => root,
  path: '/appearance',
  component: lazyRouteComponent(loadAppearance),
})
const access = createRoute({
  getParentRoute: () => root,
  path: '/access',
  component: lazyRouteComponent(loadAccess),
})
const catalog = createRoute({
  getParentRoute: () => root,
  path: '/components',
  component: lazyRouteComponent(loadCatalog),
})
export const router = createRouter({
  routeTree: root.addChildren([
    index,
    list,
    create,
    detail,
    edit,
    appearance,
    access,
    catalog,
  ]),
  defaultPreload: 'intent',
  defaultPendingComponent: LoadingState,
  defaultErrorComponent: RouteError,
})
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
