import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { moduleFiles, registerModule } from './create-module.mjs'
import { unregisterModule } from './remove-module.mjs'

test('a scaffolded module has every required contract file', () => {
  const files = moduleFiles('purchase-orders')
  for (const required of ['AGENTS.md', 'contract.md', 'public.ts'])
    assert(files[required]?.trim(), `${required} is missing`)
  assert.match(files['public.ts'], /purchaseOrdersModule/)
  assert.match(files['permissions.ts'], /'purchase-orders\.read'/)
  assert.match(files['queries.ts'], /\['purchase-orders', scope\]/)
})

test('registration round-trips with module removal', () => {
  const source = readFileSync('src/app/modules.ts', 'utf8')
  const added = registerModule(source, 'purchase-orders')
  assert.match(added, /purchaseOrdersModule,/)
  assert.match(added, /\.\.\.purchaseOrdersRoutes,/)
  assert.equal(registerModule(added, 'purchase-orders'), null)
  assert.equal(unregisterModule(added, 'purchase-orders').source, source)
})
