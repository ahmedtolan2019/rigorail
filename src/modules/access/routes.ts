import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { rootRoute } from '@/shared/routing/root'

export const accessRoutes = [
  createRoute({
    getParentRoute: () => rootRoute,
    path: 'access',
    component: lazyRouteComponent(() => import('./page')),
  }),
] as const
