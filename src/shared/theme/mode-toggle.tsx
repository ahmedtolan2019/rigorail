import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Switch } from '@/shared/ui/switch'
import { useTheme } from '@/shared/theme/theme-context'

export function ModeToggle() {
  const { t } = useTranslation()
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  return (
    <div className="flex items-center gap-2">
      <Sun aria-hidden="true" className="size-5 text-muted-foreground" />
      <Switch
        id="dark-mode-toggle"
        checked={isDark}
        onCheckedChange={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label={t(isDark ? 'switchToLight' : 'switchToDark')}
      />
      <Moon aria-hidden="true" className="size-5 text-muted-foreground" />
    </div>
  )
}
