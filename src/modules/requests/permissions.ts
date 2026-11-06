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
  { action: permissions.read, labelKey: 'requests:permissionRead' },
  { action: permissions.create, labelKey: 'requests:permissionCreate' },
  {
    action: permissions.edit,
    labelKey: 'requests:permissionEdit',
    resource: true,
  },
  {
    action: permissions.submit,
    labelKey: 'requests:permissionSubmit',
    resource: true,
  },
  {
    action: permissions.approve,
    labelKey: 'requests:permissionApprove',
    resource: true,
  },
  { action: permissions.suggest, labelKey: 'requests:permissionSuggest' },
]
