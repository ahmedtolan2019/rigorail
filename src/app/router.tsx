import {
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router'
import { rootRoute } from '@/shared/routing/root'
import { PageSkeleton } from '@/shared/ui/page'
import { RouteError, NotFound } from '@/shared/ui/route-feedback'
import { requestSearch } from '@/modules/requests/public'
import { moduleRoutes } from './modules'

rootRoute.update({
  // Load navigation and account-menu UI only when the workspace mounts.
  component: lazyRouteComponent(() => import('./shell'), 'Shell'),
  errorComponent: RouteError,
  notFoundComponent: NotFound,
})
// The application's start page. Change it when a different module is the home.
const index = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/requests', search: requestSearch.parse({}) })
  },
})
export const router = createRouter({
  routeTree: rootRoute.addChildren([index, ...moduleRoutes]),
  // Provided per session by <RouterProvider context> in bootstrap.tsx.
  context: { queryClient: undefined!, services: undefined! },
  defaultPreload: 'intent',
  // TanStack Query owns freshness; the router always asks it.
  defaultPreloadStaleTime: 0,
  // Back/forward returns to the previous scroll position, as in a classic site.
  scrollRestoration: true,
  defaultPendingComponent: PageSkeleton,
  defaultErrorComponent: RouteError,
})
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
