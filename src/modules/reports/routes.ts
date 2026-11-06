import {
  createRoute,
  lazyRouteComponent,
  stripSearchParams,
  type SearchSchemaInput,
} from '@tanstack/react-router'
import { rootRoute } from '@/shared/routing/root'
import { reportOptions } from './queries'
import { resolveReportQuery } from './range'
import { defaultReportSearch, reportSearch, type ReportSearch } from './schema'

export const reportRoutes = [
  createRoute({
    getParentRoute: () => rootRoute,
    path: 'reports',
    validateSearch: (search: Partial<ReportSearch> & SearchSchemaInput) =>
      reportSearch.parse(search),
    search: { middlewares: [stripSearchParams(defaultReportSearch)] },
    // Only query fields are deps: switching metric or breakdown never refetches.
    loaderDeps: ({ search }) => resolveReportQuery(search),
    loader: ({ context: { queryClient, services }, deps }) =>
      queryClient.prefetchQuery(
        reportOptions(services.api, services.session.workspace.id, deps),
      ),
    component: lazyRouteComponent(() => import('./page')),
  }),
] as const
