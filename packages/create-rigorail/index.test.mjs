import { spawnSync } from 'node:child_process'
import { mkdtempSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { parseArgs, personalizePackage, toPackageName } from './index.mjs'

test('arguments: directory, ref, install and git flags', () => {
  assert.deepEqual(
    parseArgs(['my-app', '--ref', 'v1.0.0', '--install', '--no-git']),
    {
      directory: 'my-app',
      ref: 'v1.0.0',
      install: true,
      git: false,
      help: false,
    },
  )
  assert.equal(parseArgs(['--ref=next']).ref, 'next')
  assert.throws(() => parseArgs(['--unknown']), /Unknown option/)
  assert.throws(() => parseArgs(['a', 'b']), /Unexpected argument/)
})

test('project names become valid npm package names', () => {
  assert.equal(toPackageName('My Cool App'), 'my-cool-app')
  assert.equal(toPackageName('./apps/Inventory_UI'), 'inventory_ui')
  assert.equal(toPackageName('...'), 'my-app')
})

test('the manifest drops template identity and keeps scripts and dependencies', () => {
  const next = personalizePackage(
    {
      name: 'rigorail',
      version: '0.0.0',
      description: 'x',
      author: 'Ahmed Tolan',
      repository: {},
      scripts: {
        dev: 'vite',
        'check:tooling':
          'node --test scripts/a.test.mjs packages/create-rigorail/index.test.mjs',
      },
      dependencies: { react: '^19' },
    },
    'my-app',
  )
  assert.equal(next.name, 'my-app')
  assert.equal(next.version, '0.1.0')
  assert.equal(next.private, true)
  assert.equal(next.author, undefined)
  assert.deepEqual(next.scripts, {
    dev: 'vite',
    'check:tooling': 'node --test scripts/a.test.mjs',
  })
  assert.deepEqual(next.dependencies, { react: '^19' })
})

test('runs when npm starts it through a node_modules/.bin symlink', () => {
  const bin = path.join(
    mkdtempSync(path.join(tmpdir(), 'create-rigorail-')),
    'create-rigorail',
  )
  symlinkSync(fileURLToPath(new URL('./index.mjs', import.meta.url)), bin)
  const result = spawnSync(process.execPath, [bin, '--help'], {
    encoding: 'utf8',
  })
  assert.equal(result.status, 0)
  assert.match(result.stdout, /Usage: npm create rigorail@latest/)
})
