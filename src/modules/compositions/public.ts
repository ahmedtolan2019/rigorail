import { linkOptions } from '@tanstack/react-router'
import { LayoutTemplate } from 'lucide-react'
import type { ModuleDefinition } from '@/shared/routing/module'
import { ns } from './i18n'
export { compositionRoutes } from './routes'

export const compositionsModule = {
  id: ns,
  navigation: {
    link: linkOptions({ to: '/compositions', search: {} }),
    labelKey: 'compositions:navigation',
    icon: LayoutTemplate,
    section: 'system',
  },
} satisfies ModuleDefinition
