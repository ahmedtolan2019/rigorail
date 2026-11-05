import { auditArchitecture } from './architecture-audit.mjs'
const { files, issues } = auditArchitecture(process.cwd())
if (issues.length) {
  console.error(issues.join('\n'))
  process.exitCode = 1
} else
  console.log(
    `Architecture passed: ${files} files; layers, module contracts, imports and runtime cycles checked.`,
  )
