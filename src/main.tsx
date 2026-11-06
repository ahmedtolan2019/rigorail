import { AppErrorBoundary } from './shared/ui/error-boundary'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { configureLocale } from './shared/i18n'
import { configureDocumentTitle } from './shared/hooks/use-document-title'
import { appConfig } from './app/config'
import { Bootstrap } from './app/bootstrap'
import { reportError, reportGlobalErrors } from './shared/observability/report'
import { recoverFromStaleDeploys } from './shared/observability/stale-deploy'
import { reportWebVitals } from './shared/observability/analytics'
// Install production services here: configureErrorReporting(sink) for errors and
// configureAnalytics(sink) for product events and Web Vitals (after consent).
reportGlobalErrors()
reportWebVitals()
recoverFromStaleDeploys()
configureLocale(appConfig.id)
configureDocumentTitle(appConfig.name)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary
      onError={(error) => reportError(error, { source: 'render' })}
    >
      <Bootstrap />
    </AppErrorBoundary>
  </StrictMode>,
)
