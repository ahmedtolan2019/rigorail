import { useEffect, useRef } from 'react'
import { create } from 'zustand'

/**
 * Keys use `mod` for ⌘ on Apple platforms and Ctrl elsewhere, for example
 * `mod+k`, `shift+?`, `/` or `n`. Single-key shortcuts never fire while typing.
 */
export interface Shortcut {
  keys: string
  /** Translated description shown in the shortcuts help. */
  label: string
  /** Translated group heading, for example "General" or the page name. */
  group: string
}
interface Registry {
  shortcuts: Map<string, Shortcut>
  add: (id: string, shortcut: Shortcut) => void
  remove: (id: string) => void
}
export const useShortcutRegistry = create<Registry>((set) => ({
  shortcuts: new Map(),
  add: (id, shortcut) =>
    set((state) => ({ shortcuts: new Map(state.shortcuts).set(id, shortcut) })),
  remove: (id) =>
    set((state) => {
      const next = new Map(state.shortcuts)
      next.delete(id)
      return { shortcuts: next }
    }),
}))

export const isApple = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

/** True when the event matches `keys`; exported for tests. */
export function matches(event: KeyboardEvent, keys: string, apple = isApple()) {
  const parts = keys.toLowerCase().split('+')
  const key = parts.pop()!
  const mod = parts.includes('mod')
  const shift = parts.includes('shift')
  const alt = parts.includes('alt')
  if (mod !== (apple ? event.metaKey : event.ctrlKey)) return false
  if ((apple ? event.ctrlKey : event.metaKey) || alt !== event.altKey)
    return false
  // Symbols such as "?" already imply Shift on most layouts.
  if (shift && !event.shiftKey) return false
  if (!shift && event.shiftKey && /^[a-z0-9]$/.test(key)) return false
  if (event.key.toLowerCase() === key) return true
  // Layout-independent fallback: Arabic and other layouts type different
  // characters on the slash key (for example "؟" with Shift).
  if (key === '?') return event.code === 'Slash' && event.shiftKey
  if (key === '/') return event.code === 'Slash' && !event.shiftKey
  return false
}

function typing(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
  )
}

/**
 * Binds a keyboard shortcut while the component is mounted and lists it in the
 * shortcuts help (`?`). Shortcuts without `mod` are ignored inside form fields.
 */
export function useShortcut(
  shortcut: Shortcut & { enabled?: boolean },
  handler: (event: KeyboardEvent) => void,
) {
  const latest = useRef(handler)
  useEffect(() => {
    latest.current = handler
  })
  const { keys, label, group, enabled = true } = shortcut
  useEffect(() => {
    if (!enabled) return
    const id = `${group}:${keys}`
    useShortcutRegistry.getState().add(id, { keys, label, group })
    const listen = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !matches(event, keys)) return
      if (!keys.includes('mod') && typing(event.target)) return
      event.preventDefault()
      latest.current(event)
    }
    window.addEventListener('keydown', listen)
    return () => {
      window.removeEventListener('keydown', listen)
      useShortcutRegistry.getState().remove(id)
    }
  }, [keys, label, group, enabled])
}
