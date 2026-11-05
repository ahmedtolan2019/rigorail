import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import assert from 'node:assert/strict'
const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8'))
const files = new Set(),
  visited = new Set()
function visit(key) {
  if (visited.has(key)) return
  visited.add(key)
  const entry = manifest[key]
  assert(entry, `Missing manifest entry: ${key}`)
  files.add(entry.file)
  for (const css of entry.css ?? []) files.add(css)
  for (const dependency of entry.imports ?? []) visit(dependency)
}
for (const [key, entry] of Object.entries(manifest))
  if (entry.isEntry) visit(key)
assert(files.size, 'No application entry found in the build manifest')
let js = 0,
  css = 0
for (const file of files) {
  const bytes = gzipSync(readFileSync(`dist/${file}`)).length
  if (file.endsWith('.js')) js += bytes
  if (file.endsWith('.css')) css += bytes
}
console.log(
  `Static entry graph: JS ${(js / 1024).toFixed(1)} KiB gzip, CSS ${(css / 1024).toFixed(1)} KiB gzip. Lazy route chunks excluded.`,
)
assert(
  js <= 240 * 1024,
  'Entry JavaScript exceeds the 240 KiB gzip budget; inspect eager dependencies.',
)
assert(
  css <= 40 * 1024,
  'Entry CSS exceeds the 40 KiB gzip budget; inspect style growth.',
)
