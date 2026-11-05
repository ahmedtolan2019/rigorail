import type { PermissionDefinition } from '@/shared/auth/model'
export const permissions = { read: 'reports.read' } as const
export const reportPermissions: readonly PermissionDefinition[] = [
  { action: permissions.read, labelKey: 'reports:permissionRead' },
]
