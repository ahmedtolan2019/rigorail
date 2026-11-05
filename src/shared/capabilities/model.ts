import { z } from 'zod'
import type { Decision } from '../auth/model'

// Server-resolved values. Billing status is informational; entitlements decide access.
export const capabilitySchema = z.object({
  revision: z.string(),
  flags: z.record(z.string(), z.boolean()),
  entitlements: z.array(z.string()),
  subscription: z.object({
    plan: z.string(),
    status: z.enum(['trialing', 'active', 'past_due', 'cancelled', 'none']),
  }),
  quotas: z.record(
    z.string(),
    z.object({
      used: z.number().int().nonnegative(),
      limit: z.number().int().nonnegative().nullable(),
    }),
  ),
})
export type Capabilities = z.infer<typeof capabilitySchema>
export interface Requirements {
  flag?: string
  entitlement?: string
  quota?: string
}
export function evaluateCapability(
  value: Capabilities,
  requirements: Requirements,
): Decision {
  if (requirements.flag && value.flags[requirements.flag] !== true)
    return { status: 'denied', reason: 'featureDisabled' }
  if (
    requirements.entitlement &&
    !value.entitlements.includes(requirements.entitlement)
  )
    return { status: 'denied', reason: 'subscriptionRequired' }
  if (requirements.quota) {
    const quota = value.quotas[requirements.quota]
    if (!quota || (quota.limit !== null && quota.used >= quota.limit))
      return { status: 'denied', reason: 'quotaReached' }
  }
  return { status: 'allowed' }
}
