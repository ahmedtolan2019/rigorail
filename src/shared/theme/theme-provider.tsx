import { useEffect, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from './theme-context'

function readTheme(storageKey: string, fallback: Theme): Theme {
  try {
    const saved = localStorage.getItem(storageKey)
    return saved === 'light' || saved === 'dark' || saved === 'system'
      ? saved
      : fallback
  } catch {
    return fallback
  }
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
}: {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}) {
  const [theme, updateTheme] = useState<Theme>(() =>
    readTheme(storageKey, defaultTheme),
  )
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  )
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystemTheme(media.matches ? 'dark' : 'light')
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
    root.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  function setTheme(next: Theme) {
    updateTheme(next)
    try {
      localStorage.setItem(storageKey, next)
    } catch {
      // Theme changes remain usable when browser storage is unavailable.
    }
  }

  return (
    <ThemeContext value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext>
  )
}
