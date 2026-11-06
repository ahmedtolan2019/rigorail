import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ownedSpecs, unregisterModule } from './remove-module.mjs'

test('unregisters a module import and every identifier it brought in', () => {
  const source = readFileSync('src/app/modules.ts', 'utf8')
  const result = unregisterModule(source, 'compositions')
  assert.deepEqual(result.names, ['compositionsModule', 'compositionRoutes'])
  assert(!result.source.includes('compositions'))
  assert(!/composition/i.test(result.source))
  // Other modules stay registered.
  assert(result.source.includes('requestsModule,'))
  assert(result.source.includes('...requestRoutes,'))
  assert.equal(unregisterModule(result.source, 'compositions'), null)
})

test('finds browser specs owned by naming convention only', () => {
  const files = [
    'compositions-rtl.spec.ts',
    'composition-patterns.spec.ts',
    'account.spec.ts',
    'template.spec.ts',
    'accounting.spec.ts',
  ]
  assert.deepEqual(ownedSpecs(files, 'compositions'), [
    'compositions-rtl.spec.ts',
    'composition-patterns.spec.ts',
  ])
  assert.deepEqual(ownedSpecs(files, 'account'), ['account.spec.ts'])
})
