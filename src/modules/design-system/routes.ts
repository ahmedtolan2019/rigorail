import {
  createRoute,
  lazyRouteComponent,
  redirect,
  stripSearchParams,
  type SearchSchemaInput,
} from '@tanstack/react-router'
import { z } from 'zod'
import { rootRoute } from '@/shared/routing/root'
import { designSystemTabs, type DesignSystemTab } from './tabs'

const tabSearch = z.object({
  tab: z.enum(designSystemTabs).catch('foundations'),
})
export const designSystemRoutes = [
  createRoute({
    getParentRoute: () => rootRoute,
    path: 'design-system',
    validateSearch: (search: { tab?: DesignSystemTab } & SearchSchemaInput) =>
      tabSearch.parse(search),
    search: {
      middlewares: [stripSearchParams({ tab: 'foundations' as const })],
    },
    component: lazyRouteComponent(() => import('./page')),
  }),
  // Former catalog URL; kept so bookmarks keep working.
  createRoute({
    getParentRoute: () => rootRoute,
    path: 'components',
    beforeLoad: () => {
      throw redirect({ to: '/design-system', search: { tab: 'catalog' } })
    },
  }),
] as const
