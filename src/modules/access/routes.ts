import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { rootRoute } from '@/shared/routing/root'

export const accessRoutes = [
  createRoute({
    getParentRoute: () => rootRoute,
    path: 'access',
    // Permission labels load with the access screen, not at startup.
    loader: ({ context: { services } }) => services.loadPermissionLabels(),
    component: lazyRouteComponent(() => import('./page')),
  }),
] as const
