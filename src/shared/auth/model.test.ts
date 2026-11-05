import { expect, test } from 'vitest'
import { createGrantAdapter, type Session } from './model'
const session: Session = {
  user: { id: 'a', name: 'A' },
  workspace: { id: 'north', name: 'North' },
  revision: '1',
  grants: [{ action: 'items.edit', scope: 'own', maxAmountMinor: 100 }],
}
const access = createGrantAdapter(session, [
  { action: 'items.edit', labelKey: 'edit', resource: true },
])
test('fails closed for unknown, missing, foreign, unowned and excessive records', () => {
  const record = {
    id: '1',
    workspaceId: 'north',
    ownerId: 'a',
    amountMinor: 100,
  }
  expect(access.decide('items.edit', record).status).toBe('allowed')
  expect(access.decide('items.delete', record).status).toBe('denied')
  expect(access.decide('items.edit').status).toBe('denied')
  for (const patch of [
    { workspaceId: 'south' },
    { ownerId: 'b' },
    { amountMinor: 101 },
  ])
    expect(access.decide('items.edit', { ...record, ...patch }).status).toBe(
      'denied',
    )
})
