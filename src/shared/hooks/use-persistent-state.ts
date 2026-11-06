import { useState } from 'react'

/** UI-only state (column visibility, panel sizes) remembered in localStorage. Never business data. */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved === null ? initial : (JSON.parse(saved) as T)
    } catch {
      return initial
    }
  })
  const update = (next: T | ((current: T) => T)) =>
    setValue((current) => {
      const resolved =
        typeof next === 'function' ? (next as (current: T) => T)(current) : next
      try {
        localStorage.setItem(key, JSON.stringify(resolved))
      } catch {
        /* Storage is optional. */
      }
      return resolved
    })
  return [value, update] as const
}
