import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as prettier from 'prettier'

// Scaffolds a domain module the template's way: contract, public API, permissions,
// eager and lazy strings, schema, queries, a lazy list page and a browser smoke test.
// The result passes every check; replace the placeholder schema and endpoint next.

const camel = (id) => id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
const pascal = (id) => camel(id).replace(/^./, (c) => c.toUpperCase())
const title = (id) =>
  id.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase())

export function moduleFiles(id) {
  const name = camel(id),
    Name = pascal(id),
    label = title(id)
  return {
    'AGENTS.md': `# ${label}

Read \`contract.md\` before source. Build screens with \`docs/screen-recipes.md\`
(list, detail, form) and keep ${label.toLowerCase()} business rules here;
other modules consume only \`public.ts\`. Before building screens, find the nearest
pattern in \`docs/pattern-coverage.md\` and follow \`docs/composition-authoring.md\`.
Keep English/Arabic keys in sync. Focused checks: \`npm test -- src/modules/${id}\`
and \`npx playwright test tests/e2e/${id}.spec.ts\`.
`,
    'contract.md': `# ${label} contract

Route \`/${id}\`; \`public.ts\` exports \`${name}Module\` and \`${name}Routes\`.
Strings: eager \`i18n.ts\` (navigation, permission labels), lazy \`messages.ts\`.
Query keys start with \`'${id}'\`; \`refreshOn: ['${id}']\` refreshes them on live events.

## API

| Endpoint | Result |
| --- | --- |
| \`GET /${id}\` | \`{items, total}\` of \`${name}Schema\` records (placeholder; agree with the backend) |

Add the endpoint to \`contracts/openapi.yaml\`, run \`npm run api:types\` and assert
conformance in \`contract.check.ts\`. Show business references, never internal ids.
`,
    'permissions.ts': `import type { PermissionDefinition } from '@/shared/auth/model'

export const permissions = {
  read: '${id}.read',
} as const
export const ${name}Permissions: readonly PermissionDefinition[] = [
  { action: permissions.read, labelKey: '${id}:permissionRead' },
]
`,
    'i18n.ts': `import { defineTranslations } from '@/shared/i18n'

// Eager strings: navigation and permission labels. Page strings live in messages.ts.
export const ns = defineTranslations(
  '${id}',
  {
    navigation: '${label}',
    permissionRead: 'View ${label.toLowerCase()}',
  },
  {
    navigation: '${label}',
    permissionRead: 'عرض ${label.toLowerCase()}',
  },
)
`,
    'messages.ts': `import { defineTranslations } from '@/shared/i18n'

// Page strings, loaded with the lazy page. Translate the Arabic values.
export const ns = defineTranslations(
  '${id}',
  {
    subtitle: 'Describe what people do here.',
    emptyTitle: 'Nothing here yet',
    emptyHint: 'Records appear here once the backend returns them.',
  },
  {
    subtitle: 'صف ما يفعله المستخدمون هنا.',
    emptyTitle: 'لا يوجد شيء بعد',
    emptyHint: 'تظهر السجلات هنا عندما يعيدها الخادم.',
  },
)
`,
    'schema.ts': `import { z } from 'zod'

/** Placeholder record; replace with the agreed contract. */
export const ${name}Schema = z.object({
  /** Internal identifier for URLs and API calls. Never shown to users. */
  id: z.string(),
  /** Business reference shown in the UI. */
  reference: z.string(),
  name: z.string(),
})
export type ${Name}Record = z.infer<typeof ${name}Schema>
export const ${name}ListSchema = z.object({
  items: z.array(${name}Schema),
  total: z.number().int().nonnegative(),
})
`,
    'queries.ts': `import { queryOptions } from '@tanstack/react-query'
import type { ApiClient } from '@/shared/api/client'
import { ${name}ListSchema } from './schema'

// Keys start with the module id so live updates and invalidation stay scoped.
export const ${name}Keys = {
  all: (scope: string) => ['${id}', scope] as const,
}
export const ${name}ListOptions = (api: ApiClient, scope: string) =>
  queryOptions({
    queryKey: [...${name}Keys.all(scope), 'list'],
    queryFn: ({ signal }) => api.request('/${id}', ${name}ListSchema, { signal }),
  })
`,
    'routes.ts': `import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { rootRoute } from '@/shared/routing/root'

export const ${name}Routes = [
  createRoute({
    getParentRoute: () => rootRoute,
    path: '${id}',
    component: lazyRouteComponent(() => import('./pages/list')),
  }),
] as const
`,
    'public.ts': `import { linkOptions } from '@tanstack/react-router'
import { LayoutGrid } from 'lucide-react'
import type { ModuleDefinition } from '@/shared/routing/module'
import { ns } from './i18n'
import { permissions, ${name}Permissions } from './permissions'
export { ${name}Routes } from './routes'

export const ${name}Module = {
  id: ns,
  navigation: {
    link: linkOptions({ to: '/${id}' }),
    labelKey: '${id}:navigation',
    icon: LayoutGrid,
    section: 'main',
    requires: { action: permissions.read },
  },
  permissions: ${name}Permissions,
  refreshOn: ['${id}'],
} satisfies ModuleDefinition
`,
    'pages/list.tsx': `import { useTranslation } from 'react-i18next'
import { AccessBoundary } from '@/shared/auth/access'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/shared/ui/empty'
import { Illustration } from '@/shared/ui/illustration'
import { PageHeader } from '@/shared/ui/page'
import { ns } from '../messages'
import { ns as eager } from '../i18n'
import { permissions } from '../permissions'

// Start from the nearest composition (docs/pattern-coverage.md): replace this empty
// state with the list, then add loading, error and permission states.
export default function ${Name}List() {
  return (
    <AccessBoundary action={permissions.read}>
      <Content />
    </AccessBoundary>
  )
}

function Content() {
  const { t } = useTranslation(ns)
  return (
    <>
      <PageHeader title={t(\`\${eager}:navigation\`)} description={t('subtitle')} />
      <Empty className="rounded-xl border">
        <EmptyHeader>
          <EmptyMedia>
            <Illustration name="empty" />
          </EmptyMedia>
          <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
          <EmptyDescription>{t('emptyHint')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </>
  )
}
`,
  }
}

