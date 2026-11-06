import { ShieldCheck } from 'lucide-react'
import type { ModuleDefinition } from '@/shared/routing/module'
import { ns } from './i18n'
export { accessRoutes } from './routes'

export const accessModule = {
  id: ns,
  navigation: {
    link: { to: '/access' },
    labelKey: 'access:navigation',
    icon: ShieldCheck,
    section: 'system',
  },
} satisfies ModuleDefinition
