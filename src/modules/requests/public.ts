import { linkOptions } from '@tanstack/react-router'
import { Files } from 'lucide-react'
import type { ModuleDefinition } from '@/shared/routing/module'
import { ns } from './i18n'
import { permissions, requestPermissions } from './permissions'
export { requestRoutes } from './routes'
export { categoryIcons } from './categories'
export { requestPermissions } from './permissions'
export {
  bulkCommand,
  defaultRequestSearch,
  EXPORT_LIMIT,
  fromRequestQuery,
  requestCategories,
  requestInput,
  requestSchema,
  requestSearch,
  requestStatuses,
  toMinorUnits,
} from './schema'
export type { RequestFilter, RequestRecord } from './schema'

export const requestsModule = {
  id: ns,
  navigation: {
    link: linkOptions({ to: '/requests', search: {} }),
    labelKey: 'requests:navigation',
    icon: Files,
    section: 'main',
    requires: {
      flag: 'requests',
      entitlement: 'requests',
      action: permissions.read,
    },
  },
  permissions: requestPermissions,
  permissionLabels: () => import('./permission-labels'),
  // Server change events for requests refresh this module's cached lists and records.
  refreshOn: ['requests'],
} satisfies ModuleDefinition
