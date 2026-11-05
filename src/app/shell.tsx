import { useEffect, useState } from 'react'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Files, Palette, ShieldCheck, Boxes } from 'lucide-react'
import { useCapability } from '@/shared/capabilities/hooks'
import { useServices } from '@/shared/api/services'
import { usePreferences } from '@/shared/preferences/store'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { DirectionProvider } from '@/shared/ui/direction'
import { appConfig } from './config'
const links = [
  { to: '/requests', key: 'requests', icon: Files },
  { to: '/appearance', key: 'appearance', icon: Palette },
  { to: '/access', key: 'access', icon: ShieldCheck },
  { to: '/components', key: 'components', icon: Boxes },
] as const
export function Shell() {
  const { t, i18n } = useTranslation()
  const preferences = usePreferences((state) => state.value)
  const { session, mode } = useServices()
  const requests = useCapability({
    flag: 'requests',
    entitlement: 'requests',
    action: 'requests.read',
  })
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
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
  useEffect(() => {
    document.documentElement.dataset.brand = preferences.brand
    document.documentElement.dataset.density = preferences.density
  }, [preferences.brand, preferences.density])
  useEffect(() => {
    document.querySelector<HTMLElement>('#main-content')?.focus()
  }, [pathname])
  const section =
    links.find((link) => pathname.startsWith(link.to))?.key ?? 'requests'
  return (
    <DirectionProvider dir={i18n.dir()}>
      <div className="app-shell" data-shell={preferences.shell}>
        <a className="skip-link" href="#main-content">
          {t('skip')}
        </a>
        <aside className="app-sidebar">
          <Link
            className="brand"
            to="/requests"
            search={{ q: '', status: 'all', page: 1, sort: 'updated' }}
          >
            {appConfig.name}
          </Link>
          <nav aria-label={t('workspace')}>
            {links
              .filter(
                (link) =>
                  link.key !== 'requests' || requests.status === 'allowed',
              )
              .map(({ to, key, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  search={
                    to === '/requests'
                      ? { q: '', status: 'all', page: 1, sort: 'updated' }
                      : undefined
                  }
                  activeProps={{ className: 'active' }}
                >
                  <Icon aria-hidden="true" />
                  {t(key)}
                </Link>
              ))}
          </nav>
          <p className="sidebar-note">
            {t('sessionUser', { name: session.user.name })}
          </p>
        </aside>
        <div className="app-body">
          <header className="app-header">
            <div className="breadcrumb">
              <span>
                {mode === 'demo'
                  ? t(session.workspace.id === 'north' ? 'north' : 'south')
                  : session.workspace.name}
              </span>
              <span aria-hidden="true">/</span>
              <strong>{t(section)}</strong>
            </div>
            <div className="header-actions">
              {mode === 'demo' && (
                <Badge variant="secondary">{t('demo')}</Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  void i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')
                }
                lang={i18n.language === 'ar' ? 'en' : 'ar'}
              >
                {i18n.language === 'ar' ? 'English' : 'العربية'}
              </Button>
            </div>
          </header>
          <main id="main-content" tabIndex={-1}>
            {!online && (
              <Alert>
                <AlertDescription>{t('offline')}</AlertDescription>
              </Alert>
            )}
            <Outlet />
          </main>
        </div>
      </div>
    </DirectionProvider>
  )
}