export function registerModule(source, id) {
  const name = camel(id)
  const anchor =
    "import type { ModuleDefinition } from '@/shared/routing/module'\n"
  if (!source.includes(anchor) || source.includes(`'@/modules/${id}/public'`))
    return null
  return source
    .replace(
      anchor,
      `${anchor}import { ${name}Module, ${name}Routes } from '@/modules/${id}/public'\n`,
    )
    .replace(
      /(export const modules: readonly ModuleDefinition\[\] = \[\n)/,
      `$1  ${name}Module,\n`,
    )
    .replace(/(export const moduleRoutes = \[\n)/, `$1  ...${name}Routes,\n`)
}

async function write(file, content) {
  const options = (await prettier.resolveConfig(file)) ?? {}
  writeFileSync(
    file,
    await prettier.format(content, { ...options, filepath: file }),
  )
}

async function main() {
  const [id, ...rest] = process.argv.slice(2)
  if (!id || rest.length || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(id)) {
    console.error('Usage: npm run module:create -- <kebab-case-id>')
    process.exitCode = 1
    return
  }
  const dir = path.join('src/modules', id)
  if (existsSync(dir)) {
    console.error(`src/modules/${id} already exists.`)
    process.exitCode = 1
    return
  }
  const registry = 'src/app/modules.ts'
  const registered = registerModule(readFileSync(registry, 'utf8'), id)
  if (!registered) {
    console.error(`Could not register ${id} in ${registry}; edit it by hand.`)
    process.exitCode = 1
    return
  }
  for (const [file, content] of Object.entries(moduleFiles(id))) {
    const target = path.join(dir, file)
    mkdirSync(path.dirname(target), { recursive: true })
    await write(target, content)
  }
  await write(registry, registered)
  await write(
    `tests/e2e/${id}.spec.ts`,
    `import { expect, test } from '@playwright/test'

test('${id} opens from navigation', async ({ page }) => {
  await page.goto('/${id}')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
`,
  )
  console.log(
    `Created src/modules/${id}, registered it and added tests/e2e/${id}.spec.ts.\n` +
      'Next: agree the API, update schema.ts/contract.md and contracts/openapi.yaml,\n' +
      'then follow docs/screen-recipes.md for the list, detail and form screens.\n' +
      'Run npm run check:fast while editing.',
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main()
