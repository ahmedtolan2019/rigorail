import { execFileSync, spawnSync } from 'node:child_process'
import { test } from 'node:test'
import assert from 'node:assert/strict'
test('context command lists modules without dumping all implementation', () => {
  const output = execFileSync(process.execPath, ['scripts/context.mjs'], {
    encoding: 'utf8',
  })
  assert(output.includes('requests -> src/modules/requests/contract.md'))
  assert(!output.includes('Requests public contract'))
})
test('module context includes its contract and useful focused checks', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/context.mjs', 'requests'],
    { encoding: 'utf8' },
  )
  assert(output.includes('Requests public contract'))
  assert(output.includes('npm test -- src/modules/requests'))
  assert(!output.includes('src/modules/catalog/components.json'))
})
test('invalid module names cannot traverse the workspace', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/context.mjs', '../../'],
    { encoding: 'utf8' },
  )
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Choose an existing module/)
})
