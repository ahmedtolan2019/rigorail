import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Removes a module's registration from src/app/modules.ts source text: its
 * public import and every identifier that import brought in (definition and
 * routes). Returns null when the module is not registered.
 */
export function unregisterModule(source, id) {
  const pattern = new RegExp(
    String.raw`import\s*\{([^}]*)\}\s*from\s*'@/modules/${id}/public'\s*\n`,
  )
  const match = source.match(pattern)
  if (!match) return null
  const names = match[1]
    .split(',')
    .map((name) => name.trim().replace(/^type\s+/, ''))
    .filter(Boolean)
  let next = source.replace(pattern, '')
  for (const name of names)
    next = next.replace(
      new RegExp(String.raw`^\s*(\.\.\.)?${name},?\s*\n`, 'm'),
      '',
    )
  return { source: next, names }
}

/** Browser specs owned by a module by naming convention: `<id>*.spec.ts`. */
export function ownedSpecs(files, id) {
  const stems = [id, id.replace(/s$/, '')]
  return files.filter((file) =>
    stems.some(
      (stem) => file.startsWith(`${stem}.`) || file.startsWith(`${stem}-`),
    ),
  )
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory())
      return ['node_modules', 'dist', '.git'].includes(entry.name)
        ? []
        : walk(file)
    return /\.(ts|tsx|mjs|md)$/.test(entry.name) ? [file] : []
  })
}

function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const ids = args.filter((arg) => !arg.startsWith('--'))
  const root = process.cwd()
  const modulesDir = path.join(root, 'src/modules')
  const existing = readdirSync(modulesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
  if (!ids.length || ids.some((id) => !existing.includes(id))) {
    console.error(
      `Usage: npm run module:remove -- <module...> [--dry-run]\nModules: ${existing.join(', ')}`,
    )
    process.exitCode = 1
    return
  }
  const registry = path.join(root, 'src/app/modules.ts')
  let source = readFileSync(registry, 'utf8')
  const specsDir = path.join(root, 'tests/e2e')
  const specs = existsSync(specsDir) ? readdirSync(specsDir) : []
  // Paths deleted below; a dry run must not list them as leftovers.
  const removed = []
  for (const id of ids) {
    const result = unregisterModule(source, id)
    if (result) source = result.source
    const owned = ownedSpecs(specs, id)
    removed.push(
      path.join(modulesDir, id) + path.sep,
      ...owned.map((spec) => path.join(specsDir, spec)),
    )
    console.log(
      `${dryRun ? 'Would remove' : 'Removing'} ${id}: src/modules/${id}/, ` +
        `registration (${result?.names.join(', ') ?? 'not registered'})` +
        (owned.length ? `, tests/e2e/${owned.join(', tests/e2e/')}` : ''),
    )
    if (dryRun) continue
    rmSync(path.join(modulesDir, id), { recursive: true, force: true })
    for (const spec of owned) rmSync(path.join(specsDir, spec), { force: true })
  }
  if (!dryRun) writeFileSync(registry, source)

  // Report what still mentions the removed modules; those edits need judgment.
  const files = ['src', 'tests', 'docs', 'scripts']
    .map((dir) => path.join(root, dir))
    .filter(existsSync)
    .flatMap(walk)
    .concat(
      ['README.md', 'AGENTS.md', 'ai/plan.md'].map((file) =>
        path.join(root, file),
      ),
    )
    .filter(
      (file) =>
        existsSync(file) &&
        !file.endsWith('remove-module.mjs') &&
        file !== registry &&
        !removed.some((gone) => file === gone || file.startsWith(gone)),
    )
  const leftovers = []
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const id of ids)
      if (
        text.includes(`modules/${id}`) ||
        new RegExp(String.raw`['"\`(]/${id}(?:[/?'"\`)]|$)`).test(text)
      )
        leftovers.push(`${path.relative(root, file)} (${id})`)
  }
  if (leftovers.length)
    console.log(
      `\nStill referenced; update or remove these by hand:\n  ${[...new Set(leftovers)].join('\n  ')}`,
    )
  if (dryRun) return
  const typecheck = spawnSync('npx', ['tsc', '-b'], {
    cwd: root,
    encoding: 'utf8',
  })
  console.log(
    typecheck.status === 0
      ? '\nTypecheck passes. Run npm run check and the browser suite next.'
      : `\nTypecheck errors to resolve:\n${typecheck.stdout}${typecheck.stderr}`,
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
