import { readdirSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
const root = process.cwd(),
  modules = path.join(root, 'src/modules')
const names = readdirSync(modules, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()
const [name, ...extra] = process.argv.slice(2)
if (extra.length || (name && name !== '--help' && !names.includes(name))) {
  console.error('Choose an existing module: npm run context -- <module>')
  process.exitCode = 1
} else if (!name || name === '--help') {
  console.log(
    'Read root AGENTS.md once, then request only the owning module context.\nUsage: npm run context -- <module>\n\nModules:',
  )
  for (const module of names)
    console.log(`  ${module} -> src/modules/${module}/contract.md`)
  console.log(
    '\nFor shared/platform changes: docs/architecture.md and its context map.\nUI component lookup: docs/component-catalog.md.\nQuick checks: npm run check:fast. Full completion gate: npm run check.',
  )
} else {
  const base = path.join(modules, name)
  function walk(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? walk(path.join(dir, entry.name))
        : entry.isSymbolicLink()
          ? []
          : [path.join(dir, entry.name)],
    )
  }
  const files = walk(base).filter((file) => /\.tsx?$/.test(file))
  for (const doc of ['AGENTS.md', 'contract.md']) {
    console.log(`\n--- src/modules/${name}/${doc} ---`)
    console.log(readFileSync(path.join(base, doc), 'utf8').trim())
  }
  console.log('\nOwned source (read only files needed for your task):')
  for (const file of files) console.log(`  ${path.relative(root, file)}`)
  const contracts = new Set()
  for (const file of files)
    for (const match of readFileSync(file, 'utf8').matchAll(
      /@\/modules\/([^/]+)\/public/g,
    ))
      if (match[1] !== name) contracts.add(match[1])
  for (const dependency of contracts)
    if (existsSync(path.join(modules, dependency, 'contract.md')))
      console.log(`Public dependency: src/modules/${dependency}/contract.md`)
  console.log(
    `\nStart with src/modules/${name}/public.ts. For public-contract changes, start a consumer search with:\nrg -n '${name}/public' src/app src/modules\n\nFocused checks: npm run check:fast`,
  )
  if (
    files.some(
      (file) => file.endsWith('.test.ts') || file.endsWith('.test.tsx'),
    )
  )
    console.log(`npm test -- src/modules/${name}`)
  console.log(
    'Use the contract for additional affected tests. Browser tests are risk-based.\nUpdate ai/plan.md with the handoff; do not load the entire source tree.',
  )
}
