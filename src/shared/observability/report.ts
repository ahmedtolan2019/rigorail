import { ApiError } from '../api/client'
import { release } from './release'

export interface ErrorContext {
  /** Where it happened, for example `render`, `route`, `query`, `mutation`, `window`. */
  source: string
  /** Stable, non-sensitive tags such as a query key prefix. Never user data. */
  tags?: Record<string, string>
  /** Build identifier, added automatically. */
  release?: string
}
export type ErrorSink = (error: unknown, context: ErrorContext) => void

// Development prints to the console; production sends nothing until an app
// configures its error service (Sentry, Datadog, OpenTelemetry...) in app/.
let sink: ErrorSink = import.meta.env.DEV
  ? (error, context) => console.error(`[${context.source}]`, error)
  : () => undefined

/** Installs the application's error sink. Call once at startup, before rendering. */
export function configureErrorReporting(next: ErrorSink) {
  sink = next
}

/**
 * Expected outcomes are not defects: cancellations, and API answers the UI already
 * handles (401 sign-in, 403 denial, 404, 409 conflict, 422 validation, 429).
 */
export function isReportable(error: unknown) {
  const name =
    typeof error === 'object' && error !== null && 'name' in error
      ? error.name
      : undefined
  if (name === 'AbortError') return false
  if (error instanceof ApiError)
    return error.status === 0
      ? error.code !== 'network'
      : ![401, 403, 404, 409, 422, 429].includes(error.status)
  return true
}

/** Reports an unexpected failure. Never throws, so callers need no guard. */
export function reportError(error: unknown, context: ErrorContext) {
  if (!isReportable(error)) return
  try {
    sink(error, { ...context, release })
  } catch {
    /* A broken sink must not break the application. */
  }
}

/** Reports uncaught errors and unhandled promise rejections once per page. */
export function reportGlobalErrors() {
  window.addEventListener('error', (event) =>
    reportError(event.error ?? event.message, { source: 'window' }),
  )
  window.addEventListener('unhandledrejection', (event) =>
    reportError(event.reason, { source: 'promise' }),
  )
}
