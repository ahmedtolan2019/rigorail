import { z } from 'zod'

export interface PermissionDefinition {
  action: string
  /** Translation key owned by the declaring domain. */
  labelKey: string
  resource?: boolean
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
  user: z.object({ id: z.string(), name: z.string() }),
  workspace: z.object({ id: z.string(), name: z.string() }),
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
