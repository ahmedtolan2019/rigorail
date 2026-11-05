import { defineTranslations } from '@/shared/i18n'

export function registerCopy(copy: Record<string, readonly [string, string]>) {
  defineTranslations(
    'compositions',
    Object.fromEntries(Object.entries(copy).map(([k, v]) => [k, v[0]])),
    Object.fromEntries(Object.entries(copy).map(([k, v]) => [k, v[1]])),
  )
}

export function downloadText(name: string, text: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
