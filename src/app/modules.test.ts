import { expect, test } from 'vitest'
import i18n from '@/shared/i18n'
import { router } from './router'
import { modules, permissionCatalog } from './modules'

test('every enabled module is fully registered', () => {
  const paths = Object.keys(router.routesByPath)
  for (const module of modules) {
    for (const language of ['en', 'ar'])
      expect(i18n.hasResourceBundle(language, module.id), module.id).toBe(true)
    const entries = module.navigation
      ? Array.isArray(module.navigation)
        ? module.navigation
        : [module.navigation]
      : []
    for (const entry of entries) {
      expect(paths, module.id).toContain(entry.link.to)
      expect(i18n.exists(entry.labelKey), module.id).toBe(true)
    }
  }
})

test('every permission label resolves in each language once the access screens load them', async () => {
  await Promise.all(modules.map((module) => module.permissionLabels?.()))
  for (const language of ['en', 'ar'])
    for (const { labelKey } of permissionCatalog)
      expect(i18n.exists(labelKey, { lng: language }), labelKey).toBe(true)
})
