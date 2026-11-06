import { z } from 'zod'

export interface PermissionDefinition {
  /** Action name prefixed with the declaring module id, for example `requests.read`. */
  action: string
  /** Namespaced translation key owned by the declaring module, for example `requests:permissionRead`. */
  labelKey: string
  resource?: boolean
}
/**
 * Merges module permission vocabularies into one catalog. Fails fast on duplicate
 * module ids or actions and on actions/labels outside the declaring module.
 */
export function composePermissionCatalog(
  modules: readonly {
    id: string
    permissions?: readonly PermissionDefinition[]
  }[],
): readonly PermissionDefinition[] {
  const ids = new Set<string>(),
    actions = new Set<string>()
  return modules.flatMap(({ id, permissions = [] }) => {
    if (ids.has(id)) throw new Error(`Module "${id}" is registered twice.`)
    ids.add(id)
    return permissions.map((definition) => {
      if (!definition.action.startsWith(`${id}.`))
        throw new Error(
          `Permission "${definition.action}" must start with "${id}.".`,
        )
      if (!definition.labelKey.startsWith(`${id}:`))
        throw new Error(
          `Label "${definition.labelKey}" must use the "${id}" namespace.`,
        )
      if (actions.has(definition.action))
        throw new Error(`Permission "${definition.action}" is declared twice.`)
      actions.add(definition.action)
      return definition
    })
  })
}
export interface Resource {
  id: string
  workspaceId: string
  ownerId?: string
  amountMinor?: number
}
export type Decision =
  | { status: 'allowed' }
  | { status: 'denied' | 'loading' | 'error'; reason: string }
export const sessionSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    /** Optional; shown in the account menu when the backend provides it. */
    email: z.string().optional(),
  }),
  workspace: z.object({
    id: z.string(),
    name: z.string(),
    /** IANA zone for business dates; the browser's zone when absent. */
    timeZone: z.string().optional(),
  }),
  revision: z.string(),
  grants: z.array(
    z.object({
      action: z.string(),
      scope: z.enum(['workspace', 'own']),
      maxAmountMinor: z.number().int().nonnegative().optional(),
    }),
  ),
})
export type Session = z.infer<typeof sessionSchema>
export interface AuthorizationAdapter {
  decide(action: string, resource?: Resource): Decision
}

// This adapter implements the documented sample grant contract; replace it for another policy model.
export function createGrantAdapter(
  session: Session,
  catalog: readonly PermissionDefinition[],
): AuthorizationAdapter {
  const definitions = new Map(catalog.map((item) => [item.action, item]))
  return {
    decide(action, resource) {
      const definition = definitions.get(action)
      if (!definition) return { status: 'denied', reason: 'deniedHint' }
      if (definition.resource && !resource)
        return { status: 'denied', reason: 'recordRequired' }
      if (resource && resource.workspaceId !== session.workspace.id)
        return { status: 'denied', reason: 'deniedHint' }
      const allowed = session.grants.some(
        (grant) =>
          grant.action === action &&
          (grant.scope !== 'own' || resource?.ownerId === session.user.id) &&
          (grant.maxAmountMinor === undefined ||
            (resource?.amountMinor !== undefined &&
              resource.amountMinor <= grant.maxAmountMinor)),
      )
      return allowed
        ? { status: 'allowed' }
        : { status: 'denied', reason: 'deniedHint' }
    },
  }
}
