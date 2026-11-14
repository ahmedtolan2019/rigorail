import { useCapability } from '@/shared/capabilities/hooks'
import type { NavigationEntry, NavigationSection } from '@/shared/routing/module'
import { modules } from './modules'

// A module contributes one entry, or several when it owns sub-modules.
export const navigation: NavigationEntry[] = modules.flatMap((module) =>
  module.navigation === undefined
    ? []
    : Array.isArray(module.navigation)
      ? [...module.navigation]
      : [module.navigation as NavigationEntry],
)
export const navigationSections = [
  { id: 'main', labelKey: 'navMain' },
  { id: 'system', labelKey: 'navSystem' },
] as const satisfies readonly { id: NavigationSection; labelKey: string }[]

const matches = (to: string, pathname: string) => pathname === to || pathname.startsWith(`${to}/`)
export function isActive(entry: NavigationEntry, pathname: string) {
  const to = entry.link.to ?? ''
  if (!matches(to, pathname)) return false
  // A deeper entry under the same path (/engineering/drawings) wins over its parent (/engineering).
  return !navigation.some((other) => (other.link.to ?? '').length > to.length && matches(other.link.to ?? '', pathname))
}

/** Hides entries the user cannot use. Direct routes still check access themselves. */
export function useVisible(entry: NavigationEntry) {
  const access = useCapability(entry.requires ?? {})
  return !entry.requires || access.status === 'allowed'
}
