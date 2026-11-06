import { useEffect } from 'react'

let suffix = ''
/** Sets the application name appended to every tab title. Call once at startup. */
export function configureDocumentTitle(appName: string) {
  suffix = appName
  document.title = appName
}

/**
 * Sets the tab title to "Part · Part · App". It only writes `document.title` when the
 * resulting string changes: no state, no context and no re-render of any component.
 * `PageHeader` calls it for every page; pass record titles from detail pages.
 */
export function useDocumentTitle(...parts: (string | undefined | null)[]) {
  const title = [...parts, suffix].filter(Boolean).join(' · ')
  useEffect(() => {
    if (title) document.title = title
  }, [title])
}
