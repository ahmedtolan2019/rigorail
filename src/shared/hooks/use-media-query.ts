import { useSyncExternalStore } from 'react'

/**
 * Subscribes to a CSS media query, for example `(min-width: 64rem)`. Use it to skip
 * mounting heavy content (charts, editors) that CSS would hide anyway; prefer plain
 * responsive classes for layout.
 */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
