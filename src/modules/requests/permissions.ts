import type { PermissionDefinition } from '@/shared/auth/model'
export const permissions = {
  read: 'requests.read',
  create: 'requests.create',
  edit: 'requests.edit',
  submit: 'requests.submit',
  approve: 'requests.approve',
  suggest: 'requests.suggest',
} as const
export const requestPermissions: readonly PermissionDefinition[] = [
  { action: permissions.read, labelKey: 'permissionRead' },
  { action: permissions.create, labelKey: 'permissionCreate' },
  { action: permissions.edit, labelKey: 'permissionEdit', resource: true },
  { action: permissions.submit, labelKey: 'permissionSubmit', resource: true },
  {
    action: permissions.approve,
    labelKey: 'permissionApprove',
    resource: true,
  },
  { action: permissions.suggest, labelKey: 'permissionSuggest' },
]
