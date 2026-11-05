import type { LinkOptions } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import type { PermissionDefinition } from '../auth/model'
import type { Requirements } from '../capabilities/model'

export interface NavigationEntry {
  /** Typed link to the module's landing route, including default search values. */
  link: LinkOptions
  /** Namespaced translation key, for example `requests:navigation`. */
  labelKey: `${string}:${string}`
  icon: LucideIcon
  /** Sidebar group. `main` holds business work; `system` holds settings and tooling. */
  section: 'main' | 'system'
  /** Hides the entry when the capability or permission check does not allow it. */
  requires?: Requirements & { action?: string }
}

/** What a module contributes to app composition besides its route tree. */
export interface ModuleDefinition {
  /** Unique module id. It is also the translation namespace and permission prefix. */
  id: string
  navigation?: NavigationEntry
  permissions?: readonly PermissionDefinition[]
}
