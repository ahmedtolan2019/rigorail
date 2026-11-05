import { readdirSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
const root = process.cwd(),
  modules = path.join(root, 'src/modules')
const names = readdirSync(modules, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()
const [name, view, ...extra] = process.argv.slice(2)
if (
  extra.length ||
  (view && name !== 'compositions') ||
  (name && name !== '--help' && !names.includes(name))
) {
  console.error('Choose an existing module: npm run context -- <module>')
  process.exitCode = 1
} else if (!name || name === '--help') {
  console.log(
    'Read root AGENTS.md once, then request only the owning module context.\nUsage: npm run context -- <module>\nPattern: npm run context -- compositions <view>\n\nModules:',
  )
  for (const module of names)
    console.log(`  ${module} -> src/modules/${module}/contract.md`)
  console.log(
    '\nFor shared/platform changes: docs/architecture.md and its context map.\nUI component lookup: docs/component-catalog.md.\nPattern discovery: docs/pattern-coverage.md. Reuse/combine/create: docs/composition-authoring.md.\nQuick checks: npm run check:fast. Full completion gate: npm run check.',
  )
} else if (view) {
  await printCompositionContext(view)
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
    'UI workflows: docs/pattern-coverage.md and docs/composition-authoring.md; use npm run context -- compositions <view> for a reference.\nUse the contract for additional affected tests. Browser tests are risk-based.\nUpdate ai/plan.md with the handoff; do not load the entire source tree.',
  )
}

// Read the explicit loader map without importing or executing application code.
async function printCompositionContext(view) {
  const ts = await import('typescript')
  const base = path.join(modules, 'compositions')
  const pagePath = path.join(base, 'page.tsx')
  const source = ts.createSourceFile(
    pagePath,
    readFileSync(pagePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  let entry
  function findMap(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'views' &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      entry = node.initializer.properties.find(
        (property) =>
          ts.isPropertyAssignment(property) &&
          (ts.isIdentifier(property.name) ||
            ts.isStringLiteral(property.name)) &&
          property.name.text === view,
      )
    }
    ts.forEachChild(node, findMap)
  }
  findMap(source)
  const imports = []
  function findImport(node) {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    )
      imports.push(node.arguments[0].text)
    ts.forEachChild(node, findImport)
  }
  if (entry) findImport(entry)
  const candidate = imports.length === 1 ? path.resolve(base, imports[0]) : null
  const file =
    candidate && candidate.startsWith(base + path.sep)
      ? ['.tsx', '.ts'].map((ext) => candidate + ext).find(existsSync)
      : null
  if (!file) {
    console.error(
      'Unknown composition or unsupported loader. Use docs/pattern-coverage.md and src/modules/compositions/page.tsx; no source was selected.',
    )
    process.exitCode = 1
    return
  }
  console.log(
    `Composition: ${view}\nRoute: /compositions?view=${view}\nSource: ${path.relative(root, file)}`,
  )
  console.log(
    'Read: src/modules/compositions/AGENTS.md, src/modules/compositions/contract.md, docs/composition-authoring.md.\nInventory and acceptance: docs/pattern-coverage.md.\nRead only this source and its direct dependencies as needed. For combinations, look up each view separately.\nAdapt into the owning domain; never import gallery fixtures across modules.\nRegistration: src/modules/compositions/views.ts and src/modules/compositions/page.tsx.\nRegression maps: tests/e2e/composition-patterns.spec.ts, tests/e2e/template.spec.ts and tests/e2e/compositions-rtl.spec.ts.\nStart with focused behavior tests and npm run check:fast; use root AGENTS.md for the completion gate.',
  )
}
