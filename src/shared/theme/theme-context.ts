import { createContext, useContext } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export const ThemeContext = createContext<
  | {
      theme: Theme
      resolvedTheme: 'light' | 'dark'
      setTheme: (theme: Theme) => void
    }
  | undefined
>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
