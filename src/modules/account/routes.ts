import {
  createRoute,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router'
import { rootRoute } from '@/shared/routing/root'
import { authPaths } from './paths'

// Sign-in screens render outside this router while signed out (see public.ts).
// A signed-in user who opens one of their URLs is sent to the start page instead.
const signedInRedirects = Object.values(authPaths).map((path) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path,
    beforeLoad: () => {
      throw redirect({ to: '/' })
    },
  }),
)

export const accountRoutes = [
  createRoute({
    getParentRoute: () => rootRoute,
    path: 'account',
    component: lazyRouteComponent(() => import('./pages/account')),
  }),
  ...signedInRedirects,
] as const
