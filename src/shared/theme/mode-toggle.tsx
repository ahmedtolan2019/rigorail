import { Moon, Sun } from 'lucide-react'

import { Switch } from '@/shared/ui/switch'
import { useTheme } from '@/shared/theme/theme-context'

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  const isDark = resolvedTheme === 'dark'

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <div className="flex items-center space-x-2">
      <Sun className="size-5 text-muted-foreground" />
      <Switch
        id="dark-mode-toggle"
        checked={isDark}
        onCheckedChange={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      />
      <Moon className="size-5 text-muted-foreground" />
    </div>
  )
}
