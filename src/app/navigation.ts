import { useCapability } from '@/shared/capabilities/hooks'
import type { NavigationEntry } from '@/shared/routing/module'
import { modules } from './modules'

export const navigation = modules.flatMap((module) =>
  module.navigation ? [module.navigation] : [],
)
export const navigationSections = [
  { id: 'main', labelKey: 'navMain' },
  { id: 'system', labelKey: 'navSystem' },
] as const

export function isActive(entry: NavigationEntry, pathname: string) {
  const to = entry.link.to ?? ''
  return pathname === to || pathname.startsWith(`${to}/`)
}

/** Hides entries the user cannot use. Direct routes still check access themselves. */
export function useVisible(entry: NavigationEntry) {
  const access = useCapability(entry.requires ?? {})
  return !entry.requires || access.status === 'allowed'
}
