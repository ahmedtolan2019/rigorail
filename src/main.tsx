import { AppErrorBoundary } from './shared/ui/error-boundary'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './app/styles.css'
import { configureLocale } from './shared/i18n'
import { appConfig } from './app/config'
import { Bootstrap } from './app/bootstrap'
configureLocale(appConfig.id)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <Bootstrap />
    </AppErrorBoundary>
  </StrictMode>,
)
