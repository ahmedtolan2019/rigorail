import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Languages, Moon, Search, Sun, WifiOff } from 'lucide-react'
import { useServices } from '@/shared/api/services'
import { usePreferences } from '@/shared/preferences/store'
import { useTheme } from '@/shared/theme/theme-context'
import type { NavigationEntry } from '@/shared/routing/module'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Kbd } from '@/shared/ui/kbd'
import { Illustration } from '@/shared/ui/illustration'
import { Separator } from '@/shared/ui/separator'
import { Toaster } from '@/shared/ui/sonner'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { DirectionProvider } from '@/shared/ui/direction'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/breadcrumb'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/shared/ui/sidebar'
import { appConfig } from './config'
import { BrandMark } from '@/shared/brand/brand-mark'
import { dateTime } from '@/shared/lib/format'
import { isApple, useShortcut } from '@/shared/shortcuts/registry'
import { ShortcutsDialog } from '@/shared/shortcuts/shortcuts-dialog'
import {
  isActive,
  navigation,
  navigationSections,
  useVisible,
} from './navigation'
import { RouteProgress } from './route-progress'
import { UserMenu } from './user-menu'

// cmdk and the dialog stay out of the entry bundle; prefetched when the app is idle.
const loadCommandMenu = () => import('./command-menu')
const CommandMenu = lazy(() =>
  loadCommandMenu().then((module) => ({ default: module.CommandMenu })),
)

export function Shell() {
  const { i18n } = useTranslation()
  const preferences = usePreferences((state) => state.value)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const [commandOpen, setCommandOpen] = useState(false)
  const [commandLoaded, setCommandLoaded] = useState(false)
  useEffect(() => {
    const prefetch = () => void loadCommandMenu()
    if ('requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(prefetch, { timeout: 4000 })
      return () => window.cancelIdleCallback(handle)
    }
    const timer = setTimeout(prefetch, 2000)
    return () => clearTimeout(timer)
  }, [])
  useEffect(() => {
    document.documentElement.dataset.brand = preferences.brand
    document.documentElement.dataset.density = preferences.density
  }, [preferences.brand, preferences.density])
  useEffect(() => {
    document.querySelector<HTMLElement>('#main-content')?.focus()
  }, [pathname])
  const [helpOpen, setHelpOpen] = useState(false)
  const general = i18n.t('shortcutGeneral')
  useShortcut(
    { keys: 'mod+k', label: i18n.t('shortcutSearch'), group: general },
    () => {
      setCommandLoaded(true)
      setCommandOpen((value) => !value)
    },
  )
  useShortcut(
    { keys: '?', label: i18n.t('shortcutHelp'), group: general },
    () => setHelpOpen(true),
  )
  const dir = i18n.dir()
  const content = (
    <Content
      pathname={pathname}
      onSearch={() => {
        setCommandLoaded(true)
        setCommandOpen(true)
      }}
      sidebar={preferences.shell === 'sidebar'}
    />
  )
  return (
    <DirectionProvider dir={dir}>
      <RouteProgress />
      <a
        className="fixed -top-20 start-4 z-100 print:hidden rounded-md border-2 border-primary bg-background p-3 focus:top-4"
        href="#main-content"
      >
        {i18n.t('skip')}
      </a>
      {preferences.shell === 'sidebar' ? (
        <SidebarProvider>
          <AppSidebar pathname={pathname} />
          {content}
        </SidebarProvider>
      ) : (
        content
      )}
      {commandLoaded && (
        <Suspense fallback={null}>
          <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
        </Suspense>
      )}
      <ShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
      <Toaster
        dir={dir}
        position={dir === 'rtl' ? 'bottom-left' : 'bottom-right'}
      />
    </DirectionProvider>
  )
}

