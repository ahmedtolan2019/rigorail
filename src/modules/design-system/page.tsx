import { lazy, Suspense, useEffect, useRef } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/shared/ui/page'
import { Skeleton } from '@/shared/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { designSystemTabs, type DesignSystemTab } from './tabs'
import { ns } from './messages'

// Each section is its own chunk; the grid demo and catalog never load unless opened.
const sections = {
  foundations: lazy(() => import('./sections/foundations')),
  components: lazy(() => import('./sections/components')),
  patterns: lazy(() => import('./sections/patterns')),
  illustrations: lazy(() => import('./sections/illustrations')),
  catalog: lazy(() => import('./sections/catalog')),
}
const route = getRouteApi('/design-system')

export default function DesignSystem() {
  const { t } = useTranslation(ns)
  const { tab } = route.useSearch()
  const navigate = route.useNavigate()
  const Section = sections[tab]
  const activeTab = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    // A deep-linked tab may sit beyond the narrow scroll strip, especially in RTL.
    activeTab.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [tab])
  return (
    <>
      <PageHeader title={t('navigation')} description={t('subtitle')} />
      <Tabs
        value={tab}
        onValueChange={(value) =>
          void navigate({
            search: { tab: value as DesignSystemTab },
            resetScroll: false,
          })
        }
      >
        <TabsList className="mb-6 max-w-full justify-start overflow-x-auto">
          {designSystemTabs.map((value) => (
            <TabsTrigger
              key={value}
              value={value}
              ref={value === tab ? activeTab : undefined}
              className="px-3"
            >
              {t(value)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="animate-page-in">
          <Suspense fallback={<SectionSkeleton />}>
            <Section />
          </Suspense>
        </TabsContent>
      </Tabs>
    </>
  )
}

function SectionSkeleton() {
  const { t } = useTranslation()
  return (
    <div role="status" aria-label={t('loading')} className="grid gap-6">
      <Skeleton className="h-56 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  )
}
