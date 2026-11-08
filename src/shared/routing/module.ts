import type { LinkOptions } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import type { PermissionDefinition } from '../auth/model'
import type { Requirements } from '../capabilities/model'

/**
 * Sidebar groups. Add department groups here (and in `navigationSections` in
 * `src/app/navigation.ts`) when a product has many modules.
 */
export type NavigationSection = 'main' | 'system'

export interface NavigationEntry {
  /** Typed link to the module's landing route, including default search values. */
  link: LinkOptions
  /** Namespaced translation key, for example `requests:navigation`. */
  labelKey: `${string}:${string}`
  icon: LucideIcon
  /** Sidebar group. `main` holds business work; `system` holds settings and tooling. */
  section: NavigationSection
  /** Hides the entry when the capability or permission check does not allow it. */
  requires?: Requirements & { action?: string }
}

/** What a module contributes to app composition besides its route tree. */
export interface ModuleDefinition {
  /** Unique module id. It is also the translation namespace and permission prefix. */
  id: string
  /** One entry, or several when the module owns sub-modules (each with its own route). */
  navigation?: NavigationEntry | readonly NavigationEntry[]
  permissions?: readonly PermissionDefinition[]
  /**
   * Realtime topics that make this module's queries stale. Query keys must start
   * with the module id; see `shared/realtime/events.ts`.
   */
  refreshOn?: readonly string[]
}
