#!/usr/bin/env node
// Creates a new project from the Rigorail template:
//   npm create rigorail@latest my-app
// Downloads the template from GitHub, renames the package, initializes git and
// prints the next steps. No dependencies: Node 20+ with fetch and the system tar.
import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'

export const REPOSITORY = 'ahmedtolan2019/rigorail'
const HELP = `Usage: npm create rigorail@latest [directory] [-- options]

Options:
  --ref <branch|tag>  Template version to use (default: main)
  --install           Run npm install after creating the project
  --no-git            Do not initialize a git repository
  -h, --help          Show this help`

/** Parses CLI arguments into { directory, ref, install, git, help }. */
export function parseArgs(argv) {
  const options = {
    directory: '',
    ref: 'main',
    install: false,
    git: true,
    help: false,
  }
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === '-h' || arg === '--help') options.help = true
    else if (arg === '--install') options.install = true
    else if (arg === '--no-git') options.git = false
    else if (arg === '--ref') options.ref = argv[++index] ?? ''
    else if (arg.startsWith('--ref=')) options.ref = arg.slice(6)
    else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`)
    else if (!options.directory) options.directory = arg
    else throw new Error(`Unexpected argument: ${arg}`)
  }
  if (!options.ref) throw new Error('--ref needs a branch or tag name.')
  return options
}

/** npm package names: lowercase, URL-safe, no leading dot or underscore. */
export function toPackageName(directory) {
  const name = path
    .basename(path.resolve(directory))
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[._-]+|[-]+$/g, '')
  return name || 'my-app'
}

/** Turns the template's package.json into the new project's own manifest. */
export function personalizePackage(manifest, name) {
  const next = { ...manifest, name, version: '0.1.0', private: true }
  for (const key of [
    'description',
    'author',
    'homepage',
    'repository',
    'bugs',
    'keywords',
  ])
    delete next[key]
  return next
}

async function askDirectory() {
  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  const answer = await prompt.question('Project directory (my-app): ')
  prompt.close()
  return answer.trim() || 'my-app'
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  return result.status === 0
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log(HELP)
    return
  }
  const directory = options.directory || (await askDirectory())
  const target = path.resolve(directory)
  if (existsSync(target) && readdirSync(target).length)
    throw new Error(
      `${directory} is not empty. Choose a new or empty directory.`,
    )

  // RIGORAIL_ARCHIVE points at a local .tar.gz (testing or offline mirrors).
  const local = process.env.RIGORAIL_ARCHIVE
  const archive = local ?? path.join(tmpdir(), `rigorail-${process.pid}.tar.gz`)
  if (!local) {
    const url = `https://codeload.github.com/${REPOSITORY}/tar.gz/${encodeURIComponent(options.ref)}`
    console.log(`Downloading Rigorail (${options.ref})...`)
    const response = await fetch(url)
    if (!response.ok)
      throw new Error(
        `Download failed (${response.status}). Check --ref and your connection.`,
      )
    writeFileSync(archive, Buffer.from(await response.arrayBuffer()))
  }
  mkdirSync(target, { recursive: true })
  try {
    if (!run('tar', ['-xzf', archive, '-C', target, '--strip-components=1']))
      throw new Error('Could not extract the template. Is tar available?')
  } finally {
    if (!local) rmSync(archive, { force: true })
  }

  // The initializer itself is not part of a new project.
  rmSync(path.join(target, 'packages', 'create-rigorail'), {
    recursive: true,
    force: true,
  })
  if (
    existsSync(path.join(target, 'packages')) &&
    !readdirSync(path.join(target, 'packages')).length
  )
    rmSync(path.join(target, 'packages'), { recursive: true, force: true })
  const manifestPath = path.join(target, 'package.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  writeFileSync(
    manifestPath,
    JSON.stringify(
      personalizePackage(manifest, toPackageName(directory)),
      null,
      2,
    ) + '\n',
  )

  if (options.git && run('git', ['init', '-q'], target)) {
    run('git', ['add', '-A'], target)
    run(
      'git',
      ['commit', '-q', '-m', 'chore: start from the Rigorail template'],
      target,
    )
  }
  if (options.install) run('npm', ['install'], target)

  const relative = path.relative(process.cwd(), target) || '.'
  console.log(`
Created ${relative}.

Next steps:
  cd ${relative}
  ${options.install ? '' : 'npm install\n  '}npm run dev          # http://localhost:5173, demo data, no backend needed

Then open it with your coding agent and start with:
  "Read AGENTS.md, run npm run check, and summarize how this project is organized."
Prompts for common tasks: README.md#prompts-for-your-agent`)
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((error) => {
    console.error(`\n${error instanceof Error ? error.message : error}`)
    process.exitCode = 1
  })
