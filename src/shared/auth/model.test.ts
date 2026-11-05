import { expect, test } from 'vitest'
import {
  composePermissionCatalog,
  createGrantAdapter,
  type Session,
} from './model'
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

test('composes module permission catalogs and rejects collisions', () => {
  const read = { action: 'items.read', labelKey: 'items:read' }
  expect(
    composePermissionCatalog([
      { id: 'items', permissions: [read] },
      { id: 'settings' },
    ]),
  ).toEqual([read])
  expect(() =>
    composePermissionCatalog([
      { id: 'items', permissions: [read] },
      { id: 'items' },
    ]),
  ).toThrow('registered twice')
  expect(() =>
    composePermissionCatalog([{ id: 'items', permissions: [read, read] }]),
  ).toThrow('declared twice')
  expect(() =>
    composePermissionCatalog([{ id: 'orders', permissions: [read] }]),
  ).toThrow('must start with "orders."')
  expect(() =>
    composePermissionCatalog([
      { id: 'items', permissions: [{ ...read, labelKey: 'common:read' }] },
    ]),
  ).toThrow('"items" namespace')
})
