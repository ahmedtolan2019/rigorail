import { release } from './release'

/** Flat, non-identifying values only: never names, emails, record content or ids. */
export type AnalyticsProps = Record<string, string | number | boolean>
export type AnalyticsSink = (event: string, props: AnalyticsProps) => void

// Nothing leaves the browser until an app installs its product analytics in main.tsx.
let sink: AnalyticsSink = import.meta.env.DEV
  ? (event, props) => console.debug(`[analytics] ${event}`, props)
  : () => undefined

export function configureAnalytics(next: AnalyticsSink) {
  sink = next
}

/**
 * Records a product event in snake_case, for example `request_submitted`. Never
 * throws. Respect consent: install the sink only after the user agrees, if required.
 */
export function track(event: string, props: AnalyticsProps = {}) {
  try {
    sink(event, { ...props, release })
  } catch {
    /* Analytics must never break the product. */
  }
}

/**
 * Core Web Vitals (LCP, INP, CLS) as `web_vital` events, loaded after startup so
 * the measuring code stays out of the entry bundle.
 */
export function reportWebVitals() {
  const start = () =>
    void import('web-vitals').then(({ onCLS, onINP, onLCP }) => {
      for (const subscribe of [onCLS, onINP, onLCP])
        subscribe((metric) =>
          track('web_vital', {
            name: metric.name,
            value: Math.round(
              metric.name === 'CLS' ? metric.value * 1000 : metric.value,
            ),
            rating: metric.rating,
          }),
        )
    })
  if ('requestIdleCallback' in window) window.requestIdleCallback(start)
  else setTimeout(start, 1000)
}
