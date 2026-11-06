import { Palette } from 'lucide-react'
import type { ModuleDefinition } from '@/shared/routing/module'
import { ns } from './i18n'
export { appearanceRoutes } from './routes'

export const appearanceModule = {
  id: ns,
  navigation: {
    link: { to: '/appearance' },
    labelKey: 'appearance:navigation',
    icon: Palette,
    section: 'system',
  },
} satisfies ModuleDefinition
