import {
  createRoute,
  lazyRouteComponent,
  stripSearchParams,
  type SearchSchemaInput,
} from '@tanstack/react-router'
import { z } from 'zod'
import { rootRoute } from '@/shared/routing/root'
import { compositionViews, type CompositionView } from './views'

const viewSearch = z.object({
  view: z.enum(compositionViews).catch('dashboard'),
})
export const compositionRoutes = [
  createRoute({
    getParentRoute: () => rootRoute,
    path: 'compositions',
    validateSearch: (search: { view?: CompositionView } & SearchSchemaInput) =>
      viewSearch.parse(search),
    search: {
      middlewares: [stripSearchParams({ view: 'dashboard' as const })],
    },
    component: lazyRouteComponent(() => import('./page')),
  }),
] as const
