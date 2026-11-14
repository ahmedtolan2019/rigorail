import { expect, test } from 'vitest'
import i18n from '.'

test('Arabic isolates Latin references so they keep their order next to Arabic punctuation', () => {
  i18n.addResource('ar', 'common', 'bidiProbe', 'اعتماد {{reference}}؟ من {{name}}')
  i18n.addResource('en', 'common', 'bidiProbe', 'Approve {{reference}}? By {{name}}')
  expect(i18n.getFixedT('ar')('bidiProbe', { reference: 'REQ-1042', name: 'كريم' })).toBe('اعتماد ⁨REQ-1042⁩؟ من كريم')
  // English is left as it is.
  expect(i18n.getFixedT('en')('bidiProbe', { reference: 'REQ-1042', name: 'Karim' })).toBe('Approve REQ-1042? By Karim')
})
