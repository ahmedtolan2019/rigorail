import { expect, test } from 'vitest'
import i18n from '@/shared/i18n'
import { router } from './router'
import { modules, permissionCatalog } from './modules'

test('every enabled module is fully registered', () => {
  const paths = Object.keys(router.routesByPath)
  for (const module of modules) {
    for (const language of ['en', 'ar'])
      expect(i18n.hasResourceBundle(language, module.id), module.id).toBe(true)
    if (!module.navigation) continue
    expect(paths, module.id).toContain(module.navigation.link.to)
    expect(i18n.exists(module.navigation.labelKey), module.id).toBe(true)
  }
})

test('every permission label resolves in each language', () => {
  for (const language of ['en', 'ar'])
    for (const { labelKey } of permissionCatalog)
      expect(i18n.exists(labelKey, { lng: language }), labelKey).toBe(true)
})
