import { lazy, Suspense, useState } from 'react'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  CalendarDays,
  Columns2,
  Columns3,
  FilePen,
  GanttChart,
  GitCompare,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  ListTree,
  Settings2,
  SlidersHorizontal,
  SquarePen,
  Table2,
  Tags,
  UserRound,
  Zap,
  type LucideIcon,
  Calculator,
  CalendarRange,
  CircleCheckBig,
  FileUp,
  Grid3x3,
  Layers,
  Network,
  ReceiptText,
  Route,
  Scale,
  ShieldCheck,
  Warehouse,
  FileWarning,
  Forklift,
  Building2,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { PageHeader } from '@/shared/ui/page'
import { Input } from '@/shared/ui/input'
import { Combobox } from '@/shared/ui/combobox'
import { Skeleton } from '@/shared/ui/skeleton'
import { ns } from './messages'
import { compositionGroups, type CompositionView } from './views'

type View = React.LazyExoticComponent<() => React.JSX.Element>
// Each original screen loads only when opened.
const views: Record<CompositionView, { load: View; icon: LucideIcon }> = {
  dashboard: {
    load: lazy(() => import('./views/dashboard')),
    icon: LayoutDashboard,
  },
  'master-detail': {
    load: lazy(() => import('./views/master-detail')),
    icon: Columns2,
  },
  kanban: { load: lazy(() => import('./views/kanban')), icon: KanbanSquare },
  inbox: { load: lazy(() => import('./views/inbox')), icon: Inbox },
  calendar: {
    load: lazy(() => import('./views/calendar')),
    icon: CalendarDays,
  },
  activity: { load: lazy(() => import('./views/activity')), icon: Activity },
  'line-items': {
    load: lazy(() => import('./views/line-items')),
    icon: Table2,
  },
  'inline-table': {
    load: lazy(() => import('./views/inline-table')),
    icon: SquarePen,
  },
  'expandable-table': {
    load: lazy(() => import('./views/expandable-table')),
    icon: ListTree,
  },
  gallery: { load: lazy(() => import('./views/gallery')), icon: LayoutGrid },
  wizard: { load: lazy(() => import('./views/wizard')), icon: ListChecks },
  'conditional-form': {
    load: lazy(() => import('./views/conditional-form')),
    icon: FilePen,
  },
  'inline-edit': {
    load: lazy(() => import('./views/inline-edit')),
    icon: Tags,
  },
  settings: { load: lazy(() => import('./views/settings')), icon: Settings2 },
  'record-tabs': {
    load: lazy(() => import('./views/record-tabs')),
    icon: Columns3,
  },
  profile: { load: lazy(() => import('./views/profile')), icon: UserRound },
  triage: { load: lazy(() => import('./views/triage')), icon: Zap },
  timeline: { load: lazy(() => import('./views/timeline')), icon: GanttChart },
  compare: { load: lazy(() => import('./views/compare')), icon: GitCompare },
  planner: {
    load: lazy(() => import('./views/planner')),
    icon: SlidersHorizontal,
  },
  onboarding: {
    load: lazy(() => import('./views/onboarding')),
    icon: CircleCheckBig,
  },
  'approval-chain': {
    load: lazy(() => import('./views/approval-chain')),
    icon: Route,
  },
  reconciliation: {
    load: lazy(() => import('./views/reconciliation')),
    icon: Scale,
  },
  'import-mapping': {
    load: lazy(() => import('./views/import-mapping')),
    icon: FileUp,
  },
  'bulk-edit': { load: lazy(() => import('./views/bulk-edit')), icon: Layers },
  pivot: { load: lazy(() => import('./views/pivot')), icon: Grid3x3 },
  'permission-matrix': {
    load: lazy(() => import('./views/permission-matrix')),
    icon: ShieldCheck,
  },
  'quote-builder': {
    load: lazy(() => import('./views/quote-builder')),
    icon: Calculator,
  },
  document: { load: lazy(() => import('./views/document')), icon: ReceiptText },
  'org-chart': { load: lazy(() => import('./views/org-chart')), icon: Network },
  'bin-map': { load: lazy(() => import('./views/bin-map')), icon: Warehouse },
  roster: { load: lazy(() => import('./views/roster')), icon: CalendarRange },
  'three-way-match': {
    load: lazy(() => import('./views/three-way-match')),
    icon: FileWarning,
  },
  'asset-detail': {
    load: lazy(() => import('./views/asset-detail')),
    icon: Forklift,
  },
  'customer-360': {
    load: lazy(() => import('./views/customer-360')),
    icon: Building2,
  },
}
const route = getRouteApi('/compositions')

export default function Compositions() {
  const { t } = useTranslation(ns)
  const { view } = route.useSearch()
  const navigate = route.useNavigate()
  const [query, setQuery] = useState('')
  const groups = compositionGroups
    .map((group) => ({
      ...group,
      views: group.views.filter((item) =>
        `${t(item)} ${t(`${item}Hint`)} ${item} ${t(group.id)}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    }))
    .filter((group) => group.views.length > 0)
  const View = views[view].load
  return (
    <>
      <PageHeader title={t('navigation')} description={t('subtitle')} />
      <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label={t('examples')} className="hidden lg:block">
          <div className="sticky top-20 grid max-h-[calc(100svh-6rem)] gap-4 overflow-y-auto pb-4">
            <Input
              type="search"
              aria-label={t('patternSearch')}
              placeholder={t('patternSearch')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {!groups.length && (
              <p role="status" className="px-2 text-sm text-muted-foreground">
                {t('patternNoResults')}
              </p>
            )}
            {groups.map((group) => (
              <div key={group.id}>
                <h3 className="mb-1 px-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t(group.id)}
                </h3>
                <ul className="grid gap-0.5">
                  {group.views.map((item) => {
                    const Icon = views[item].icon
                    return (
                      <li key={item}>
                        <Link
                          to="/compositions"
                          search={{ view: item }}
                          resetScroll={false}
                          aria-current={item === view ? 'page' : undefined}
                          className={cn(
                            'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                            item === view &&
                              'bg-accent font-medium text-foreground',
                          )}
                        >
                          <Icon aria-hidden="true" className="size-4" />
                          {t(item)}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>
        <div className="min-w-0">
          <div className="mb-4 lg:hidden">
            <Combobox
              value={view}
              onChange={(value) => {
                if (value)
                  void navigate({
                    search: { view: value as CompositionView },
                    resetScroll: false,
                  })
              }}
              placeholder={t('examples')}
              searchPlaceholder={t('patternSearch')}
              options={compositionGroups.flatMap((group) =>
                group.views.map((item) => ({
                  value: item,
                  label: t(item),
                  description: t(group.id),
                  icon: views[item].icon,
                })),
              )}
            />
          </div>
          <div className="mb-4 grid gap-1">
            <p className="text-xs font-medium text-muted-foreground">
              {t('patternLocal')}
            </p>
            <h2 className="text-base font-semibold">{t(view)}</h2>
            <p className="text-sm text-muted-foreground">{t(`${view}Hint`)}</p>
          </div>
          <div key={view} className="animate-page-in" data-composition={view}>
            <Suspense fallback={<Skeleton className="h-[28rem] rounded-xl" />}>
              <View />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  )
}
