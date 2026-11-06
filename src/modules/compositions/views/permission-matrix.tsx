import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Lock } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import { ConfirmAction } from '@/shared/ui/confirm-action'
import { ns } from '../messages'

const roles = [
  'roleViewer',
  'roleRequester',
  'roleApprover',
  'roleFinance',
  'roleAdmin',
] as const
type Role = (typeof roles)[number]
const areas = [
  {
    key: 'areaRequests',
    actions: ['permView', 'permCreate', 'permApprove', 'permExport'],
  },
  { key: 'areaReports', actions: ['permView', 'permExport'] },
  { key: 'areaSuppliers', actions: ['permView', 'permEdit', 'permBlock'] },
  { key: 'areaAdmin', actions: ['permManageUsers', 'permBilling'] },
] as const
/** Permissions that can grant money movement or access are flagged for review. */
const sensitive = new Set([
  'areaRequests.permApprove',
  'areaSuppliers.permBlock',
  'areaAdmin.permManageUsers',
  'areaAdmin.permBilling',
])
const allKeys = areas.flatMap((area) =>
  area.actions.map((action) => `${area.key}.${action}`),
)
const grant = (keys: string[]) => new Set(keys)
const saved: Record<Role, Set<string>> = {
  roleViewer: grant([
    'areaRequests.permView',
    'areaReports.permView',
    'areaSuppliers.permView',
  ]),
  roleRequester: grant([
    'areaRequests.permView',
    'areaRequests.permCreate',
    'areaReports.permView',
    'areaSuppliers.permView',
  ]),
  roleApprover: grant([
    'areaRequests.permView',
    'areaRequests.permApprove',
    'areaReports.permView',
    'areaReports.permExport',
    'areaSuppliers.permView',
  ]),
  roleFinance: grant([
    'areaRequests.permView',
    'areaRequests.permExport',
    'areaReports.permView',
    'areaReports.permExport',
    'areaSuppliers.permView',
    'areaSuppliers.permEdit',
    'areaSuppliers.permBlock',
  ]),
  // The owner role keeps everything so a workspace can never lock itself out.
  roleAdmin: grant(allKeys),
}
const clone = (value: Record<Role, Set<string>>) =>
  Object.fromEntries(
    roles.map((role) => [role, new Set(value[role])]),
  ) as Record<Role, Set<string>>

