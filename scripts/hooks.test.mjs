import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import assert from 'node:assert/strict'
const available = ['bash', 'jq'].every(
  (command) => spawnSync(command, ['--version']).status === 0,
)
const options = {
  skip: available
    ? false
    : 'Claude hook checks require optional Bash and jq; app checks remain portable.',
}
function run(script, payload) {
  return spawnSync('bash', [`.claude/hooks/${script}.sh`], {
    input: JSON.stringify({ tool_input: payload }),
    encoding: 'utf8',
  })
}
test(
  'Claude permits public template presets but protects secret overrides and generated files',
  options,
  () => {
    for (const file_path of [
      '.env.example',
      '.env.development',
      '.env.demo',
      'src/app/config.ts',
    ])
      assert.equal(run('protect-files', { file_path }).status, 0, file_path)
    for (const file_path of [
      '.env',
      '.env.local',
      '.env.development.local',
      'package-lock.json',
      'node_modules/x.ts',
      'dist/app.js',
      '.claude/hooks/protect-files.sh',
    ])
      assert.equal(run('protect-files', { file_path }).status, 2, file_path)
  },
)
test(
  'Claude scans both whole-file writes and replacement text without exposing the matched value',
  options,
  () => {
    for (const field of ['content', 'new_string']) {
      const result = run('scan-secrets', { [field]: 'sk-' + 'x'.repeat(24) })
      assert.equal(result.status, 2)
      assert(!result.stderr.includes('x'.repeat(24)))
    }
    assert.equal(
      run('scan-secrets', { content: 'VITE_APP_MODE=demo' }).status,
      0,
    )
  },
)
