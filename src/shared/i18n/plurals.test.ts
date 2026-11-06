import { expect, test } from 'vitest'
import i18n from '.'

test('Arabic counts use their grammatical plural forms', async () => {
  const t = i18n.getFixedT('ar')
  expect(t('uploadCount', { count: 1 })).toBe('يمكنك إرفاق ملف واحد فقط.')
  expect(t('uploadCount', { count: 2 })).toBe('يمكنك إرفاق ملفين فقط.')
  expect(t('uploadCount', { count: 5 })).toBe('يمكنك إرفاق 5 ملفات كحد أقصى.')
  expect(t('uploadCount', { count: 11 })).toBe('يمكنك إرفاق 11 ملفًا كحد أقصى.')
  expect(t('uploadCount', { count: 100 })).toBe('يمكنك إرفاق 100 ملف كحد أقصى.')
  expect(i18n.getFixedT('en')('uploadCount', { count: 1 })).toBe(
    'You can attach only 1 file.',
  )
})
