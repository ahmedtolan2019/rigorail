import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en, ar } from './resources'
let storageKey = 'foundation:language'
const language = 'en'
void i18n
  .use(initReactI18next)
  .init({
    resources: { en: { common: en }, ar: { common: ar } },
    lng: language,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    initAsync: false,
  })
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
