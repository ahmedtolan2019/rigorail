import { composePermissionCatalog } from '@/shared/auth/model'
import type { ModuleDefinition } from '@/shared/routing/module'
import { requestsModule, requestRoutes } from '@/modules/requests/public'
import { reportsModule, reportRoutes } from '@/modules/reports/public'
import { appearanceModule, appearanceRoutes } from '@/modules/appearance/public'
import { accessModule, accessRoutes } from '@/modules/access/public'
import { accountModule, accountRoutes } from '@/modules/account/public'
import {
  compositionsModule,
  compositionRoutes,
} from '@/modules/compositions/public'
import {
  designSystemModule,
  designSystemRoutes,
} from '@/modules/design-system/public'

// The single place where modules are enabled. Add a module here in both lists:
// definitions drive navigation and permissions, routes keep the router fully typed.
// router.test.ts checks that every navigation entry resolves to a registered route.
export const modules: readonly ModuleDefinition[] = [
  requestsModule,
  reportsModule,
  appearanceModule,
  accessModule,
  accountModule,
  designSystemModule,
  compositionsModule,
]
export const moduleRoutes = [
  ...requestRoutes,
  ...reportRoutes,
  ...appearanceRoutes,
  ...accessRoutes,
  ...accountRoutes,
  ...designSystemRoutes,
  ...compositionRoutes,
] as const
export const permissionCatalog = composePermissionCatalog(modules)
