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
  assert(!output.includes('src/modules/design-system/components.json'))
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

test('domain lookups surface composition discovery and authoring without dumping examples', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/context.mjs', 'requests'],
    { encoding: 'utf8' },
  )
  assert(output.includes('docs/pattern-coverage.md'))
  assert(output.includes('docs/composition-authoring.md'))
  assert(output.includes('npm run context -- compositions <view>'))
  assert(!output.includes('src/modules/compositions/patterns/workflow.tsx'))
})

test('focused lookup resolves retained composition loaders from source', () => {
  for (const [view, source] of [
    ['master-detail', 'views/master-detail.tsx'],
    ['record-tabs', 'views/record-tabs.tsx'],
  ]) {
    const output = execFileSync(
      process.execPath,
      ['scripts/context.mjs', 'compositions', view],
      { encoding: 'utf8' },
    )
    assert(output.includes(`Route: /compositions?view=${view}`))
    assert(output.includes(`Source: src/modules/compositions/${source}`))
    assert(output.includes('docs/composition-authoring.md'))
    assert(!output.includes('patterns/analytics.tsx'))
    assert(!output.includes('const views:'))
  }
})

test('invalid views and unsupported extra arguments fail without a misleading source', () => {
  for (const args of [
    ['compositions', '../../requests'],
    ['compositions', 'missing-view'],
    ['compositions', 'saved-views'],
    ['requests', 'master-detail'],
    ['compositions', 'record-tabs', 'extra'],
  ]) {
    const result = spawnSync(
      process.execPath,
      ['scripts/context.mjs', ...args],
      { encoding: 'utf8' },
    )
    assert.equal(result.status, 1)
    assert(!result.stdout.includes('Source:'))
  }
})
