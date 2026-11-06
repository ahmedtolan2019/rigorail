import { defineTranslations } from '@/shared/i18n'

// Eager strings needed before any page loads: navigation and permission labels.
// Page strings live in messages.ts and load with the lazy pages.
export const ns = defineTranslations(
  'compositions',
  {
    navigation: 'Compositions',
  },
  {
    navigation: 'التراكيب',
  },
)
