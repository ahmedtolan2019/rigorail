import { create } from 'zustand'
import { z } from 'zod'
export const preferencesSchema = z.object({
  brand: z.enum(['teal', 'indigo']),
  density: z.enum(['comfortable', 'compact']),
  shell: z.enum(['sidebar', 'topbar']),
})
export type Preferences = z.infer<typeof preferencesSchema>
interface PreferenceStore {
  value: Preferences
  configure: (key: string, defaults: Preferences) => void
  set: (patch: Partial<Preferences>) => void
  reset: () => void
}
let storageKey = '',
  initial: Preferences = {
    brand: 'teal',
    density: 'comfortable',
    shell: 'sidebar',
  }
export const usePreferences = create<PreferenceStore>((set, get) => ({
  value: initial,
  configure(key, defaults) {
    storageKey = `${key}:preferences:v1`
    initial = defaults
    let saved: unknown
    try {
      saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
    } catch {
      saved = null
    }
    set({
      value: preferencesSchema.safeParse(saved).success
        ? preferencesSchema.parse(saved)
        : defaults,
    })
  },
  set(patch) {
    const value = preferencesSchema.parse({ ...get().value, ...patch })
    set({ value })
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      /* Preferences remain usable without storage. */
    }
  },
  reset() {
    get().set(initial)
  },
}))
