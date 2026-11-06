import { linkOptions } from '@tanstack/react-router'
import { Blocks } from 'lucide-react'
import type { ModuleDefinition } from '@/shared/routing/module'
import { ns } from './i18n'
export { designSystemRoutes } from './routes'

export const designSystemModule = {
  id: ns,
  navigation: {
    link: linkOptions({ to: '/design-system', search: {} }),
    labelKey: 'design-system:navigation',
    icon: Blocks,
    section: 'system',
  },
} satisfies ModuleDefinition