export default function PermissionMatrix() {
  const { t } = useTranslation(ns)
  const [base, setBase] = useState(() => clone(saved))
  const [draft, setDraft] = useState(() => clone(saved))
  const changes = roles.flatMap((role) =>
    allKeys
      .filter((key) => base[role].has(key) !== draft[role].has(key))
      .map((key) => ({ role, key, on: draft[role].has(key) })),
  )
  const risky = changes.filter(
    (change) => change.on && sensitive.has(change.key),
  )
  const set = (role: Role, keys: string[], on: boolean) =>
    setDraft((current) => {
      const next = clone(current)
      for (const key of keys) {
        if (on) next[role].add(key)
        else next[role].delete(key)
      }
      return next
    })
  const state = (role: Role, keys: string[]) => {
    const count = keys.filter((key) => draft[role].has(key)).length
    return count === keys.length
      ? true
      : count === 0
        ? false
        : ('indeterminate' as const)
  }
  const name = (key: string) => {
    const [area, action] = key.split('.')
    return `${t(area!)}: ${t(action!)}`
  }

  return (
    <div className="grid gap-3">
      <Card className="min-w-0 gap-0 overflow-hidden py-0">
        <div className="max-h-[max(24rem,calc(100svh-16rem))] overflow-auto">
          <table className="w-full min-w-[42rem] border-separate border-spacing-0 text-sm">
            <caption className="sr-only">{t('permissionMatrix')}</caption>
            <thead className="sticky top-0 z-20 bg-card">
              <tr>
                <th
                  scope="col"
                  className="sticky start-0 z-10 border-b bg-card px-4 py-2.5 text-start text-xs font-medium text-muted-foreground"
                >
                  {t('permission')}
                </th>
                {roles.map((role) => (
                  <th
                    key={role}
                    scope="col"
                    className="border-b px-2 py-2.5 text-center text-xs font-medium"
                  >
                    <span className="flex flex-col items-center gap-1.5">
                      <span className="flex items-center gap-1">
                        {role === 'roleAdmin' && (
                          <Lock
                            aria-hidden="true"
                            className="size-3 text-muted-foreground"
                          />
                        )}
                        {t(role)}
                      </span>
                      <Checkbox
                        checked={state(role, allKeys)}
                        disabled={role === 'roleAdmin'}
                        onCheckedChange={(on) =>
                          set(role, allKeys, on === true)
                        }
                        aria-label={t('grantAll', { role: t(role) })}
                      />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {areas.map((area) => {
                const keys = area.actions.map(
                  (action) => `${area.key}.${action}`,
                )
                return (
                  <Fragment key={area.key}>
                    <tr>
                      <th
                        scope="rowgroup"
                        className="sticky start-0 z-10 border-b bg-muted px-4 py-1.5 text-start text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                      >
                        {t(area.key)}
                      </th>
                      {roles.map((role) => (
                        <td
                          key={role}
                          className="border-b bg-muted py-1.5 text-center"
                        >
                          <Checkbox
                            checked={state(role, keys)}
                            disabled={role === 'roleAdmin'}
                            onCheckedChange={(on) =>
                              set(role, keys, on === true)
                            }
                            aria-label={t('grantArea', {
                              area: t(area.key),
                              role: t(role),
                            })}
                          />
                        </td>
                      ))}
                    </tr>
                    {keys.map((key) => (
                      <tr key={key} className="group">
                        <th
                          scope="row"
                          className="sticky start-0 z-10 border-b bg-card px-4 py-2 text-start font-normal group-hover:bg-muted"
                        >
                          <span className="ps-3">{t(key.split('.')[1]!)}</span>
                          {sensitive.has(key) && (
                            <span className="ms-2 rounded-full bg-warning/12 px-1.5 text-[0.6875rem] font-medium text-warning">
                              {t('sensitive')}
                            </span>
                          )}
                        </th>
                        {roles.map((role) => {
                          const changed =
                            base[role].has(key) !== draft[role].has(key)
                          return (
                            <td
                              key={role}
                              className={cn(
                                'border-b py-2 text-center group-hover:bg-muted/50',
                                changed &&
                                  'bg-warning/10 group-hover:bg-warning/15',
                              )}
                            >
                              <Checkbox
                                checked={draft[role].has(key)}
                                disabled={role === 'roleAdmin'}
                                onCheckedChange={(on) =>
                                  set(role, [key], on === true)
                                }
                                aria-label={`${t(role)}: ${name(key)}`}
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {changes.length === 0
            ? t('noChanges')
            : t('permissionChanges', { count: changes.length })}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="ms-auto"
          disabled={changes.length === 0}
          onClick={() => setDraft(clone(base))}
        >
          {t('discard')}
        </Button>
        <ConfirmAction
          tone={risky.length > 0 ? 'destructive' : 'warning'}
          title={t('savePermissionsTitle', { count: changes.length })}
          description={
            risky.length > 0
              ? t('savePermissionsRisky')
              : t('savePermissionsHint')
          }
          chips={changes.map(
            (change) =>
              `${change.on ? '+' : '-'} ${t(change.role)}: ${name(change.key)}`,
          )}
          confirmLabel={t('save')}
          onConfirm={() => {
            setBase(clone(draft))
            toast.success(t('permissionsSaved'))
          }}
        >
          <Button size="sm" disabled={changes.length === 0}>
            {t('save')}
          </Button>
        </ConfirmAction>
      </div>
    </div>
  )
}
