import { linkOptions } from '@tanstack/react-router'
import { ChartColumnBig } from 'lucide-react'
import type { ModuleDefinition } from '@/shared/routing/module'
import { ns } from './i18n'
import { permissions, reportPermissions } from './permissions'
export { reportRoutes } from './routes'
export { requestReportSchema } from './schema'
export { reportPermissions } from './permissions'
export type { RequestReport } from './schema'

export const reportsModule = {
  id: ns,
  navigation: {
    link: linkOptions({ to: '/reports', search: {} }),
    labelKey: 'reports:navigation',
    icon: ChartColumnBig,
    section: 'main',
    requires: {
      flag: 'requests',
      entitlement: 'requests',
      action: permissions.read,
    },
  },
  permissions: reportPermissions,
} satisfies ModuleDefinition
