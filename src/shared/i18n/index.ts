import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en, ar } from './common'

let storageKey = 'foundation:language'
void i18n.use(initReactI18next).init({
  resources: { en: { common: en }, ar: { common: ar } },
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  // Module namespaces resolve shared vocabulary (loading, retry, errors) from common.
  fallbackNS: 'common',
  interpolation: { escapeValue: false },
  initAsync: false,
})

/**
 * Registers a module-owned namespace and returns its name for useTranslation(ns).
 * Keep eager strings (navigation, permission labels) in the module's `i18n.ts` and
 * page-only strings in `messages.ts`, imported by its lazy pages.
 * The Arabic dictionary must contain exactly the English keys, checked at compile time.
 * Prefix keys with the namespace (`requests:navigation`) when read outside the module.
 */
/**
 * Arabic has six plural categories. A key that has an English `_one` form may add
 * Arabic `_zero`, `_two`, `_few` and `_many` forms; i18next falls back to the base
 * key. Count-neutral phrasing ("المحدد: 3") is also fine and needs no extra forms.
 */
export type ArabicPlurals<Keys extends string> = Partial<
  Record<
    Keys extends `${infer Base}_one`
      ? `${Base}_${'zero' | 'two' | 'few' | 'many'}`
      : never,
    string
  >
>

export function defineTranslations<
  const Namespace extends string,
  const Keys extends string,
>(
  namespace: Namespace,
  english: Record<Keys, string>,
  arabic: Record<NoInfer<Keys>, string> & ArabicPlurals<NoInfer<Keys>>,
): Namespace {
  if (namespace === 'common')
    throw new Error('The common namespace belongs to shared code.')
  // Deep-merge with overwrite: a module may register a small eager part (navigation,
  // permission labels) and lazy page strings separately; HMR re-registers edits.
  i18n.addResourceBundle('en', namespace, english, true, true)
  i18n.addResourceBundle('ar', namespace, arabic, true, true)
  return namespace
}

function applyLanguage(value: string) {
  document.documentElement.lang = value
  document.documentElement.dir = i18n.dir(value)
  try {
    localStorage.setItem(storageKey, value)
  } catch {
    /* Session language still works. */
  }
}
i18n.on('languageChanged', applyLanguage)
export default i18n

export function configureLocale(appId: string) {
  storageKey = `${appId}:language`
  let saved: string | null = null
  try {
    saved = localStorage.getItem(storageKey)
  } catch {
    /* Storage is optional. */
  }
  const language =
    saved === 'en' || saved === 'ar'
      ? saved
      : navigator.language.startsWith('ar')
        ? 'ar'
        : 'en'
  void i18n.changeLanguage(language)
}
