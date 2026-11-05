import { expect, test } from 'vitest'
import { evaluateCapability, type Capabilities } from './model'
const value: Capabilities = {
  revision: '1',
  flags: { reports: true },
  entitlements: ['reports'],
  subscription: { plan: 'pro', status: 'past_due' },
  quotas: { exports: { used: 10, limit: 10 } },
}
test('evaluates flags, entitlements and quotas independently; billing status is not authorization', () => {
  expect(
    evaluateCapability(value, { flag: 'reports', entitlement: 'reports' })
      .status,
  ).toBe('allowed')
  expect(evaluateCapability(value, { flag: 'unknown' })).toMatchObject({
    reason: 'featureDisabled',
  })
  expect(evaluateCapability(value, { entitlement: 'unknown' })).toMatchObject({
    reason: 'subscriptionRequired',
  })
  expect(evaluateCapability(value, { quota: 'exports' })).toMatchObject({
    reason: 'quotaReached',
  })
  expect(evaluateCapability(value, { quota: 'unknown' }).status).toBe('denied')
  expect(
    evaluateCapability(
      { ...value, quotas: { exports: { used: 1000, limit: null } } },
      { quota: 'exports' },
    ).status,
  ).toBe('allowed')
})
