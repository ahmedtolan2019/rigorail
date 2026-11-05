import { allowedImport, isTest } from './architecture-rules.mjs'
import ts from 'typescript'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { isBuiltin } from 'node:module'
import path from 'node:path'

export function auditArchitecture(root) {
  const source = path.join(root, 'src'),
    graph = new Map(),
    issues = []
  const rel = (file) => path.relative(source, file).replaceAll('\\', '/')
  function walk(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const file = path.join(dir, entry.name)
      if (entry.isSymbolicLink()) {
        issues.push(`${rel(file)}: source symlinks bypass ownership checks`)
        return []
      }
      if (entry.isDirectory()) return walk(file)
      if (/\.(mts|cts|mtsx|ctsx)$/.test(entry.name))
        issues.push(
          `${rel(file)}: unsupported source extension; use .ts or .tsx`,
        )
      if (/\.[cm]?jsx?$/.test(entry.name))
        issues.push(`${rel(file)}: application source must use TypeScript`)
      return /\.(ts|tsx)$/.test(entry.name) ? [file] : []
    })
  }
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    if (
      entry.isDirectory() &&
      !['app', 'modules', 'shared', 'test'].includes(entry.name)
    )
      issues.push(`${entry.name}/: unregistered source layer`)
    if (
      entry.isFile() &&
      /\.[cm]?[jt]sx?$/.test(entry.name) &&
      !['main.tsx', 'vite-env.d.ts'].includes(entry.name)
    )
      issues.push(
        `${entry.name}: root application code belongs in an owning layer`,
      )
  }
  const modules = path.join(source, 'modules')
  if (existsSync(modules))
    for (const entry of readdirSync(modules, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        issues.push(
          `modules/${entry.name}: modules must have their own directory`,
        )
        continue
      }
      for (const contract of ['AGENTS.md', 'contract.md', 'public.ts']) {
        const file = path.join(modules, entry.name, contract)
        if (!existsSync(file) || !readFileSync(file, 'utf8').trim())
          issues.push(
            `modules/${entry.name}/${contract}: missing module entry contract`,
          )
      }
    }
  const configPath = path.join(root, 'tsconfig.app.json')
  const config = ts.readConfigFile(configPath, ts.sys.readFile)
  if (config.error)
    throw new Error(
      ts.flattenDiagnosticMessageText(config.error.messageText, '\n'),
    )
  const options = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    root,
  ).options
  const resolutionCache = ts.createModuleResolutionCache(
    root,
    (file) => (ts.sys.useCaseSensitiveFileNames ? file : file.toLowerCase()),
    options,
  )
  const files = walk(source)
  for (const file of files) {
    const name = rel(file),
      tree = ts.createSourceFile(
        file,
        readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
      ),
      edges = []
    function inspect(node) {
      const dynamic =
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword
      const requireCall =
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'require'
      const globCall =
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ['glob', 'globEager'].includes(node.expression.name.text) &&
        node.expression.expression.getText(tree) === 'import.meta'
      if (requireCall || globCall || ts.isImportEqualsDeclaration(node))
        issues.push(
          `${name}: use explicit ESM imports instead of require/import.meta.glob`,
        )
      const specifier =
        ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
          ? node.moduleSpecifier
          : dynamic
            ? node.arguments[0]
            : ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)
              ? node.argument.literal
              : undefined
      if (dynamic && (!specifier || !ts.isStringLiteral(specifier)))
        issues.push(
          `${name}: computed dynamic imports bypass ownership checks; use a literal loader map`,
        )
      if (specifier && ts.isStringLiteral(specifier)) {
        if (isBuiltin(specifier.text) && !isTest(name))
          issues.push(
            `${name}: Node-only module ${specifier.text} is not part of this browser application`,
          )
        let target = ts.resolveModuleName(specifier.text, file, options, ts.sys)
          .resolvedModule?.resolvedFileName
        const internal =
          specifier.text.startsWith('@/') || specifier.text.startsWith('.')
        const asset =
          /\.(css|svg|png|jpg|jpeg|webp|gif|woff2?|json)(\?.*)?$/.test(
            specifier.text,
          )
        if (!target && internal && asset) {
          const clean = specifier.text.split('?')[0]
          const candidate = clean.startsWith('@/')
            ? path.join(source, clean.slice(2))
            : path.resolve(path.dirname(file), clean)
          if (existsSync(candidate)) target = candidate
        }
        if (!target && internal)
          issues.push(`${name}: unresolved internal import ${specifier.text}`)
        if (
          target &&
          internal &&
          !target.startsWith(source + path.sep) &&
          !isTest(name)
        )
          issues.push(
            `${name}: internal application imports must remain inside src`,
          )
        if (target?.startsWith(source + path.sep)) {
          if (!allowedImport(name, rel(target)))
            issues.push(`${name} -> ${rel(target)} violates module ownership`)
          const clause = ts.isImportDeclaration(node)
            ? node.importClause
            : undefined
          const bindings = clause?.namedBindings
          const typeOnly =
            ts.isImportTypeNode(node) ||
            clause?.isTypeOnly ||
            (bindings &&
              ts.isNamedImports(bindings) &&
              !clause.name &&
              bindings.elements.length > 0 &&
              bindings.elements.every((item) => item.isTypeOnly)) ||
            (ts.isExportDeclaration(node) &&
              (node.isTypeOnly ||
                (node.exportClause &&
                  ts.isNamedExports(node.exportClause) &&
                  node.exportClause.elements.length > 0 &&
                  node.exportClause.elements.every((item) => item.isTypeOnly))))
          if (!typeOnly) edges.push(target)
        }
      }
      ts.forEachChild(node, inspect)
    }
    inspect(tree)
    graph.set(file, edges)
  }
  const visited = new Set(),
    active = new Set()
  function visit(file, chain = []) {
    if (active.has(file)) {
      issues.push(`Cycle: ${[...chain, file].map(rel).join(' -> ')}`)
      return
    }
    if (visited.has(file)) return
    active.add(file)
    for (const edge of graph.get(file) ?? []) visit(edge, [...chain, file])
    active.delete(file)
    visited.add(file)
  }
  for (const file of files) visit(file)
  return { files: files.length, issues }
}
