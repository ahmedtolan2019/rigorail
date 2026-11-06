import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { rootRoute } from '@/shared/routing/root'

export const appearanceRoutes = [
  createRoute({
    getParentRoute: () => rootRoute,
    path: 'appearance',
    component: lazyRouteComponent(() => import('./page')),
  }),
] as const
