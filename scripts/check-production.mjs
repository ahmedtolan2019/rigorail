import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'

// Build separately from dist/ so this check never replaces the local demo preview.
const output = mkdtempSync(path.join(tmpdir(), 'template-api-check-'))
try {
  execFileSync(
    process.execPath,
    [
      'node_modules/vite/bin/vite.js',
      'build',
      '--mode',
      'production',
      '--outDir',
      output,
      '--emptyOutDir',
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        VITE_APP_MODE: 'api',
        VITE_API_BASE_URL: 'https://api.example.invalid',
        VITE_ENABLE_AI: 'false',
      },
      stdio: 'pipe',
    },
  )
  const manifest = JSON.parse(
    readFileSync(path.join(output, '.vite/manifest.json'), 'utf8'),
  )
  assert(
    !Object.keys(manifest).some((key) => key.includes('/demo/')),
    'API build includes a demo transport module',
  )
  for (const entry of Object.values(manifest))
    if (entry.file.endsWith('.js'))
      assert(
        !readFileSync(path.join(output, entry.file), 'utf8').includes(
          'http://demo.local',
        ),
        'API build includes demo transport data',
      )
  console.log(
    'API-mode build passed; no demo transport shipped. No backend requests were made.',
  )
} catch (error) {
  if (error.stderr) process.stderr.write(error.stderr)
  if (error.stdout) process.stderr.write(error.stdout)
  throw error
} finally {
  rmSync(output, { recursive: true, force: true })
}
