import { test } from 'node:test'
import assert from 'node:assert/strict'
import { allowedImport } from './architecture-rules.mjs'
test('shared code cannot depend on app composition or business modules', () => {
  assert.equal(allowedImport('shared/ui/button.tsx', 'app/config.ts'), false)
  assert.equal(
    allowedImport('shared/api/client.ts', 'modules/requests/public.ts'),
    false,
  )
})
test('domain consumers must use public contracts and cannot import app wiring', () => {
  assert.equal(
    allowedImport('modules/invoices/page.tsx', 'modules/requests/schema.ts'),
    false,
  )
  assert.equal(
    allowedImport('modules/invoices/page.tsx', 'modules/requests/public.ts'),
    true,
  )
  assert.equal(
    allowedImport('modules/requests/page.tsx', 'app/runtime.ts'),
    false,
  )
  assert.equal(
    allowedImport('app/router.tsx', 'modules/requests/pages/list.tsx'),
    false,
  )
  assert.equal(
    allowedImport('app/router.tsx', 'modules/requests/public.ts'),
    true,
  )
  assert.equal(
    allowedImport(
      'modules/requests/pages/list.tsx',
      'modules/requests/schema.ts',
    ),
    true,
  )
})

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { auditArchitecture } from './architecture-audit.mjs'
function audit(files) {
  const root = mkdtempSync(path.join(tmpdir(), 'template-boundaries-'))
  try {
    const baseline = {
      'tsconfig.app.json': JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: { '@/*': ['./src/*'] },
          moduleResolution: 'bundler',
        },
      }),
      'src/app/main.ts': 'export {}',
      'src/modules/a/public.ts': 'export {}',
      'src/modules/a/AGENTS.md': 'Read contract.md',
      'src/modules/a/contract.md': 'Module A contract',
    }
    for (const [file, content] of Object.entries({ ...baseline, ...files })) {
      mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
      writeFileSync(path.join(root, file), content)
    }
    return auditArchitecture(root).issues
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}
test('resolves aliases, relative imports, re-exports and literal dynamic imports', () => {
  const issues = audit({
    'src/modules/a/private.ts': 'export const value = 1',
    'src/app/main.ts':
      "import { value } from '@/modules/a/private'; export * from '../modules/a/private'; import('@/modules/a/private')",
  })
  assert.equal(
    issues.filter((issue) => issue.includes('violates module ownership'))
      .length,
    3,
  )
})
test('rejects nested public files as a private-contract escape', () => {
  assert.equal(
    allowedImport('app/router.tsx', 'modules/requests/internal/public.ts'),
    false,
  )
})
test('rejects computed loaders, CommonJS and glob bypasses', () => {
  const issues = audit({
    'src/app/main.ts':
      "const name = 'x'; import(name); require('@/modules/a/private'); import.meta.glob('../modules/**/*.ts')",
  })
  assert.equal(
    issues.filter(
      (issue) => issue.includes('bypass') || issue.includes('explicit ESM'),
    ).length,
    3,
  )
})
test('requires documented module contracts and recognized source layers', () => {
  const issues = audit({
    'src/modules/b/page.ts': 'export {}',
    'src/features/page.ts': 'export {}',
  })
  assert.equal(
    issues.filter((issue) => issue.includes('missing module entry contract'))
      .length,
    3,
  )
  assert(issues.some((issue) => issue.includes('unregistered source layer')))
})
test('detects runtime cycles while ignoring inline type-only edges', () => {
  assert(
    audit({
      'src/shared/a.ts': "import './b'; export type A = string",
      'src/shared/b.ts': "import './a'",
    }).some((issue) => issue.startsWith('Cycle:')),
  )
  assert.deepEqual(
    audit({
      'src/shared/a.ts': "import './b'; export type A = string",
      'src/shared/b.ts': "import { type A } from './a'; export type B = A",
    }),
    [],
  )
})
test('rejects production dependencies on tests, Node-only imports and untyped source', () => {
  const issues = audit({
    'src/app/main.ts': "import '../test/fixture'; import fs from 'node:fs'",
    'src/test/fixture.ts': 'export {}',
    'src/app/escape.js': 'export {}',
  })
  assert(issues.some((issue) => issue.includes('violates module ownership')))
  assert(issues.some((issue) => issue.includes('Node-only')))
  assert(issues.some((issue) => issue.includes('must use TypeScript')))
})
test('requires resolvable internal imports, including type imports', () => {
  const issues = audit({
    'src/app/main.ts':
      "import type { Missing } from '@/modules/a/missing'; type Hidden = import('@/modules/a/private').Hidden",
    'src/modules/a/private.ts': 'export type Hidden = string',
  })
  assert(issues.some((issue) => issue.includes('unresolved internal import')))
  assert(issues.some((issue) => issue.includes('violates module ownership')))
})

test('entry point cannot bypass module public contracts', () => {
  assert(
    audit({
      'src/main.tsx': "import './modules/a/private'",
      'src/modules/a/private.ts': 'export {}',
    }).some((issue) => issue.includes('violates module ownership')),
  )
})
test('alternate TypeScript extensions cannot bypass source scanning', () => {
  assert(
    audit({ 'src/shared/escape.mts': "import '../modules/a/public'" }).some(
      (issue) => issue.includes('unsupported source extension'),
    ),
  )
})
test('assets follow ownership and must exist', () => {
  const issues = audit({
    'src/shared/widget.ts':
      "import '../modules/a/private.css'; import './missing.css'",
    'src/modules/a/private.css': ':root {}',
  })
  assert(issues.some((issue) => issue.includes('violates module ownership')))
  assert(issues.some((issue) => issue.includes('unresolved internal import')))
})

test('entry imports of global CSS are explicit and legitimate', () => {
  assert.deepEqual(
    audit({
      'src/main.tsx': "import './index.css'",
      'src/index.css': ':root {}',
    }),
    [],
  )
})
test('source cannot route around ownership through root helpers', () => {
  assert(
    audit({
      'src/shared/widget.ts': "import '../../helper'",
      'helper.ts': 'export {}',
    }).some((issue) => issue.includes('must remain inside src')),
  )
})