function Brand({
  compact = false,
  onNavigate,
}: {
  compact?: boolean
  onNavigate?: () => void
}) {
  const { t } = useTranslation()
  const { session, mode } = useServices()
  return (
    <Link
      {...navigation[0]!.link}
      onClick={onNavigate}
      className="flex min-w-0 items-center gap-2.5 rounded-md outline-none"
    >
      <BrandMark />
      {!compact && (
        <span className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
          <span className="truncate font-semibold">{appConfig.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {mode === 'demo'
              ? t(session.workspace.id === 'north' ? 'north' : 'south')
              : session.workspace.name}
          </span>
        </span>
      )}
    </Link>
  )
}

function AppSidebar({ pathname }: { pathname: string }) {
  const { t } = useTranslation()
  const { setOpenMobile } = useSidebar()
  // Links close the sheet on click; this also covers back/forward and the palette.
  useEffect(() => setOpenMobile(false), [pathname, setOpenMobile])
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-3 group-data-[collapsible=icon]:px-2">
        <Brand onNavigate={() => setOpenMobile(false)} />
      </SidebarHeader>
      <SidebarContent className="pt-2">
        {navigationSections.map((section) => (
          <SidebarGroup
            key={section.id}
            // Collapse a section when access rules hide all of its entries.
            className="not-has-[li]:hidden"
          >
            <SidebarGroupLabel>{t(section.labelKey)}</SidebarGroupLabel>
            <SidebarMenu>
              {navigation
                .filter((entry) => entry.section === section.id)
                .map((entry) => (
                  <NavigationItem
                    key={entry.labelKey}
                    entry={entry}
                    active={isActive(entry, pathname)}
                  />
                ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
        <div
          aria-hidden="true"
          data-sidebar-illustration=""
          className="pointer-events-none mt-auto flex h-44 shrink-0 items-end justify-center overflow-hidden px-4 pb-4 opacity-35 group-data-[collapsible=icon]:hidden dark:opacity-25 [@media(max-height:650px)]:hidden"
        >
          <Illustration
            name="workspace"
            className="size-44 animate-none sm:size-44 dark:brightness-100"
          />
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function NavigationItem({
  entry,
  active,
}: {
  entry: NavigationEntry
  active: boolean
}) {
  const { t } = useTranslation()
  const { setOpenMobile } = useSidebar()
  const Icon = entry.icon
  if (!useVisible(entry)) return null
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={t(entry.labelKey)}>
        <Link {...entry.link} onClick={() => setOpenMobile(false)}>
          <Icon aria-hidden="true" />
          <span>{t(entry.labelKey)}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function Content({
  pathname,
  sidebar,
  onSearch,
}: {
  pathname: string
  sidebar: boolean
  onSearch: () => void
}) {
  const { t } = useTranslation()
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  return (
    <div
      className="flex min-h-svh w-full min-w-0 flex-1 flex-col bg-background"
      data-shell={sidebar ? 'sidebar' : 'topbar'}
    >
      <AppHeader pathname={pathname} sidebar={sidebar} onSearch={onSearch} />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1440px] flex-1 p-(--page-space) outline-none print:max-w-none print:p-0"
      >
        {/* Identifies printed pages; screens never show it. */}
        <p className="mb-4 hidden border-b pb-2 text-xs text-muted-foreground print:block">
          {appConfig.name} · {dateTime()}
        </p>
        {!online && (
          <Alert className="mb-6">
            <WifiOff aria-hidden="true" />
            <AlertDescription>{t('offline')}</AlertDescription>
          </Alert>
        )}
        <div key={pathname} className="animate-page-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function AppHeader({
  pathname,
  sidebar,
  onSearch,
}: {
  pathname: string
  sidebar: boolean
  onSearch: () => void
}) {
  const { t, i18n } = useTranslation()
  const { session, mode } = useServices()
  const { resolvedTheme, setTheme } = useTheme()
  const section = navigation.find((entry) => isActive(entry, pathname))
  return (
    <header className="sticky top-0 z-20 flex h-14 print:hidden shrink-0 items-center gap-2 border-b bg-background/95 px-(--page-space)">
      {sidebar ? (
        <>
          <SidebarTrigger className="-ms-1.5" />
          <Separator orientation="vertical" className="me-1 h-5!" />
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem className="hidden truncate sm:inline-flex">
                {mode === 'demo'
                  ? t(session.workspace.id === 'north' ? 'north' : 'south')
                  : session.workspace.name}
              </BreadcrumbItem>
              {section && (
                <>
                  <BreadcrumbSeparator className="hidden sm:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="truncate font-medium">
                      {t(section.labelKey)}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </>
      ) : (
        <TopNavigation pathname={pathname} />
      )}
      <div className="ms-auto flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onSearch}
          aria-keyshortcuts={isApple() ? 'Meta+K' : 'Control+K'}
          className="h-8 gap-2 px-2 text-muted-foreground lg:w-56 lg:justify-start lg:px-3"
        >
          <Search aria-hidden="true" />
          {/* Visible text is the accessible name (WCAG 2.5.3); icon-only below lg. */}
          <span className="sr-only lg:not-sr-only">
            {t('searchPlaceholder')}
          </span>
          {/* The key hint is drawn with CSS so it never pollutes the name. */}
          <Kbd
            aria-hidden="true"
            data-keys={isApple() ? '⌘K' : 'Ctrl K'}
            className="ms-auto hidden after:content-[attr(data-keys)] lg:inline-flex"
          />
        </Button>
        {mode === 'demo' && (
          <Badge variant="secondary" className="hidden md:inline-flex">
            {t('demo')}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2"
          onClick={() =>
            void i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')
          }
          lang={i18n.language === 'ar' ? 'en' : 'ar'}
          aria-label={i18n.language === 'ar' ? 'English' : 'العربية'}
        >
          <Languages aria-hidden="true" />
          <span className="hidden sm:inline">
            {i18n.language === 'ar' ? 'English' : 'العربية'}
          </span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={t(
            resolvedTheme === 'dark' ? 'switchToLight' : 'switchToDark',
          )}
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          {resolvedTheme === 'dark' ? (
            <Sun aria-hidden="true" />
          ) : (
            <Moon aria-hidden="true" />
          )}
        </Button>
        {!sidebar && <UserMenu compact />}
      </div>
    </header>
  )
}

function TopNavigation({ pathname }: { pathname: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-w-0 items-center gap-4">
      <Brand compact />
      <nav
        aria-label={t('workspace')}
        className="relative -my-2 flex min-w-0 items-center gap-1 overflow-x-auto py-2"
      >
        {navigation.map((entry) => (
          <TopNavigationLink
            key={entry.labelKey}
            entry={entry}
            active={isActive(entry, pathname)}
          />
        ))}
      </nav>
    </div>
  )
}

function TopNavigationLink({
  entry,
  active,
}: {
  entry: NavigationEntry
  active: boolean
}) {
  const { t } = useTranslation()
  const Icon = entry.icon
  if (!useVisible(entry)) return null
  return (
    <Link
      {...entry.link}
      aria-label={t(entry.labelKey)}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
        active && 'bg-accent text-foreground',
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      <span className="sr-only md:not-sr-only">{t(entry.labelKey)}</span>
    </Link>
  )
}
